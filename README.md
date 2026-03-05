# AAPL TD3 Prediction Dashboard

Frontend + backend split for visualizing your TD3 model outputs stored in `AAPL_actions_smooth_56_accuracy.csv`.

The app shows:

- **Close price line** on the primary Y-axis
- **TD3 action signal line** on the secondary Y-axis
- **Controls** for date range, smoothing window, and action scaling
- **Performance metrics**: Sharpe ratios, hit rate, correlation, etc.
- **Summary stats** and a **sample table** of the most recent rows

## Project structure

- `frontend/`
  - `index.html` – main dashboard UI
  - `styles.css` – styling
  - `script.js` – chart + analytics logic (talks to the backend)
- `backend/`
  - `app.py` – FastAPI app that serves the CSV as JSON and hosts the frontend
  - `requirements.txt` – Python dependencies
- `AAPL_actions_smooth_56_accuracy.csv` – your existing CSV with `Date,Close,action`

## How to run (backend + frontend together)

1. Create and activate a Python environment (optional but recommended), then install backend deps:

   ```bash
   cd "d:\Final Try\backend"
   pip install -r requirements.txt
   ```

2. Start the FastAPI server with Uvicorn:

   ```bash
   uvicorn app:app --reload --port 8000
   ```

3. Open the dashboard in your browser:

   ```text
   http://localhost:8000/
   ```

The backend reads `AAPL_actions_smooth_56_accuracy.csv` from the project root and exposes it at `/api/data`, and also serves the static files from the `frontend` folder.

