"""Automated email responder utility.

This module provides a small command line program that connects to an
IMAP-enabled mailbox, looks for unread messages, and replies to them with a
templated response over SMTP.  Configuration is supplied through environment
variables so that credentials never have to be committed to the repository.

The module is intentionally dependency free (beyond the Python standard
library) so it can run in minimal environments such as serverless jobs or
cron tasks.  Run ``python auto_responder.py --help`` for usage information.
"""

from __future__ import annotations

import argparse
import email
import email.utils
import imaplib
import json
import os
import smtplib
import ssl
import sys
from dataclasses import dataclass
from email.message import EmailMessage
from pathlib import Path
from typing import Iterable, List, Optional, Sequence, Tuple


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


@dataclass
class ResponderConfig:
    """Configuration for the auto responder.

    Attributes are mostly self explanatory.  ``reply_body`` can contain the
    ``{sender_name}`` placeholder, which will be substituted with a best-effort
    guess of the sender's display name.
    """

    email_address: str
    email_password: str
    imap_host: str
    imap_port: int = 993
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 465
    reply_subject_prefix: str = "Re: "
    reply_body: str = (
        "Hi {sender_name},\n\n"
        "Thanks for reaching out. This is an automated response letting you "
        "know your email was received. I'll get back to you as soon as I can.\n\n"
        "Best,\n"
        "Auto Responder"
    )
    responded_cache_file: Path = Path(".auto_responder_cache.json")

    @classmethod
    def from_env(cls) -> "ResponderConfig":
        """Create a :class:`ResponderConfig` from environment variables."""

        def env(name: str, default: Optional[str] = None) -> str:
            value = os.getenv(name, default)
            if value is None:
                raise SystemExit(f"Missing required environment variable: {name}")
            return value

        def env_int(name: str, default: Optional[int] = None) -> int:
            raw = os.getenv(name)
            if raw is None:
                if default is None:
                    raise SystemExit(
                        f"Missing required environment variable: {name}"
                    )
                return default
            try:
                return int(raw)
            except ValueError as exc:
                raise SystemExit(f"Environment variable {name} must be an integer") from exc

        return cls(
            email_address=env("AUTO_RESPONDER_EMAIL"),
            email_password=env("AUTO_RESPONDER_PASSWORD"),
            imap_host=env("AUTO_RESPONDER_IMAP_HOST"),
            imap_port=env_int("AUTO_RESPONDER_IMAP_PORT", 993),
            smtp_host=env("AUTO_RESPONDER_SMTP_HOST", "smtp.gmail.com"),
            smtp_port=env_int("AUTO_RESPONDER_SMTP_PORT", 465),
            reply_subject_prefix=os.getenv("AUTO_RESPONDER_SUBJECT_PREFIX", "Re: "),
            reply_body=os.getenv("AUTO_RESPONDER_BODY", cls.reply_body),
            responded_cache_file=Path(
                os.getenv("AUTO_RESPONDER_CACHE_FILE", ".auto_responder_cache.json")
            ),
        )


# ---------------------------------------------------------------------------
# Core responder implementation
# ---------------------------------------------------------------------------


class AutoResponder:
    """A helper that replies to unread emails.

    The responder keeps track of which messages have already received an
    automated reply by storing IMAP UIDs in a JSON cache file.
    """

    def __init__(self, config: ResponderConfig) -> None:
        self.config = config
        self._responded_uids = self._load_cache()

    # -- State handling -----------------------------------------------------
    def _load_cache(self) -> List[str]:
        if not self.config.responded_cache_file.exists():
            return []
        try:
            with self.config.responded_cache_file.open("r", encoding="utf-8") as fh:
                data = json.load(fh)
                if isinstance(data, list):
                    return [str(uid) for uid in data]
        except json.JSONDecodeError:
            pass
        return []

    def _save_cache(self) -> None:
        with self.config.responded_cache_file.open("w", encoding="utf-8") as fh:
            json.dump(self._responded_uids, fh, indent=2)

    # -- IMAP helpers -------------------------------------------------------
    def _connect_imap(self) -> imaplib.IMAP4_SSL:
        try:
            connection = imaplib.IMAP4_SSL(
                self.config.imap_host, self.config.imap_port
            )
            connection.login(self.config.email_address, self.config.email_password)
            return connection
        except imaplib.IMAP4.error as exc:
            raise SystemExit(f"Failed to connect to IMAP server: {exc}") from exc

    def _fetch_unseen_uids(self, imap_conn: imaplib.IMAP4_SSL) -> List[str]:
        imap_conn.select("INBOX")
        status, response = imap_conn.search(None, "UNSEEN")
        if status != "OK":
            return []
        uids = response[0].split()
        return [uid.decode("utf-8") for uid in uids if uid]

    def _fetch_message(self, imap_conn: imaplib.IMAP4_SSL, uid: str) -> email.message.Message:
        status, response = imap_conn.fetch(uid, "(RFC822)")
        if status != "OK" or not response:
            raise RuntimeError(f"Unable to fetch message UID {uid}")
        _, raw_message = response[0]
        return email.message_from_bytes(raw_message)

    # -- SMTP helpers -------------------------------------------------------
    def _connect_smtp(self) -> smtplib.SMTP_SSL:
        try:
            context = ssl.create_default_context()
            server = smtplib.SMTP_SSL(
                self.config.smtp_host, self.config.smtp_port, context=context
            )
            server.login(self.config.email_address, self.config.email_password)
            return server
        except (smtplib.SMTPException, OSError) as exc:
            raise SystemExit(f"Failed to connect to SMTP server: {exc}") from exc

    def _send_reply(
        self,
        smtp_conn: smtplib.SMTP_SSL,
        original_message: email.message.Message,
        recipient: str,
        body: str,
    ) -> None:
        reply = EmailMessage()
        subject = original_message.get("Subject", "")
        reply["Subject"] = f"{self.config.reply_subject_prefix}{subject}".strip()
        reply["From"] = self.config.email_address
        reply["To"] = recipient

        # Preserve threading information if present.
        if message_id := original_message.get("Message-ID"):
            reply["In-Reply-To"] = message_id
            reply["References"] = message_id

        reply.set_content(body)
        smtp_conn.send_message(reply)

    # -- Message processing -------------------------------------------------
    def _extract_sender(self, message: email.message.Message) -> Tuple[str, str]:
        name, addr = email.utils.parseaddr(message.get("From", ""))
        return name or addr, addr

    def _extract_text_body(self, message: email.message.Message) -> str:
        if message.is_multipart():
            for part in message.walk():
                content_type = part.get_content_type()
                disposition = part.get("Content-Disposition", "").lower()
                if content_type == "text/plain" and "attachment" not in disposition:
                    payload = part.get_payload(decode=True)
                    if payload is not None:
                        return payload.decode(part.get_content_charset() or "utf-8", errors="replace")
        else:
            payload = message.get_payload(decode=True)
            if payload is not None:
                return payload.decode(message.get_content_charset() or "utf-8", errors="replace")
        return ""

    def _format_reply_body(self, sender_name: str) -> str:
        return self.config.reply_body.format(sender_name=sender_name or "there")

    # -- Public API ---------------------------------------------------------
    def run(self) -> int:
        """Process unread messages and send replies.

        Returns the number of messages that were successfully replied to.
        """

        responded_count = 0
        with self._connect_imap() as imap_conn:
            uids = self._fetch_unseen_uids(imap_conn)
            pending = [uid for uid in uids if uid not in self._responded_uids]
            if not pending:
                return 0

            smtp_conn = self._connect_smtp()
            with smtp_conn:
                for uid in pending:
                    try:
                        message = self._fetch_message(imap_conn, uid)
                    except Exception:
                        continue

                    sender_name, sender_email = self._extract_sender(message)
                    if not sender_email:
                        continue

                    body = self._format_reply_body(sender_name)
                    self._send_reply(smtp_conn, message, sender_email, body)
                    self._responded_uids.append(uid)
                    responded_count += 1

        if responded_count:
            self._save_cache()
        return responded_count


# ---------------------------------------------------------------------------
# Command line interface
# ---------------------------------------------------------------------------


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Automated email responder")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Connect to IMAP but skip sending emails; useful for testing.",
    )
    return parser.parse_args(argv)


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    config = ResponderConfig.from_env()
    responder = AutoResponder(config)
    if args.dry_run:
        with responder._connect_imap() as imap_conn:  # noqa: SLF001 - CLI helper
            uids = responder._fetch_unseen_uids(imap_conn)
            pending = [uid for uid in uids if uid not in responder._responded_uids]
        print(f"Found {len(pending)} unread messages to respond to.")
        return 0
    count = responder.run()
    print(f"Sent {count} auto-replies.")
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    sys.exit(main())

