# webForecast

## Quick start

### Backend (AI forecast API)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontEnd
python -m http.server 8000
```

Open `http://localhost:8000/index.html` in a browser and use the place input to
generate a forecast. The backend expects `model.h5` and `scaler.pkl` (or
`scalar.pkl`) inside `backend/` and will fall back to placeholder data if they
are missing.
