import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, TrendingUp, Brain, BarChart3, ChevronDown, ChevronUp,
  ArrowRight, Lightbulb, AlertTriangle, CheckCircle2, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCurrentUser, logoutDemoUser, type DemoUser } from "@/lib/demoAuth";

// ---- Guide steps ----
const GUIDE = [
  {
    icon: TrendingUp,
    step: "Step 1",
    title: "Fetch Live Stock Data",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    items: [
      "Click \"Fetch Data\" in the top navigation bar.",
      "Choose one of the 5 featured stocks (AAPL, GOOGL, MSFT, TSLA, NVDA) or use the search box to find any ticker.",
      "The search bar handles typos — try typing \"apple\", \"microsft\", or \"nvida\" and it will still find the right stock.",
      "Select your interval: \"1 Day\" fetches 1 year of daily bars; \"1 Week\" fetches 3 years of weekly bars.",
      "Click \"Fetch & Run TD3 Prediction\" — the app downloads data from Yahoo Finance, converts it to the model's input format, and runs inference automatically.",
    ],
  },
  {
    icon: Brain,
    step: "Step 2",
    title: "How the Model Processes Data",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    items: [
      "The TD3 actor network takes 12 features as input: Open, High, Low, Close, Volume, Dividends, SMA(20), SMA(50), RSI(14), MACD, ATR.",
      "Each feature is normalised using a StandardScaler before being passed to the network.",
      "The network outputs a single value in [-1, 1]: negative = sell signal, zero = hold, positive = buy signal.",
      "Position sizes are capped at ±35% and smoothed (EMA α=0.2) to reduce oscillation.",
      "The model was trained on AAPL 2000–2024 data using a Sharpe-ratio-based reward function.",
    ],
  },
  {
    icon: Activity,
    step: "Step 3",
    title: "Reading the Prediction Dashboard",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    items: [
      "The main chart overlays the TD3 action bars (green = buy, red = sell, grey = hold) on top of the close price.",
      "The Portfolio Curve compares the TD3 strategy's cumulative return vs a simple buy-and-hold baseline.",
      "\"Direction Accuracy\" — how often the model predicted the correct price movement direction.",
      "\"Sharpe Ratio\" — risk-adjusted return. Above 1.0 is generally considered good.",
      "\"Max Drawdown\" — the largest peak-to-trough loss during the evaluation period.",
      "The action distribution bar at the bottom shows what % of signals were buy / hold / sell.",
    ],
  },
];

// ---- FAQ ----
const FAQ: { q: string; a: string }[] = [
  {
    q: "Can I use this to make real trading decisions?",
    a: "No. This is a research project and educational demonstration only. The TD3 model is trained on historical data and has no guarantee of future performance. Past results do not predict future returns. Always consult a qualified financial advisor.",
  },
  {
    q: "Why does the model show Direction Accuracy of 0% for AAPL?",
    a: "The AAPL default results are loaded from a pre-computed JSON file that doesn't include the accuracy field. Use the Fetch Data page to re-run the model live — the live inference always computes directional accuracy.",
  },
  {
    q: "What if my search ticker isn't in the list?",
    a: "Type the exact Yahoo Finance ticker symbol (e.g., RELIANCE.NS for NSE, ^NSEI for Nifty index) and press Enter or the search button. If yfinance can find it, the model will run on it.",
  },
  {
    q: "Why does it need at least 55 rows of data?",
    a: "The model uses SMA(50) as one of its input features. You need at least 50 data points to compute SMA(50), plus a few more for the other indicators to stabilise. The 1-Day interval fetches 1 full year (~252 rows) so it always has enough.",
  },
  {
    q: "What does the action value of -0.85 mean?",
    a: "Action values range from -1 (maximum sell) to +1 (maximum buy). An action of -0.85 means the model has strong conviction to be short/sell. Values between -0.1 and +0.1 are treated as hold.",
  },
  {
    q: "What is the Sharpe Ratio and why does it matter?",
    a: "The Sharpe Ratio measures how much return you get per unit of risk (volatility). A ratio above 1.0 is generally considered acceptable, above 2.0 is very good. Negative Sharpe means the strategy lost money compared to the risk-free rate.",
  },
  {
    q: "Can I upload my own CSV data?",
    a: "Yes. Go to the Predict page and click the \"Upload CSV\" tab. Your CSV must have columns: Date, Open, High, Low, Close, Volume. The model will run inference on whatever date range you provide.",
  },
  {
    q: "Why does the same stock give different results each run?",
    a: "Results should be deterministic for the same input data since the model weights are fixed. Small differences can appear if yfinance returns slightly different data on different fetches due to corporate actions or timezone handling.",
  },
];

// ---- Glossary ----
const GLOSSARY: { term: string; def: string }[] = [
  { term: "TD3", def: "Twin Delayed Deep Deterministic Policy Gradient — a reinforcement learning algorithm for continuous action spaces, using two critic networks to reduce overestimation bias." },
  { term: "Actor Network", def: "The neural network that maps state → action. In TD3, the actor is updated less frequently than the critics (hence 'delayed') for stability." },
  { term: "Sharpe Ratio", def: "Annualised excess return divided by annualised standard deviation of returns. Measures risk-adjusted performance." },
  { term: "Max Drawdown", def: "The maximum observed loss from a peak to a trough before a new peak is attained. Measures downside risk." },
  { term: "OHLCV", def: "Open, High, Low, Close, Volume — the five standard fields in a candlestick bar." },
  { term: "SMA", def: "Simple Moving Average — the unweighted mean of the past N closing prices." },
  { term: "RSI", def: "Relative Strength Index — a momentum oscillator in [0, 100]. Values above 70 = overbought, below 30 = oversold." },
  { term: "MACD", def: "Moving Average Convergence Divergence — difference between the 26-period and 12-period EMA, used to identify trend changes." },
  { term: "ATR", def: "Average True Range — measures market volatility by averaging the true range over N periods." },
  { term: "StandardScaler", def: "A preprocessing step that normalises each feature to zero mean and unit variance, required before feeding data into the neural network." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span>{q}</span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function Help() {
  const navigate  = useNavigate();
  const [user, setUser] = useState<DemoUser | null>(null);

  useEffect(() => { setUser(getCurrentUser()); }, []);
  const handleLogout = () => { logoutDemoUser(); setUser(null); navigate("/login"); };

  return (
    <div className="min-h-screen bg-background">
      <Header activeView="home" user={user} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-14 max-w-4xl space-y-20">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/40 bg-secondary/30 px-4 py-1.5 text-xs font-medium">
            <BookOpen className="h-3.5 w-3.5 text-primary" /> Help & Documentation
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            Getting <span className="text-primary">Started</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            New here? This guide walks you through everything — from fetching your first stock to reading the TD3 prediction output.
          </p>
          <div className="mt-4 flex gap-3 flex-wrap">
            <Button onClick={() => navigate("/fetch")} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              Try It Now <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate("/predict")} variant="outline" className="gap-2">
              <Brain className="h-4 w-4" /> View Predictions
            </Button>
          </div>
        </motion.div>

        {/* Disclaimer banner */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex items-start gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/8 p-5"
        >
          <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-300 mb-1">Research Project — Not Financial Advice</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This platform is built for academic research and educational demonstration only. The TD3 model's signals should not be used
              to make real investment or trading decisions. Past model performance does not guarantee future results.
            </p>
          </div>
        </motion.div>

        {/* Step-by-step guide */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold mb-8">Step-by-Step Guide</h2>
          <div className="space-y-6">
            {GUIDE.map((g, i) => {
              const Icon = g.icon;
              return (
                <div key={g.step} className={`rounded-2xl border ${g.border} ${g.bg} p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-9 w-9 rounded-xl bg-background/50 flex items-center justify-center shrink-0`}>
                      <Icon className={`h-5 w-5 ${g.color}`} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-mono">{g.step}</div>
                      <h3 className="font-bold text-sm">{g.title}</h3>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {g.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle2 className={`h-4 w-4 ${g.color} shrink-0 mt-0.5`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Tips */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="h-5 w-5 text-yellow-400" />
            <h2 className="text-2xl font-bold">Tips for Better Results</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { tip: "Use 1-Day interval for more granular signals on US tech stocks — the model was trained primarily on daily AAPL data." },
              { tip: "Indian NSE stocks (e.g. INFY.NS) work too — add \".NS\" after the ticker symbol when searching." },
              { tip: "The portfolio curve vs Buy & Hold is the most intuitive metric — if the TD3 line is above the grey line, the model outperformed passive holding." },
              { tip: "A Sharpe Ratio above 0.5 on new data the model hasn't seen is a reasonable result for a RL trading agent." },
              { tip: "Upload your own CSV (Date, Open, High, Low, Close, Volume) from the Predict page to test on any custom dataset." },
              { tip: "High sell signal clusters often appear before known price drops — look at the action overlay carefully." },
            ].map(({ tip }, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-border/40 bg-card px-4 py-3">
                <span className="text-yellow-400 font-mono text-xs font-bold shrink-0 mt-0.5">#{i + 1}</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQ.map(item => <FAQItem key={item.q} {...item} />)}
          </div>
        </motion.section>

        {/* Glossary */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold mb-6">Glossary</h2>
          <div className="divide-y divide-border/40 rounded-2xl border border-border/40 overflow-hidden">
            {GLOSSARY.map(({ term, def }) => (
              <div key={term} className="flex gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                <span className="font-mono font-bold text-primary text-sm shrink-0 w-32">{term}</span>
                <span className="text-sm text-muted-foreground leading-relaxed">{def}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Still stuck? */}
        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center"
        >
          <h2 className="text-xl font-bold mb-2">Still have questions?</h2>
          <p className="text-muted-foreground mb-5 text-sm">Reach out directly — happy to help.</p>
          <Button onClick={() => navigate("/contact")} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            Contact the Developer <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>

      </div>
      <Footer />
    </div>
  );
}
