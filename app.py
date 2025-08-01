from flask import Flask, request, Response, jsonify

app = Flask(__name__)
last_event = {}

# POST endpoint: GPT sends push data here
@app.route("/gpt-relay", methods=["POST"])
def receive_push():
    global last_event
    last_event = request.json
    return jsonify({"status": "ok"}), 200

# GET endpoint: OpenAI calls this to verify the connector
@app.route("/gpt-relay", methods=["GET"])
def verify_push_endpoint():
    return "Relay is active", 200

# SSE endpoint: Streams last event for any frontend listener
@app.route("/mcp", methods=["GET"])
def stream_mcp():
    def event_stream():
        yield f"data: {last_event}\n\n"
    return Response(event_stream(), mimetype="text/event-stream")
