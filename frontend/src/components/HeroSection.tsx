import { motion } from "framer-motion";
import { Brain, TrendingUp, Activity, ArrowRight, Zap, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const stats = [
  { value: "100+", label: "Training Epochs" },
  { value: "56%",  label: "Direction Accuracy" },
  { value: "25yr",  label: "AAPL Data Trained" },
  { value: "0.70",  label: "Sharpe Ratio" },
];

const highlights = [
  {
    icon: Brain,
    title: "TD3 Reinforcement Learning",
    desc: "Twin Delayed Deep Deterministic Policy Gradient — designed for continuous-action environments like stock trading.",
  },
  {
    icon: Activity,
    title: "Live Market Inference",
    desc: "Fetch live OHLCV data from Yahoo Finance and run it through the trained model instantly.",
  },
  {
    icon: BarChart3,
    title: "Interpretable Analytics",
    desc: "Portfolio curve, action signals, Sharpe ratio, drawdown, and directional accuracy — all in one dashboard.",
  },
  {
    icon: Shield,
    title: "Risk-Aware Signals",
    desc: "Model outputs bounded in [-1, 1] representing sell/hold/buy strength with position-size limits.",
  },
];

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden gradient-hero grid-pattern">
      <div className="container mx-auto px-4 py-20 md:py-28 max-w-5xl">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-secondary/30 px-4 py-1.5 text-xs font-medium text-white"
        >
          <Zap className="h-3.5 w-3.5 text-primary" />
          Final Year Research Project — Reinforcement Learning for Algorithmic Trading
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-5 text-4xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-6xl leading-tight"
        >
          TD3 Stock Trading<br />
          <span className="text-white">Intelligence Dashboard</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 max-w-2xl text-base text-muted-foreground md:text-lg leading-relaxed"
        >
          A research implementation of the <span className="text-white font-semibold">Twin Delayed Deep Deterministic Policy Gradient</span> algorithm
          for continuous buy/sell/hold decision-making in equity markets — with full evaluation analytics.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-14 flex flex-wrap gap-3"
        >
          <Button
            size="lg"
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
            onClick={() => navigate("/predict")}
          >
            <Brain className="h-4 w-4" /> View Predictions
            <span className="ml-1 text-[10px] bg-red-500/80 px-1.5 py-0.5 rounded font-bold animate-pulse">LIVE</span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
            onClick={() => navigate("/fetch")}
          >
            <TrendingUp className="h-4 w-4" /> Fetch Live Data
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/help")}
          >
            Learn How It Works <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16 grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="text-2xl font-extrabold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Highlight cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {highlights.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-5 flex gap-4">
              <div className="shrink-0 h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground mb-1">{title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default HeroSection;
