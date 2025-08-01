# GPT MCP Relay

A lightweight Flask-based relay server for ChatGPT MCP Connectors.

- `POST /gpt-relay` → receives GPT push events
- `GET /mcp` → streams last event via Server-Sent Events (SSE)