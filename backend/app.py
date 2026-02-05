from datetime import datetime
from math import sin, pi
from random import randint

from flask import Flask, jsonify, request


app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    return response


def build_placeholder_series():
    baseline = randint(850, 980)
    series = []
    for hour in range(0, 24):
        demand = baseline + int(120 * sin((hour / 24) * 2 * pi)) + randint(-25, 25)
        series.append({"hour": f"{hour:02d}:00", "demand": demand})
    return series


@app.route("/api/forecast", methods=["POST", "OPTIONS"])
def forecast():
    if request.method == "OPTIONS":
        return ("", 204)

    payload = request.get_json(silent=True) or {}
    place = payload.get("place", "Unknown location")
    series = build_placeholder_series()
    peak = max(series, key=lambda point: point["demand"])
    low = min(series, key=lambda point: point["demand"])

    response = {
        "place": place,
        "generatedAt": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        "summary": (
            "Placeholder forecast based on historical patterns. "
            "Replace with the AI model output when ready."
        ),
        "chartImageUrl": None,
        "highlights": [
            f"Peak demand around {peak['hour']} at {peak['demand']} MW.",
            f"Lowest demand around {low['hour']} at {low['demand']} MW.",
            "Expect moderate variability through the afternoon window.",
        ],
        "series": series,
    }
    return jsonify(response)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
