# webForecast

## Quick start

### Backend (placeholder API)
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
generate a sample forecast. The backend currently returns placeholder data that
you can replace with the Python-based `.pkl` AI model later.
