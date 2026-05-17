import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Brain, BarChart3, TrendingUp, Bell, Shield, Smartphone,
  MessageSquare, Layers, RefreshCw, PieChart, Zap, Globe,
  ArrowRight, CheckCircle2, Clock, Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCurrentUser, logoutDemoUser, type DemoUser } from "@/lib/demoAuth";
import { useState, useEffect } from "react";

type FeatureStatus = "live" | "in-progress" | "planned";

interface Feature {
  icon: React.ElementType;
  title: string;
  desc: string;
  status: FeatureStatus;
  tags: string[];
}

const STATUS_CONFIG: Record<FeatureStatus, { label: string; className: string; dot: string }> = {
  live:        { label: "Live",        className: "bg-green-500/15 text-green-400 border-green-500/30",  dot: "bg-green-400" },
  "in-progress":{ label: "In Progress", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-400 animate-pulse" },
  planned:     { label: "Planned",     className: "bg-blue-500/15 text-blue-400 border-blue-500/30",    dot: "bg-blue-400" },
};

const features: Feature[] = [
  {
    icon: Brain,
    title: "TD3 Live Inference",
    desc: "Upload any stock CSV or fetch live data and run it through the trained TD3 actor network instantly. Results show in under 3 seconds.",
    status: "live",
    tags: ["Model", "Core"],
  },
  {
    icon: BarChart3,
    title: "Prediction Dashboard",
    desc: "Full analytics dashboard with action signal overlay chart, portfolio curve, Sharpe ratio, max drawdown, directional accuracy, and buy/sell/hold distribution.",
    status: "live",
    tags: ["Analytics", "Core"],
  },
  {
    icon: TrendingUp,
    title: "Live Data Fetcher",
    desc: "Fetch real-time OHLCV data from Yahoo Finance for 90+ stocks with fuzzy search. Supports daily and weekly intervals.",
    status: "live",
    tags: ["Data", "Core"],
  },
  {
    icon: RefreshCw,
    title: "Multi-Stock Comparison",
    desc: "Run TD3 inference on multiple stocks side-by-side and compare Sharpe ratios, returns, and signal distributions on a single view.",
    status: "in-progress",
    tags: ["Analytics", "Research"],
  },
  {
    icon: Bell,
    title: "Price & Signal Alerts",
    desc: "Set threshold alerts on TD3 action values or price levels. Get browser notifications when the model flips from buy to sell or vice versa.",
    status: "planned",
    tags: ["Alerts", "UX"],
  },
  {
    icon: Layers,
    title: "Backtesting Engine",
    desc: "Run the TD3 agent over any custom historical date range with configurable capital, transaction costs, and slippage models.",
    status: "planned",
    tags: ["Research", "Finance"],
  },
  {
    icon: PieChart,
    title: "Portfolio Optimisation",
    desc: "Combine TD3 signals across multiple assets to build a portfolio allocation using Modern Portfolio Theory and risk parity.",
    status: "planned",
    tags: ["Finance", "Research"],
  },
  {
    icon: MessageSquare,
    title: "Sentiment Analysis Layer",
    desc: "Incorporate news sentiment scores from financial headlines as an additional input feature alongside technical indicators.",
    status: "planned",
    tags: ["NLP", "Research"],
  },
  {
    icon: Shield,
    title: "Paper Trading Simulator",
    desc: "Simulate trading with virtual capital using live TD3 signals. Track P&L, win rate, and risk exposure without real money.",
    status: "planned",
    tags: ["Simulation", "UX"],
  },
  {
    icon: Smartphone,
    title: "Mobile App (React Native)",
    desc: "iOS and Android companion app with push notifications, portfolio tracking, and on-device model inference via ONNX.",
    status: "planned",
    tags: ["Mobile", "Platform"],
  },
  {
    icon: Globe,
    title: "Global Market Support",
    desc: "Extended ticker support for LSE, TSX, ASX, and European exchanges with auto-currency normalisation.",
    status: "planned",
    tags: ["Data", "Platform"],
  },
  {
    icon: Sparkles,
    title: "Custom Indicator Builder",
    desc: "Build and inject your own technical indicators as extra input features into the TD3 state space and retrain the model.",
    status: "planned",
    tags: ["Research", "Advanced"],
  },
];

const statusOrder: FeatureStatus[] = ["live", "in-progress", "planned"];

export default function Features() {
  const navigate = useNavigate();
  const [user, setUser] = useState<DemoUser | null>(null);
  const [filter, setFilter] = useState<FeatureStatus | "all">("all");

  useEffect(() => { setUser(getCurrentUser()); }, []);

  const handleLogout = () => { logoutDemoUser(); setUser(null); navigate("/login"); };

  const shown = filter === "all" ? features : features.filter(f => f.status === filter);
  const counts = {
    live: features.filter(f => f.status === "live").length,
    "in-progress": features.filter(f => f.status === "in-progress").length,
    planned: features.filter(f => f.status === "planned").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeView="home" user={user} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-14 max-w-5xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/40 bg-secondary/30 px-4 py-1.5 text-xs font-medium">
            <Zap className="h-3.5 w-3.5 text-primary" /> Product Roadmap
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            Features & <span className="text-primary">Roadmap</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            What's live today, what's being built, and what's coming next to the TD3 prediction platform.
          </p>
        </motion.div>

        {/* Summary pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          {(["all", ...statusOrder] as const).map(s => {
            const cfg = s === "all" ? null : STATUS_CONFIG[s];
            const count = s === "all" ? features.length : counts[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  filter === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                {cfg && <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />}
                {s === "all" ? "All Features" : cfg!.label}
                <span className="text-xs opacity-60">{count}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Feature grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shown.map((f, i) => {
            const cfg = STATUS_CONFIG[f.status];
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.className}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>

                <div className="flex flex-wrap gap-1 mt-auto">
                  {f.tags.map(t => (
                    <Badge key={t} variant="outline" className="text-[10px] px-2 py-0">{t}</Badge>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center"
        >
          <h2 className="text-2xl font-bold mb-2">Want to suggest a feature?</h2>
          <p className="text-muted-foreground mb-6">Reach out via the contact page or open a GitHub issue.</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Button onClick={() => navigate("/contact")} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              Contact Us <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/help")} className="gap-2">
              Read Help Guide
            </Button>
          </div>
        </motion.div>

      </div>
      <Footer />
    </div>
  );
}
