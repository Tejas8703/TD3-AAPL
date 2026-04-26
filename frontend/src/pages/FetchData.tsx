import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Brain, AlertTriangle, Calendar, Search, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import Header from "@/components/Header";
import { getCurrentUser, logoutDemoUser, type DemoUser } from "@/lib/demoAuth";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

interface FetchedRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function FetchData() {
  const navigate = useNavigate();
  const [user, setUser] = useState<DemoUser | null>(null);

  const [ticker, setTicker] = useState("AAPL");
  const [interval, setInterval] = useState("1d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedData, setFetchedData] = useState<FetchedRow[] | null>(null);
  const [processingModel, setProcessingModel] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    logoutDemoUser();
    setUser(null);
    navigate("/login");
  };

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFetchedData(null);

    try {
      const queryParams = new URLSearchParams({
        ticker: ticker.toUpperCase(),
        interval,
      });
      if (startDate) queryParams.append("start", startDate);
      if (endDate) queryParams.append("end", endDate);

      const res = await fetch(`${API_BASE}/api/historical-data?${queryParams.toString()}`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch data from backend.");
      }
      
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Unknown error fetching data.");
      }

      if (!data.data || data.data.length === 0) {
        throw new Error("No data returned for the given parameters.");
      }

      setFetchedData(data.data);
      toast.success(`Successfully fetched ${data.data.length} records!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = () => {
    if (!fetchedData) return "";
    const header = "Date,Open,High,Low,Close,Volume\n";
    const rows = fetchedData.map(r => `${r.date},${r.open},${r.high},${r.low},${r.close},${r.volume}`).join("\n");
    return header + rows;
  };

  const handleDownloadCsv = () => {
    const csvContent = generateCSV();
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${ticker}_${interval}_historical.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Downloaded!");
  };

  const handleRunModel = async () => {
    if (!fetchedData) return;
    setProcessingModel(true);
    setError(null);

    try {
      const csvContent = generateCSV();
      const blob = new Blob([csvContent], { type: "text/csv" });
      const file = new File([blob], `${ticker}_${interval}_data.csv`, { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);

      toast.info("Running TD3 model on fetched data... This may take a moment.");

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to process data through the model.");
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unknown error processing data.");

      toast.success("Model executed successfully!");
      
      // Navigate to predict page and pass the results in state
      navigate("/predict", { state: { results: data.results, customTicker: ticker.toUpperCase() } });
      
    } catch (err: any) {
      setError(err.message);
      setProcessingModel(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeView="fetch" user={user} onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" /> Data Fetcher
          </h1>
          <p className="text-muted-foreground text-lg">
            Download OHLCV historical data directly from Yahoo Finance and run it through the TD3 prediction model.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form Configuration */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Set the parameters for historical data.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFetch} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticker">Stock Ticker</Label>
                    <Input id="ticker" placeholder="AAPL" value={ticker} onChange={(e) => setTicker(e.target.value)} required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="interval">Interval</Label>
                    <Select value={interval} onValueChange={setInterval}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15m">15 Minutes</SelectItem>
                        <SelectItem value="1h">1 Hour</SelectItem>
                        <SelectItem value="1d">1 Day</SelectItem>
                        <SelectItem value="1wk">1 Week</SelectItem>
                        <SelectItem value="1mo">1 Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start">Start Date (Optional)</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="start" type="date" className="pl-9" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end">End Date (Optional)</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="end" type="date" className="pl-9" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  </div>

                  <Button type="submit" className="w-full mt-4" disabled={loading || processingModel}>
                    {loading ? (
                      <span className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Fetching...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Search className="h-4 w-4" /> Fetch Data</span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Display */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="md:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  {fetchedData 
                    ? `Successfully loaded ${fetchedData.length} records for ${ticker.toUpperCase()}` 
                    : "Fetch data to see the preview and run models."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {fetchedData ? (
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className="rounded-md border border-border overflow-hidden flex-1 max-h-[300px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground bg-muted/50 sticky top-0 uppercase">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3 text-right">Open</th>
                            <th className="px-4 py-3 text-right">High</th>
                            <th className="px-4 py-3 text-right">Low</th>
                            <th className="px-4 py-3 text-right">Close</th>
                            <th className="px-4 py-3 text-right">Volume</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fetchedData.slice(0, 50).map((row, i) => (
                            <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                              <td className="px-4 py-2 font-mono">{row.date.split(' ')[0]}</td>
                              <td className="px-4 py-2 text-right">{row.open.toFixed(2)}</td>
                              <td className="px-4 py-2 text-right">{row.high.toFixed(2)}</td>
                              <td className="px-4 py-2 text-right">{row.low.toFixed(2)}</td>
                              <td className="px-4 py-2 text-right">{row.close.toFixed(2)}</td>
                              <td className="px-4 py-2 text-right text-muted-foreground">{row.volume.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {fetchedData.length > 50 && (
                        <div className="p-3 text-center text-xs text-muted-foreground border-t border-border/50 bg-muted/10">
                          Showing first 50 of {fetchedData.length} rows
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                      <Button variant="outline" size="lg" className="h-14 gap-2" onClick={handleDownloadCsv}>
                        <Download className="h-5 w-5" /> Download CSV
                      </Button>
                      <Button size="lg" className="h-14 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={processingModel} onClick={handleRunModel}>
                        {processingModel ? (
                          <span className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Processing...</span>
                        ) : (
                          <span className="flex items-center gap-2"><Brain className="h-5 w-5" /> Run TD3 Model</span>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl bg-muted/5">
                    <div className="text-center text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No data loaded</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
