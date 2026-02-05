from datetime import datetime
from math import sin, pi
from pathlib import Path
from random import randint

import joblib
import numpy as np
from flask import Flask, jsonify, request
from tensorflow.keras.models import load_model


app = Flask(__name__)
MODEL_CACHE = {"model": None, "scaler": None}
DEFAULT_LAST_DEMAND = 60000.0


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


def load_artifacts():
    if MODEL_CACHE["model"] is not None and MODEL_CACHE["scaler"] is not None:
        return MODEL_CACHE["model"], MODEL_CACHE["scaler"]

    base_path = Path(__file__).resolve().parent
    model_path = base_path / "model.h5"
    scaler_path = base_path / "scaler.pkl"
    if not scaler_path.exists():
        scaler_path = base_path / "scalar.pkl"

    model = load_model(model_path)
    scaler = joblib.load(scaler_path)
    MODEL_CACHE["model"] = model
    MODEL_CACHE["scaler"] = scaler
    return model, scaler


def predict_next_demand(last_demand, features=None):
    model, scaler = load_artifacts()
    input_data = np.array([[last_demand]])
    input_scaled = scaler.transform(input_data)
    input_scaled = input_scaled.reshape((1, 1, 1))
    if features is None:
        features = [0.0, 0.0, 0.0, 0.0]
    features_array = np.array(features, dtype=float).reshape((1, 4))
    prediction_scaled = model.predict(
        [input_scaled, features_array], verbose=0
    )
    prediction = scaler.inverse_transform(prediction_scaled)
    return float(prediction[0][0])


def build_series_from_prediction(predicted):
    series = []
    amplitude = max(predicted * 0.05, 200)
    for hour in range(0, 24):
        demand = predicted + amplitude * sin((hour / 24) * 2 * pi)
        series.append({"hour": f"{hour:02d}:00", "demand": round(demand, 2)})
    return series


@app.route("/api/forecast", methods=["POST", "OPTIONS"])
def forecast():
    if request.method == "OPTIONS":
        return ("", 204)

    payload = request.get_json(silent=True) or {}
    place = payload.get("place", "Unknown location")
    last_demand = payload.get("lastDemand", payload.get("last_demand"))
    if last_demand in (None, ""):
        last_demand = DEFAULT_LAST_DEMAND

    try:
        predicted = predict_next_demand(float(last_demand))
        series = build_series_from_prediction(predicted)
        summary = f"Predicted next demand: {predicted:,.2f} MW."
        status = (
            "⚠️ Peak Load Detected"
            if predicted > 65000
            else "✅ Normal Load Condition"
        )
    except (OSError, ValueError, RuntimeError) as exc:
        series = build_placeholder_series()
        summary = (
            "Model artifacts not available yet. "
            "Using placeholder forecast data."
        )
        status = f"Model error: {exc}"

    peak = max(series, key=lambda point: point["demand"])
    low = min(series, key=lambda point: point["demand"])

    response = {
        "place": place,
        "generatedAt": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        "summary": summary,
        "chartImageUrl": None,
        "highlights": [
            f"Peak demand around {peak['hour']} at {peak['demand']} MW.",
            f"Lowest demand around {low['hour']} at {low['demand']} MW.",
            status,
        ],
        "series": series,
    }
    return jsonify(response)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
