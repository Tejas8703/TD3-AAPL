export interface TD3Metrics {
  sharpeRatio: number;
  returnPct: number;
  maxDrawdownPct: number;
  finalPortfolioValue: number;
  directionAccuracyPct?: number;
}

export interface TD3OHLC {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TD3Results {
  metrics: TD3Metrics;
  ohlc: TD3OHLC[];
  portfolioHistory: number[];
  actions: number[];
  positions: number[];
}

const TD3_RESULTS_URL = "/td3_results.json";
const API_BASE = import.meta.env.VITE_API_URL || "";

export interface APIDataRow {
  dateStr: string;
  close: number;
  action?: number;
}

export async function fetchStockData(ticker: string): Promise<APIDataRow[]> {
  const apiUrl = API_BASE ? `${API_BASE}/api/data?ticker=${ticker}` : `/api/data?ticker=${ticker}`;
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}


export async function fetchTD3Results(ticker: string = "AAPL"): Promise<TD3Results | null> {
  const apiUrl = API_BASE ? `${API_BASE}/api/td3-results?ticker=${ticker}` : `/api/td3-results?ticker=${ticker}`;
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      // Only AAPL has a static frontend fallback JSON.
      if (ticker.toUpperCase() !== "AAPL") return null;
      const fallback = await fetch(TD3_RESULTS_URL);
      if (!fallback.ok) return null;
      const data: TD3Results = await fallback.json();
      return data;
    }
    const data = await res.json();
    if (!data || data.error) {
      // Do not silently show AAPL data for non-AAPL requests.
      if (ticker.toUpperCase() !== "AAPL") return null;
      const fallback = await fetch(TD3_RESULTS_URL);
      if (!fallback.ok) return null;
      return (await fallback.json()) as TD3Results;
    }
    return data;
  } catch {
    if (ticker.toUpperCase() !== "AAPL") return null;
    try {
      const res = await fetch(TD3_RESULTS_URL);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}

export interface RunTD3Response {
  success: boolean;
  log: string[];
  results?: TD3Results | null;
  error?: string;
}

export async function runTD3Model(episodes = 3): Promise<RunTD3Response> {
  const apiUrl = API_BASE ? `${API_BASE}/api/run-td3` : "/api/run-td3";
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ episodes }),
  });
  const text = await res.text();
  try {
    return JSON.parse(text) as RunTD3Response;
  } catch {
    return {
      success: false,
      log: [text || `HTTP ${res.status}`],
      error: "Invalid response from server",
    };
  }
}

export async function uploadCSVData(file: File): Promise<RunTD3Response> {
  const apiUrl = API_BASE ? `${API_BASE}/api/upload` : "/api/upload";
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!data.success) {
      return { success: false, log: [], error: data.error || "Upload failed." };
    }
    return { success: true, log: ["Model evaluated on uploaded CSV successfully!"], results: data.results };
  } catch (err: any) {
    return { success: false, log: [], error: err.message || "Network error" };
  }
}

