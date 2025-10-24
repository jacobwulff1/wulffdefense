import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from auto_responder import AutoResponder, ResponderConfig


class ResponderConfigTests(unittest.TestCase):
    def setUp(self) -> None:
        self._original_env = os.environ.copy()

    def tearDown(self) -> None:
        os.environ.clear()
        os.environ.update(self._original_env)

    def test_from_env_reads_required_values(self) -> None:
        os.environ.update(
            {
                "AUTO_RESPONDER_EMAIL": "bot@example.com",
                "AUTO_RESPONDER_PASSWORD": "secret",
                "AUTO_RESPONDER_IMAP_HOST": "imap.example.com",
                "AUTO_RESPONDER_SMTP_HOST": "smtp.example.com",
                "AUTO_RESPONDER_BODY": "Hello {sender_name}",
                "AUTO_RESPONDER_CACHE_FILE": "cache.json",
            }
        )

        config = ResponderConfig.from_env()

        self.assertEqual(config.email_address, "bot@example.com")
        self.assertEqual(config.email_password, "secret")
        self.assertEqual(config.imap_host, "imap.example.com")
        self.assertEqual(config.smtp_host, "smtp.example.com")
        self.assertEqual(config.reply_body, "Hello {sender_name}")
        self.assertEqual(config.responded_cache_file, Path("cache.json"))


class AutoResponderTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        cache_file = Path(self.tempdir.name) / "cache.json"
        self.config = ResponderConfig(
            email_address="bot@example.com",
            email_password="secret",
            imap_host="imap.example.com",
            smtp_host="smtp.example.com",
            responded_cache_file=cache_file,
        )

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def test_cache_roundtrip(self) -> None:
        responder = AutoResponder(self.config)
        responder._responded_uids.extend(["1", "2"])  # noqa: SLF001 - testing
        responder._save_cache()

        with open(self.config.responded_cache_file, "r", encoding="utf-8") as fh:
            data = json.load(fh)

        self.assertEqual(data, ["1", "2"])

        responder2 = AutoResponder(self.config)
        self.assertEqual(responder2._responded_uids, ["1", "2"])  # noqa: SLF001

    def test_format_reply_body_inserts_sender(self) -> None:
        responder = AutoResponder(self.config)
        message = responder._format_reply_body("Alice")  # noqa: SLF001 - testing
        self.assertIn("Alice", message)


if __name__ == "__main__":
    unittest.main()

