from flask import Flask, request, Response
from threading import Lock

app = Flask(__name__)
events = []
lock = Lock()

@app.route('/gpt-relay', methods=['POST'])
def relay():
    data = request.get_json()
    if not data:
        return 'Invalid payload', 400
    with lock:
        events.append(f"data: {data}\n\n")
    return 'OK', 200

@app.route('/mcp', methods=['GET'])
def stream():
    def event_stream():
        last_event = 0
        while True:
            with lock:
                if len(events) > last_event:
                    yield events[last_event]
                    last_event += 1
    return Response(event_stream(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(port=8080)