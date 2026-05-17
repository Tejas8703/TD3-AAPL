import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Copy, Brain, Target, TrendingUp, TrendingDown, Gauge, AlertTriangle, Wallet, UploadCloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Header from "@/components/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, logoutDemoUser, type DemoUser } from "@/lib/demoAuth";
import {
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  Line
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface TD3Metrics {
  sharpeRatio: number;
  returnPct: number;
  maxDrawdownPct: number;
  finalPortfolioValue: number;
  directionAccuracyPct: number;
}

interface OHLC {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TD3Results {
  metrics: TD3Metrics;
  ohlc: OHLC[];
  portfolioHistory: number[];
  actions: number[];
  positions: number[];
}

const CountUpNumber = ({ value, decimals = 0, suffix = "", prefix = "" }: { value: number, decimals?: number, suffix?: string, prefix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    
    let totalDuration = 1000;
    let incrementTime = (totalDuration / 60);
    const gap = end - start;
    let current = start;

    const timer = setInterval(() => {
      current += gap / 60;
      if ((gap > 0 && current >= end) || (gap < 0 && current <= end)) {
        clearInterval(timer);
        setDisplayValue(end);
      } else {
        setDisplayValue(current);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{prefix}{displayValue.toFixed(decimals)}{suffix}</>;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const close = payload.find((p: any) => p.dataKey === "close")?.value;
    const action = payload.find((p: any) => p.dataKey === "action")?.value;
    
    let actionLabel = "HOLD";
    let actionColor = "text-gray-400";
    if (action > 0.1) { actionLabel = "BUY"; actionColor = "text-green-500"; }
    else if (action < -0.1) { actionLabel = "SELL"; actionColor = "text-red-500"; }

    return (
      <div className="bg-background/95 border border-border p-3 rounded-lg shadow-lg">
        <p className="text-sm text-muted-foreground mb-2">{label}</p>
        {close !== undefined && <p className="text-sm font-bold">Close: ${close.toFixed(2)}</p>}
        {action !== undefined && (
          <p className="text-sm font-bold mt-1">
            Action: <span className={actionColor}>{actionLabel}</span> ({action.toFixed(2)})
          </p>
        )}
      </div>
    );
  }
  return null;
};

const PortfolioTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const strategy = payload.find((p: any) => p.dataKey === "portfolio")?.value;
    const baseline = payload.find((p: any) => p.dataKey === "baseline")?.value;
    
    let outperformance = null;
    if (strategy && baseline) {
      outperformance = ((strategy / baseline - 1) * 100).toFixed(2);
    }

    return (
      <div className="bg-background/95 border border-border p-3 rounded-lg shadow-lg">
        <p className="text-sm text-muted-foreground mb-2">{label}</p>
        {strategy !== undefined && <p className="text-sm font-bold text-indigo-500">TD3 Strategy: {strategy.toFixed(3)}x</p>}
        {baseline !== undefined && <p className="text-sm font-bold text-gray-400 mt-1">Buy & Hold: {baseline.toFixed(3)}x</p>}
        {outperformance !== null && (
          <p className={`text-sm font-bold mt-2 ${parseFloat(outperformance) >= 0 ? "text-green-500" : "text-red-500"}`}>
            Outperformance: {parseFloat(outperformance) > 0 ? "+" : ""}{outperformance}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function Predict() {
  const [stockInfo, setStockInfo] = useState({ ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TD3Results | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [actionDistribution, setActionDistribution] = useState({ buy: 0, hold: 0, sell: 0, total: 0 });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<DemoUser | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.results ? "CSV" : "AAPL");

  const handleLogout = () => {
    logoutDemoUser();
    setUser(null);
    navigate("/login");
  };

  const fetchStockData = async (ticker: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/td3-results?ticker=${ticker}`);
      if (!res.ok) {
        throw new Error("Failed to fetch TD3 results. Make sure backend is running.");
      }
      const data: TD3Results = await res.json();
      processData(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const processData = (data: TD3Results) => {
    if (data.metrics && data.metrics.directionAccuracyPct === undefined) {
      data.metrics.directionAccuracyPct = 0;
    }
    setResults(data);
    
    if (data.ohlc && data.actions) {
      const combined = data.ohlc.map((candle, idx) => ({
        date: candle.date,
        close: candle.close,
        action: data.actions[idx] ?? 0,
      }));
      setChartData(combined);

      // Action dist
      let buy = 0, hold = 0, sell = 0;
      data.actions.forEach(a => {
        if (a > 0.1) buy++;
        else if (a < -0.1) sell++;
        else hold++;
      });
      setActionDistribution({ buy, hold, sell, total: data.actions.length });
    }

    if (data.ohlc && data.portfolioHistory) {
      const baselineStartPrice = data.ohlc[0]?.close || 1;
      const ptData = data.portfolioHistory.map((val, idx) => ({
        date: data.ohlc[idx]?.date || `Day ${idx}`,
        portfolio: val,
        baseline: data.ohlc[idx] ? data.ohlc[idx].close / baselineStartPrice : 1,
      }));
      setPortfolioData(ptData);
    }
  };

  // Initial load
  useEffect(() => {
    setUser(getCurrentUser());
    if (location.state?.results) {
      setStockInfo({ ticker: location.state.customTicker || "CUSTOM", name: "Fetched Data", exchange: "YFINANCE" });
      processData(location.state.results);
      setLastUpdated(new Date());
      // clear the state from history to prevent getting stuck on reload
      window.history.replaceState({}, document.title);
    } else if (activeTab === "AAPL") {
      fetchStockData("AAPL");
    }
  }, [location.state]);

  const handleTabChange = (val: string) => {
    setError(null);
    setResults(null);
    setChartData([]);
    if (val === "AAPL") {
      setStockInfo({ ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" });
      fetchStockData("AAPL");
    } else if (val === "TCS") {
      setStockInfo({ ticker: "TCS", name: "Tata Consultancy Services", exchange: "NSE" });
    } else {
      setStockInfo({ ticker: "CSV", name: "Custom Upload", exchange: "CUSTOM" });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to process CSV. Ensure format is: Date, Open, High, Low, Close, Volume");
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unknown error processing CSV");
      
      processData(data.results);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        toast.error("Only CSV files are allowed");
      }
    }
  }, []);

  const copyCommand = () => {
    navigator.clipboard.writeText("cd backend && uvicorn app:app --port 8001");
    toast.success("Command copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeView="predict" user={user} onLogout={handleLogout} />
      <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Predictions</h1>
          <p className="text-muted-foreground">Live TD3 reinforcement learning inference dashboard.</p>
        </div>
        {lastUpdated && !loading && (
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center space-x-2">
            <span>{error}</span>
            {error.includes("backend is running") && (
              <Button variant="outline" size="sm" className="ml-4" onClick={copyCommand}>
                <Copy className="h-3 w-3 mr-2" /> Copy Start Command
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* SECTION 1: Stock Selector Panel */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="border-muted bg-card text-card-foreground">
          <CardContent className="p-0 flex flex-col md:flex-row">
            <div className="flex-1 p-6 border-r border-border min-h-[160px]">
              <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); handleTabChange(val); }}>
                <TabsList className="mb-4">
                  <TabsTrigger value="AAPL">AAPL</TabsTrigger>
                  <TabsTrigger value="TCS">TCS</TabsTrigger>
                  <TabsTrigger value="CSV">Upload CSV</TabsTrigger>
                </TabsList>
                
                <TabsContent value="AAPL">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold">{stockInfo.name}</h2>
                      <Badge variant="secondary" className="mt-1">{stockInfo.exchange}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      {loading ? (
                        <div className="flex items-center text-sm text-muted-foreground"><div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse mr-2" /> Loading...</div>
                      ) : results ? (
                        <div className="flex items-center text-sm text-green-500"><div className="w-2 h-2 rounded-full bg-green-500 mr-2" /> Model Ready</div>
                      ) : null}
                      <Button disabled={loading} onClick={() => fetchStockData("AAPL")}>
                        <Brain className="mr-2 h-4 w-4" /> Run TD3 Model
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="TCS">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold">{stockInfo.name}</h2>
                      <Badge variant="secondary" className="mt-1">{stockInfo.exchange}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      {loading ? (
                        <div className="flex items-center text-sm text-muted-foreground"><div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse mr-2" /> Running inference...</div>
                      ) : results ? (
                        <div className="flex items-center text-sm text-green-500"><div className="w-2 h-2 rounded-full bg-green-500 mr-2" /> Model Ready</div>
                      ) : null}
                      <Button disabled={loading} onClick={() => fetchStockData("TCS")}>
                        <Brain className="mr-2 h-4 w-4" /> Run TD3 Model
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="CSV">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input 
                      type="file" 
                      accept=".csv" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                    />
                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-4" />
                    {selectedFile ? (
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Drop your OHLC CSV here or click to browse</p>
                    )}
                  </div>
                  {selectedFile && (
                    <div className="mt-4 flex justify-end">
                      <Button disabled={loading} onClick={handleFileUpload}>
                         {loading ? "Processing..." : "Run Model on CSV"}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="w-full md:w-[35%] bg-muted/20 p-6 flex flex-col justify-center gap-4 min-h-[160px]">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Last Run Summary</div>
              {results ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">Acc: {results.metrics.directionAccuracyPct.toFixed(1)}%</Badge>
                    <Badge variant="outline" className="text-xs">Sharpe: {results.metrics.sharpeRatio.toFixed(2)}</Badge>
                    <Badge variant="outline" className="text-xs">Ret: {results.metrics.returnPct.toFixed(1)}%</Badge>
                  </div>
                  <div>
                    <Badge className={results.metrics.returnPct >= 0 ? "bg-green-500 hover:bg-green-600 outline-none border-none text-white font-bold" : "bg-red-500 hover:bg-red-600 outline-none border-none text-white font-bold"}>
                      {results.metrics.returnPct >= 0 ? "BULLISH BIAS" : "BEARISH BIAS"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">No results generated yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SECTION 2: Main Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle>{stockInfo.ticker} — TD3 Action Signals Overlay</CardTitle>
            <CardDescription>Blue area is close price, colored bars are TD3 agent actions (buy/sell conviction)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-[400px] rounded-xl" />
            ) : chartData.length > 0 ? (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      minTickGap={50}
                      tickFormatter={(tick) => {
                        const d = new Date(tick);
                        return isNaN(d.getTime()) ? tick : d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                      }}
                      stroke="#888" 
                    />
                    <YAxis yAxisId="left" domain={['auto', 'auto']} stroke="#888" tickFormatter={(val) => `$${val}`} />
                    <YAxis yAxisId="right" orientation="right" domain={[-1, 1]} stroke="#888" />
                    <RechartsTooltip content={<CustomTooltip />} />
                    
                    <Area 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="close" 
                      stroke="#6366f1" 
                      fill="rgba(99, 102, 241, 0.2)" 
                      strokeWidth={2}
                      activeDot={{ r: 4 }}
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="action" 
                      shape={(props: any) => {
                        const { x, y, width, height, value } = props;
                        let fill = "#888";
                        if (value > 0.1) fill = "#22c55e"; // green
                        else if (value < -0.1) fill = "#ef4444"; // red
                        return <rect x={x} y={y} width={width} height={height} fill={fill} opacity={0.6} />;
                      }}
                    />
                    <Brush dataKey="date" height={30} stroke="#6366f1" fill="#1f2937" 
                      tickFormatter={(tick) => {
                        const d = new Date(tick);
                        return isNaN(d.getTime()) ? tick : d.getFullYear().toString();
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full h-[400px] flex items-center justify-center border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">Run the model to see the chart</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* SECTION 2.5: Portfolio Curve */}
      {portfolioData.length > 0 && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Portfolio Value vs Buy & Hold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      minTickGap={50}
                      tickFormatter={(tick) => {
                        const d = new Date(tick);
                        return isNaN(d.getTime()) ? tick : d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                      }}
                      stroke="#888" 
                    />
                    <YAxis domain={['auto', 'auto']} stroke="#888" tickFormatter={(val) => `${val.toFixed(1)}x`} />
                    <RechartsTooltip content={<PortfolioTooltip />} />
                    <ReferenceLine y={1.0} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Break-even', fill: '#ef4444', fontSize: 12 }} />
                    <Area 
                      type="monotone" 
                      dataKey="portfolio" 
                      stroke="#6366f1" 
                      fill="rgba(99, 102, 241, 0.1)" 
                      strokeWidth={2}
                      name="TD3 Strategy"
                    />
                    <Line type="monotone" dataKey="baseline" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Buy & Hold" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* SECTION 3: Metrics Dashboard */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
          ) : results ? (
            <>
              {/* Card 1: Accuracy */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Direction Accuracy</CardTitle>
                    <Target className={`h-4 w-4 ${results.metrics.directionAccuracyPct > 55 ? 'text-green-500' : results.metrics.directionAccuracyPct > 50 ? 'text-yellow-500' : 'text-red-500'}`} />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-3xl font-bold font-mono">
                    <CountUpNumber value={results.metrics.directionAccuracyPct} decimals={1} suffix="%" />
                  </div>
                  <Progress value={results.metrics.directionAccuracyPct} className="h-1 mt-2 mb-1" 
                            indicatorColor={`${results.metrics.directionAccuracyPct > 55 ? 'bg-green-500' : results.metrics.directionAccuracyPct > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">Correctly predicted price direction</p>
                </CardContent>
              </Card>

              {/* Card 2: Return */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Return</CardTitle>
                    {results.metrics.returnPct >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className={`text-3xl font-bold font-mono ${results.metrics.returnPct >= 0 ? "text-green-500" : "text-red-500"}`}>
                    <CountUpNumber value={results.metrics.returnPct} decimals={1} prefix={results.metrics.returnPct >= 0 ? "+" : ""} suffix="%" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">Strategy return over evaluation period</p>
                </CardContent>
              </Card>

              {/* Card 3: Sharpe Ratio */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Sharpe Ratio</CardTitle>
                    <Gauge className={`h-4 w-4 ${results.metrics.sharpeRatio > 1.0 ? 'text-green-500' : results.metrics.sharpeRatio > 0.5 ? 'text-yellow-500' : 'text-red-500'}`} />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-3xl font-bold font-mono">
                    <CountUpNumber value={results.metrics.sharpeRatio} decimals={2} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">Risk-adjusted return ({'>'}1.0 is good)</p>
                </CardContent>
              </Card>

              {/* Card 4: Max Drawdown */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Max Drawdown</CardTitle>
                    <AlertTriangle className={`h-4 w-4 ${Math.abs(results.metrics.maxDrawdownPct) < 10 ? 'text-green-500' : Math.abs(results.metrics.maxDrawdownPct) < 20 ? 'text-yellow-500' : 'text-red-500'}`} />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-3xl font-bold font-mono">
                    <CountUpNumber value={Math.abs(results.metrics.maxDrawdownPct)} decimals={1} prefix="-" suffix="%" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">Largest peak-to-trough loss</p>
                </CardContent>
              </Card>

              {/* Card 5: Final Value */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Final Portfolio Value</CardTitle>
                    <Wallet className={`h-4 w-4 ${results.metrics.finalPortfolioValue > 1.0 ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-3xl font-bold font-mono">
                    <CountUpNumber value={results.metrics.finalPortfolioValue} decimals={3} suffix="x" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">Ending value per unit of capital</p>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="col-span-5 py-8 text-center text-muted-foreground border border-dashed rounded-xl">
              Run model to generate metrics
            </div>
          )}
        </div>

        {/* Action Signal Distribution */}
        {results && !loading && (
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Action Signal Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-8 flex rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 hover:bg-green-400 transition-colors flex items-center justify-center text-xs font-bold text-white shadow-inner" 
                  style={{ width: `${(actionDistribution.buy / actionDistribution.total) * 100}%` }}
                  title={`Buy: ${actionDistribution.buy} (${((actionDistribution.buy / actionDistribution.total) * 100).toFixed(1)}%)`}
                >
                  {((actionDistribution.buy / actionDistribution.total) * 100) > 5 && `${((actionDistribution.buy / actionDistribution.total) * 100).toFixed(0)}%`}
                </div>
                <div 
                  className="bg-gray-600 hover:bg-gray-500 transition-colors flex items-center justify-center text-xs font-bold text-white shadow-inner" 
                  style={{ width: `${(actionDistribution.hold / actionDistribution.total) * 100}%` }}
                  title={`Hold: ${actionDistribution.hold} (${((actionDistribution.hold / actionDistribution.total) * 100).toFixed(1)}%)`}
                >
                  {((actionDistribution.hold / actionDistribution.total) * 100) > 5 && `${((actionDistribution.hold / actionDistribution.total) * 100).toFixed(0)}%`}
                </div>
                <div 
                  className="bg-red-500 hover:bg-red-400 transition-colors flex items-center justify-center text-xs font-bold text-white shadow-inner" 
                  style={{ width: `${(actionDistribution.sell / actionDistribution.total) * 100}%` }}
                  title={`Sell: ${actionDistribution.sell} (${((actionDistribution.sell / actionDistribution.total) * 100).toFixed(1)}%)`}
                >
                  {((actionDistribution.sell / actionDistribution.total) * 100) > 5 && `${((actionDistribution.sell / actionDistribution.total) * 100).toFixed(0)}%`}
                </div>
              </div>
              <div className="flex justify-between mt-3 text-sm font-medium">
                <div className="text-green-500 flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2" /> Buy: {actionDistribution.buy}</div>
                <div className="text-gray-400 flex items-center"><div className="w-2 h-2 rounded-full bg-gray-500 mr-2" /> Hold: {actionDistribution.hold}</div>
                <div className="text-red-500 flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-2" /> Sell: {actionDistribution.sell}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
      </div>
    </div>
  );
}
