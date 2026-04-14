from pathlib import Path
import csv
import yfinance as yf

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import tempfile
import json
from upload_eval import eval_csv_file


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

@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        return {"success": False, "error": "Must upload a CSV file."}
        
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name
            
        results = eval_csv_file(tmp_path)
        os.remove(tmp_path)
        
        return {"success": True, "results": results}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/td3-results")
def get_td3_results(ticker: str = "AAPL"):
    if ticker.upper() == "TCS":
        tcs_path = BASE_DIR / "tcs_stock_data.csv"
        if tcs_path.exists():
            try:
                # Use a recent window for TCS to keep metrics stable and comparable.
                results = eval_csv_file(str(tcs_path), lookback_rows=756)
                return results
            except Exception as e:
                return {"error": str(e)}
        else:
            return {"error": "TCS data not found on server."}
    else:
        results_path = BASE_DIR / "frontend" / "public" / "td3_results.json"
        if results_path.exists():
            with open(results_path, "r") as f:
                return json.load(f)
        return {"error": "AAPL baseline not found."}

if FRONTEND_DIR.exists():
    app.mount(
        "/",
        StaticFiles(directory=str(FRONTEND_DIR), html=True),
        name="frontend",
    )

