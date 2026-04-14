# TD3 Stock Dashboard (AAPL + TCS)

This project has:
- a `FastAPI` backend (`backend/`)
- a `React + Vite` frontend (`frontend/`)

Use both servers in development:
- Backend: `http://127.0.0.1:8001`
- Frontend: `http://127.0.0.1:8080`

## 1) Backend setup and run

From project root:

```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m pip install yfinance ta python-multipart torch
python3 -m uvicorn app:app --port 8001
```

Backend endpoints:
- `http://127.0.0.1:8001/api/data?ticker=AAPL`
- `http://127.0.0.1:8001/api/td3-results?ticker=TCS`

## 2) Frontend setup and run

Open a second terminal, from project root:

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 8080
```

Open:

```text
http://127.0.0.1:8080/
```

## 2.1) Demo auth pages

From the navbar:
- `Login` opens `/login`
- `Sign Up` opens `/signup`
- After login, click your name for `/profile`

Demo login credentials:

```text
Email: demo@td3.ai
Password: Demo@123
```

## 3) Daily quick run

After initial setup, just run:

Terminal 1:

```bash
cd backend
python3 -m uvicorn app:app --port 8001
```

Terminal 2:

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 8080
```

## Troubleshooting

- `Address already in use`:
  - change port (for example `--port 8002`) or stop the old process.
- Frontend loads but API fails:
  - ensure backend is running on `8001`.
- Missing Python packages:
  - run the backend install commands again.

