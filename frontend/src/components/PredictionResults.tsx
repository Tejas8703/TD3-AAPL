import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ComposedChart, AreaChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Brush, ReferenceLine, Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, TrendingUp, TrendingDown, Target, Gauge, AlertTriangle, Wallet } from "lucide-react";

// ---- Types ----
export interface TD3Metrics {
  sharpeRatio: number;
  returnPct: number;
  maxDrawdownPct: number;
  finalPortfolioValue: number;
  directionAccuracyPct: number;
}
export interface OHLC { date: string; open: number; high: number; low: number; close: number; }
export interface TD3Results {
  metrics: TD3Metrics;
  ohlc: OHLC[];
  portfolioHistory: number[];
  actions: number[];
  positions: number[];
}

// ---- Animated counter ----
function CountUp({ value, decimals = 0, prefix = "", suffix = "" }: {
  value: number; decimals?: number; prefix?: string; suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const gap = value - 0;
    let current = 0;
    const timer = setInterval(() => {
      current += gap / 60;
      if ((gap >= 0 && current >= value) || (gap < 0 && current <= value)) {
        clearInterval(timer); setDisplay(value);
      } else { setDisplay(current); }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value]);
  return <>{prefix}{display.toFixed(decimals)}{suffix}</>;
}

// ---- Tooltips ----
function PriceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const close  = payload.find((p: any) => p.dataKey === "close")?.value;
  const action = payload.find((p: any) => p.dataKey === "action")?.value;
  const aLabel = action > 0.1 ? "BUY" : action < -0.1 ? "SELL" : "HOLD";
  const aColor = action > 0.1 ? "text-green-400" : action < -0.1 ? "text-red-400" : "text-gray-400";
  return (
    <div className="bg-background/95 border border-border p-3 rounded-lg shadow-lg text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      {close  != null && <p className="font-bold">Close: ${close.toFixed(2)}</p>}
      {action != null && <p className="mt-1">Signal: <span className={`font-bold ${aColor}`}>{aLabel}</span> ({action.toFixed(3)})</p>}
    </div>
  );
}
function PortfolioTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const td3      = payload.find((p: any) => p.dataKey === "portfolio")?.value;
  const baseline = payload.find((p: any) => p.dataKey === "baseline")?.value;
  const out = td3 && baseline ? ((td3 / baseline - 1) * 100).toFixed(2) : null;
  return (
    <div className="bg-background/95 border border-border p-3 rounded-lg shadow-lg text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      {td3      != null && <p className="font-bold text-indigo-400">TD3: {td3.toFixed(3)}x</p>}
      {baseline != null && <p className="font-bold text-gray-400">Buy&Hold: {baseline.toFixed(3)}x</p>}
      {out != null && <p className={`mt-1 font-bold ${parseFloat(out) >= 0 ? "text-green-400" : "text-red-400"}`}>
        Edge: {parseFloat(out) > 0 ? "+" : ""}{out}%
      </p>}
    </div>
  );
}

// ---- Main component ----
interface Props {
  results: TD3Results;
  ticker: string;
  /** if true, shows a "View Full Dashboard" button linking to /predict */
  showFullLink?: boolean;
}

export default function PredictionResults({ results, ticker, showFullLink = true }: Props) {
  const navigate = useNavigate();

  // derive chart data
  const chartData = results.ohlc.map((c, i) => ({
    date:   c.date,
    close:  c.close,
    action: results.actions[i] ?? 0,
  }));

  const baselineStart = results.ohlc[0]?.close || 1;
  const portfolioData = results.portfolioHistory.map((val, i) => ({
    date:      results.ohlc[i]?.date || `Day ${i}`,
    portfolio: val,
    baseline:  results.ohlc[i] ? results.ohlc[i].close / baselineStart : 1,
  }));

  let buy = 0, hold = 0, sell = 0;
  results.actions.forEach(a => { if (a > 0.1) buy++; else if (a < -0.1) sell++; else hold++; });
  const total = results.actions.length || 1;

  const m = results.metrics;
  const metrics = [
    { label: "Direction Accuracy", value: m.directionAccuracyPct, decimals: 1, suffix: "%",
      icon: Target, color: m.directionAccuracyPct > 55 ? "text-green-400" : m.directionAccuracyPct > 50 ? "text-yellow-400" : "text-red-400",
      bar: true },
    { label: "Total Return", value: m.returnPct, decimals: 1, suffix: "%",
      prefix: m.returnPct >= 0 ? "+" : "",
      icon: m.returnPct >= 0 ? TrendingUp : TrendingDown,
      color: m.returnPct >= 0 ? "text-green-400" : "text-red-400" },
    { label: "Sharpe Ratio", value: m.sharpeRatio, decimals: 2, suffix: "",
      icon: Gauge,
      color: m.sharpeRatio > 1 ? "text-green-400" : m.sharpeRatio > 0.5 ? "text-yellow-400" : "text-red-400" },
    { label: "Max Drawdown", value: Math.abs(m.maxDrawdownPct), decimals: 1, suffix: "%", prefix: "-",
      icon: AlertTriangle,
      color: Math.abs(m.maxDrawdownPct) < 10 ? "text-green-400" : Math.abs(m.maxDrawdownPct) < 20 ? "text-yellow-400" : "text-red-400" },
    { label: "Final Portfolio", value: m.finalPortfolioValue, decimals: 3, suffix: "x",
      icon: Wallet,
      color: m.finalPortfolioValue > 1 ? "text-green-400" : "text-red-400" },
  ];

  const tickFmt = (tick: string) => {
    const d = new Date(tick);
    return isNaN(d.getTime()) ? tick : d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  };

  return (
    <div className="space-y-6">

      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {ticker}
            <Badge className={m.returnPct >= 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
              {m.returnPct >= 0 ? "BULLISH" : "BEARISH"}
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">TD3 inference results · {results.ohlc.length} bars analysed</p>
        </div>
        {showFullLink && (
          <Button variant="outline" size="sm" className="gap-2 shrink-0"
            onClick={() => navigate("/predict", { state: { results, customTicker: ticker } })}>
            <ExternalLink className="h-4 w-4" /> Full Dashboard
          </Button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map(({ label, value, decimals, suffix, prefix, icon: Icon, color, bar }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                <Icon className={`h-4 w-4 shrink-0 ${color}`} />
              </div>
              <p className={`text-2xl font-bold font-mono ${color}`}>
                <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
              </p>
              {bar && (
                <Progress value={value} className="h-1 mt-2"
                  indicatorColor={value > 55 ? "bg-green-500" : value > 50 ? "bg-yellow-500" : "bg-red-500"} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Price + Action chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{ticker} — Price with TD3 Action Signals</CardTitle>
          <CardDescription>Blue = close price · Green bars = buy · Red bars = sell · Grey = hold</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" minTickGap={50} tickFormatter={tickFmt} stroke="#888" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left"  domain={["auto","auto"]} stroke="#888" tickFormatter={v => `$${v}`} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[-1,1]} stroke="#888" tick={{ fontSize: 11 }} />
                <RechartsTooltip content={<PriceTooltip />} />
                <Area yAxisId="left" type="monotone" dataKey="close"
                  stroke="#6366f1" fill="rgba(99,102,241,0.15)" strokeWidth={2} activeDot={{ r: 3 }} />
                <Bar yAxisId="right" dataKey="action"
                  shape={(props: any) => {
                    const { x, y, width, height, value } = props;
                    const fill = value > 0.1 ? "#22c55e" : value < -0.1 ? "#ef4444" : "#6b7280";
                    return <rect x={x} y={y} width={width} height={height} fill={fill} opacity={0.7} />;
                  }}
                />
                <Brush dataKey="date" height={24} stroke="#6366f1" fill="#1f2937"
                  tickFormatter={t => { const d = new Date(t); return isNaN(d.getTime()) ? t : d.getFullYear().toString(); }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio curve */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Portfolio Value vs Buy & Hold</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="date" minTickGap={50} tickFormatter={tickFmt} stroke="#888" tick={{ fontSize: 11 }} />
                <YAxis domain={["auto","auto"]} stroke="#888" tickFormatter={v => `${v.toFixed(1)}x`} tick={{ fontSize: 11 }} />
                <RechartsTooltip content={<PortfolioTooltip />} />
                <ReferenceLine y={1} stroke="#ef4444" strokeDasharray="3 3"
                  label={{ value: "Break-even", position: "insideTopLeft", fill: "#ef4444", fontSize: 11 }} />
                <Area type="monotone" dataKey="portfolio" stroke="#6366f1"
                  fill="rgba(99,102,241,0.1)" strokeWidth={2} name="TD3 Strategy" />
                <Line type="monotone" dataKey="baseline" stroke="#9ca3af"
                  strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Buy & Hold" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Action distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-medium">Action Signal Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-7 flex rounded-full overflow-hidden">
            {[
              { count: buy,  color: "bg-green-500",  label: "Buy",  pct: (buy/total*100) },
              { count: hold, color: "bg-gray-600",   label: "Hold", pct: (hold/total*100) },
              { count: sell, color: "bg-red-500",    label: "Sell", pct: (sell/total*100) },
            ].map(({ count, color, label, pct }) => (
              <div key={label}
                className={`${color} flex items-center justify-center text-xs font-bold text-white`}
                style={{ width: `${pct}%` }}
                title={`${label}: ${count} (${pct.toFixed(1)}%)`}
              >
                {pct > 8 && `${pct.toFixed(0)}%`}
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-3 text-sm font-medium">
            <span className="text-green-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Buy: {buy}
            </span>
            <span className="text-gray-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-500" /> Hold: {hold}
            </span>
            <span className="text-red-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Sell: {sell}
            </span>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
