from pathlib import Path
import csv
import yfinance as yf

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


BASE_DIR = Path(__file__).resolve().parents[1]
CSV_PATH = BASE_DIR / "AAPL_actions_smooth_56_accuracy.csv"
FRONTEND_DIR = BASE_DIR / "frontend" / "dist"

app = FastAPI(title="TD3 AAPL Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/data")
def get_data(ticker: str = "AAPL"):
    """
    Return parsed CSV rows or yfinance data as JSON:
    [{ dateStr, close, action }, ...]
    """
    if ticker.upper() != "AAPL":
        try:
            stock = yf.Ticker(ticker)
            df = stock.history(period="1y")
            rows = []
            for date, row in df.iterrows():
                rows.append({
                    "dateStr": date.strftime('%Y-%m-%d'),
                    "close": float(row["Close"])
                })
            return {"data": rows}
        except Exception:
            return {"data": []}

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

