from flask import Flask, jsonify, render_template, request

from gacha_engine import GachaState

app = Flask(__name__)
state = GachaState()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/state")
def get_state():
    return jsonify(state.to_dict())


@app.route("/api/pull", methods=["POST"])
def pull():
    payload = request.get_json(silent=True) or {}
    count = max(1, min(int(payload.get("count", 1)), 10))
    results = state.pull_many(count)
    return jsonify({"results": results, "state": state.to_dict()})


@app.route("/api/reset", methods=["POST"])
def reset():
    global state
    state = GachaState()
    return jsonify(state.to_dict())


if __name__ == "__main__":
    app.run(debug=True, port=5050)
