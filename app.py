from flask import Flask, request, Response, jsonify
import json

app = Flask(__name__)
last_payload = {}

@app.route("/", methods=["GET"])
def root():
    return jsonify({"status": "ok", "message": "GPT MCP Relay Live"}), 200

@app.route("/gpt-relay", methods=["POST"])
def gpt_relay():
    global last_payload
    last_payload = request.json
    return jsonify({"status": "received"}), 200

@app.route("/mcp", methods=["GET"])
def mcp_stream():
    def stream():
        yield f"data: {json.dumps(last_payload)}\n\n"
    return Response(stream(), mimetype="text/event-stream")
