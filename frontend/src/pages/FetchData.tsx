import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Brain, TrendingUp, AlertTriangle,
  CheckCircle2, Loader2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Header from "@/components/Header";
import { getCurrentUser, logoutDemoUser, type DemoUser } from "@/lib/demoAuth";
import { searchStocks, type StockEntry } from "@/data/stockSearch";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const FEATURED = [
  { ticker: "AAPL",  name: "Apple Inc.",      sector: "Technology",     color: "#6366f1" },
  { ticker: "GOOGL", name: "Alphabet Inc.",    sector: "Technology",     color: "#8b5cf6" },
  { ticker: "MSFT",  name: "Microsoft Corp.",  sector: "Technology",     color: "#0ea5e9" },
  { ticker: "TSLA",  name: "Tesla Inc.",        sector: "EV / Energy",    color: "#ef4444" },
  { ticker: "NVDA",  name: "NVIDIA Corp.",      sector: "Semiconductors", color: "#22c55e" },
];

const INTERVALS = [
  { label: "1 Day",  value: "1d",  yearsBack: 1, description: "Daily OHLCV · 1 year" },
  { label: "1 Week", value: "1wk", yearsBack: 3, description: "Weekly OHLCV · 3 years" },
];

function getDateRange(yearsBack: number) {
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - yearsBack);
  return {
    start: start.toISOString().split("T")[0],
    end:   end.toISOString().split("T")[0],
  };
}

function toCSV(rows: any[]): string {
  const header = "Date,Open,High,Low,Close,Volume\n";
  const body   = rows
    .map(r => `${r.date.split(" ")[0]},${r.open},${r.high},${r.low},${r.close},${r.volume}`)
    .join("\n");
  return header + body;
}

type Step = "idle" | "fetching" | "running" | "done" | "error";

export default function FetchData() {
  const navigate = useNavigate();
  const [user, setUser] = useState<DemoUser | null>(null);

  // Stock selection
  const [selectedTicker,   setSelectedTicker]   = useState("AAPL");
  const [selectedInterval, setSelectedInterval] = useState(INTERVALS[0]);
  const [searchInput,      setSearchInput]      = useState("");
  const [searchActive,     setSearchActive]     = useState(false);
  const [suggestions,      setSuggestions]      = useState<StockEntry[]>([]);
  const [showDrop,         setShowDrop]         = useState(false);
  const [highlightIdx,     setHighlightIdx]     = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  // Fetch + model state
  const [step,        setStep]        = useState<Step>("idle");
  const [stepMsg,     setStepMsg]     = useState("");
  const [rowsFetched, setRowsFetched] = useState<number | null>(null);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => { setUser(getCurrentUser()); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logoutDemoUser(); setUser(null); navigate("/login"); };

  const reset = () => { setStep("idle"); setError(null); setRowsFetched(null); };

  const selectFeatured = (ticker: string) => {
    setSelectedTicker(ticker);
    setSearchInput(""); setSearchActive(false);
    setSuggestions([]); setShowDrop(false);
    reset();
  };

  const selectSuggestion = useCallback((stock: StockEntry) => {
    setSelectedTicker(stock.ticker);
    setSearchInput(stock.ticker); setSearchActive(true);
    setSuggestions([]); setShowDrop(false); setHighlightIdx(-1);
    reset();
  }, []);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setSearchInput(val); setHighlightIdx(-1);
    if (!val.trim()) { setSuggestions([]); setShowDrop(false); return; }
    const res = searchStocks(val, 7);
    setSuggestions(res); setShowDrop(res.length > 0);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showDrop || !suggestions.length) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setHighlightIdx(i => Math.min(i+1, suggestions.length-1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setHighlightIdx(i => Math.max(i-1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const p = highlightIdx >= 0 ? suggestions[highlightIdx] : suggestions[0]; if (p) selectSuggestion(p); }
    else if (e.key === "Escape") setShowDrop(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      selectSuggestion(highlightIdx >= 0 ? suggestions[highlightIdx] : suggestions[0]);
    } else {
      const t = searchInput.trim();
      if (!t) return;
      setSelectedTicker(t); setSearchActive(true); setShowDrop(false); reset();
    }
  };

  const handleFetchAndPredict = async () => {
    setError(null);
    setStep("fetching");
    setStepMsg(`Fetching ${selectedTicker} (${selectedInterval.label}) from Yahoo Finance…`);
    setRowsFetched(null);

    try {
      const { start, end } = getDateRange(selectedInterval.yearsBack);
      const params = new URLSearchParams({ ticker: selectedTicker, interval: selectedInterval.value, start, end });

      const res = await fetch(`${API_BASE}/api/historical-data?${params}`);
      if (!res.ok) throw new Error("Backend unreachable. Ensure the server is running.");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch market data.");
      if (!json.data || json.data.length < 55)
        throw new Error(`Only ${json.data?.length ?? 0} rows returned — need at least 55 for technical indicators.`);

      setRowsFetched(json.data.length);
      toast.success(`Fetched ${json.data.length} rows for ${selectedTicker}`);

      setStep("running");
      setStepMsg("Running TD3 model inference…");

      const csv  = toCSV(json.data);
      const blob = new Blob([csv], { type: "text/csv" });
      const file = new File([blob], `${selectedTicker}_${selectedInterval.value}.csv`, { type: "text/csv" });
      const form = new FormData();
      form.append("file", file);

      const modelRes = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: form });
      if (!modelRes.ok) throw new Error("Model inference failed.");
      const modelJson = await modelRes.json();
      if (!modelJson.success) throw new Error(modelJson.error || "Model returned an error.");

      setStep("done");
      toast.success(`Prediction ready — opening dashboard!`);

      setTimeout(() => {
        navigate("/predict", { state: { results: modelJson.results, customTicker: selectedTicker } });
      }, 400);

    } catch (err: any) {
      setError(err.message);
      setStep("error");
    }
  };

  const isRunning = step === "fetching" || step === "running";

  return (
    <div className="min-h-screen bg-background">
      <Header activeView="fetch" user={user} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-10">

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            Live Stock Predictor
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Pick a stock, choose an interval — predictions open on the Predict page.
          </p>
        </motion.div>

        {/* Featured stocks */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Popular Stocks</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {FEATURED.map(s => {
              const isActive = selectedTicker === s.ticker && !searchActive;
              return (
                <button
                  key={s.ticker}
                  onClick={() => selectFeatured(s.ticker)}
                  disabled={isRunning}
                  className={`relative rounded-2xl border p-4 text-left transition-all hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
                    isActive
                      ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  {isActive && <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />}
                  <div className="text-xl font-black mb-1" style={{ color: s.color }}>{s.ticker}</div>
                  <div className="text-xs text-muted-foreground leading-tight">{s.name}</div>
                  <Badge variant="outline" className="mt-2 text-[10px] px-1.5 py-0">{s.sector}</Badge>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Fuzzy search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Search Any Stock</p>

          <div ref={searchRef} className="relative max-w-sm">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  ref={inputRef}
                  placeholder="Type ticker or company name…"
                  value={searchInput}
                  onChange={handleSearchInput}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowDrop(true)}
                  disabled={isRunning}
                  className="pl-9 pr-8 font-mono"
                  autoComplete="off"
                />
                {searchInput && (
                  <button type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => { setSearchInput(""); setSuggestions([]); setShowDrop(false); inputRef.current?.focus(); }}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Button type="submit" variant="outline" size="icon" disabled={isRunning || !searchInput.trim()}>
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <AnimatePresence>
              {showDrop && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
                  className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden"
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={s.ticker} type="button"
                      onMouseDown={() => selectSuggestion(s)}
                      onMouseEnter={() => setHighlightIdx(i)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                        i === highlightIdx ? "bg-primary/10" : "hover:bg-muted/50"
                      } ${i !== 0 ? "border-t border-border/50" : ""}`}
                    >
                      <span className="font-mono font-bold text-primary w-28 shrink-0">{s.ticker}</span>
                      <span className="flex-1 truncate text-muted-foreground">{s.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">{s.exchange}</Badge>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {searchActive && !showDrop && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {selectedTicker} selected
              <button className="ml-2 text-muted-foreground hover:text-foreground"
                onClick={() => { setSearchActive(false); setSelectedTicker("AAPL"); setSearchInput(""); setSuggestions([]); resetResult(); }}>
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Interval */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Interval</p>
          <div className="flex gap-3">
            {INTERVALS.map(iv => (
              <button
                key={iv.value}
                onClick={() => { setSelectedInterval(iv); resetResult(); }}
                disabled={isRunning}
                className={`rounded-xl border px-5 py-3 text-sm font-bold transition-all disabled:opacity-50 disabled:pointer-events-none ${
                  selectedInterval.value === iv.value
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card hover:border-primary/40 text-muted-foreground"
                }`}
              >
                {iv.label}
                <div className="text-[10px] font-normal text-muted-foreground mt-0.5">{iv.description}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-3 flex-wrap">
          <Button
            size="lg"
            className="h-14 px-10 text-base gap-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-60"
            disabled={isRunning || step === "done"}
            onClick={handleFetchAndPredict}
          >
            {isRunning ? (
              <><Loader2 className="h-5 w-5 animate-spin" />{step === "fetching" ? "Fetching data…" : "Running model…"}</>
            ) : step === "done" ? (
              <><CheckCircle2 className="h-5 w-5 text-green-400" />Opening Predict…</>
            ) : (
              <><Brain className="h-5 w-5" />Fetch & Run TD3 Prediction</>
            )}
          </Button>

          {!isRunning && step === "idle" && (
            <p className="text-muted-foreground text-sm">
              Will fetch <span className="text-foreground font-semibold">{selectedTicker}</span>{" "}
              {selectedInterval.description.toLowerCase()} and open the Predict page.
            </p>
          )}
        </motion.div>

        {/* Progress */}
        {(isRunning || step === "done") && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <StepRow
              done={step === "running" || step === "done"}
              active={step === "fetching"}
              label={step === "fetching" ? stepMsg : `Fetched ${rowsFetched ?? "…"} rows for ${selectedTicker}`}
            />
            <StepRow
              done={step === "done"}
              active={step === "running"}
              label={step === "running" ? stepMsg : "TD3 model inference complete"}
            />
            <StepRow
              done={false}
              active={step === "done"}
              label="Opening Predict dashboard…"
            />
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button variant="outline" className="mt-3" onClick={() => { setStep("idle"); setError(null); }}>
              Try Again
            </Button>
          </motion.div>
        )}


      </div>
    </div>
  );
}

function StepRow({ done, active, label }: { done: boolean; active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {done ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
        : active ? <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
        : <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0" />}
      <span className={done ? "text-muted-foreground line-through" : active ? "text-foreground font-medium" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}
