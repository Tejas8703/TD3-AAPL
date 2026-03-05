from pathlib import Path
import csv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


BASE_DIR = Path(__file__).resolve().parents[1]
CSV_PATH = BASE_DIR / "AAPL_actions_smooth_56_accuracy.csv"
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(title="TD3 AAPL Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/data")
def get_data():
    """
    Return parsed CSV rows as JSON:
    [{ dateStr, close, action }, ...]
    """
    rows = []
    if not CSV_PATH.exists():
        return {"data": rows}

    with CSV_PATH.open(newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                date_str = row["Date"]
                close = float(row["Close"])
                action = float(row["action"])
            except (KeyError, ValueError, TypeError):
                continue

            rows.append(
                {
                    "dateStr": date_str,
                    "close": close,
                    "action": action,
                }
            )

    rows.sort(key=lambda r: r["dateStr"])
    return {"data": rows}


if FRONTEND_DIR.exists():
    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_DIR), html=True),
        name="frontend",
    )

