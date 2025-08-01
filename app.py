from flask import Flask, request, Response, jsonify

app = Flask(__name__)
last_event = {}

@app.route("/gpt-relay", methods=["POST"])
def receive_push():
    global last_event
    last_event = request.json
    return jsonify({"status": "ok"}), 200

@app.route("/gpt-relay", methods=["GET"])
def verify_endpoint():
    return "OK", 200  # <-- This makes OpenAI happy

@app.route("/mcp", methods=["GET"])
def stream_mcp():
    def event_stream():
        yield f"data: {last_event}\n\n"
    return Response(event_stream(), mimetype="text/event-stream")
