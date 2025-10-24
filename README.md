# GPT MCP Relay

A lightweight Flask-based relay server for ChatGPT MCP Connectors.

- `POST /gpt-relay` → receives GPT push events
- `GET /mcp` → streams last event via Server-Sent Events (SSE)

## Automated Email Responder

The repository also includes a standalone script for automatically replying to
emails that arrive in an IMAP inbox. The responder logs in to your mailbox,
looks for unread messages, and sends a templated acknowledgement message over
SMTP.

### Configuration

Set the following environment variables before running the responder:

| Variable | Description |
| --- | --- |
| `AUTO_RESPONDER_EMAIL` | Email address used to log in and send replies. |
| `AUTO_RESPONDER_PASSWORD` | Password or app-specific token for the account. |
| `AUTO_RESPONDER_IMAP_HOST` | Hostname of the IMAP server (e.g. `imap.gmail.com`). |
| `AUTO_RESPONDER_IMAP_PORT` | Optional IMAP port (defaults to `993`). |
| `AUTO_RESPONDER_SMTP_HOST` | Optional SMTP server hostname (defaults to `smtp.gmail.com`). |
| `AUTO_RESPONDER_SMTP_PORT` | Optional SMTP port (defaults to `465`). |
| `AUTO_RESPONDER_SUBJECT_PREFIX` | Optional prefix added to the reply subject (defaults to `Re: `). |
| `AUTO_RESPONDER_BODY` | Optional custom reply body that may reference `{sender_name}`. |
| `AUTO_RESPONDER_CACHE_FILE` | Optional path to store the cache of responded message UIDs. |

### Usage

Run the responder with:

```bash
python auto_responder.py
```

Add `--dry-run` to check how many unread emails would be processed without
sending replies. The script is designed to be scheduled using cron or similar
job schedulers so that incoming mail is acknowledged automatically.
