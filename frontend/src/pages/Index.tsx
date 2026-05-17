import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, TrendingUp, Activity, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import RiskDisclaimer from "@/components/RiskDisclaimer";
import Footer from "@/components/Footer";
import { getCurrentUser, logoutDemoUser, type DemoUser } from "@/lib/demoAuth";
import { useEffect } from "react";

const steps = [
  {
    num: "01",
    icon: TrendingUp,
    title: "Fetch Live Stock Data",
    desc: "Go to the Fetch page, pick any stock from the 5 featured or search 90+ symbols. Choose 1-Day or 1-Week interval. The app downloads OHLCV data directly from Yahoo Finance.",
    cta: "Go to Fetch",
    href: "/fetch",
  },
  {
    num: "02",
    icon: Brain,
    title: "TD3 Model Runs Inference",
    desc: "Your data is processed through the trained TD3 actor network. It generates action signals [-1 → 1] per trading day using price, RSI, MACD, SMA, and ATR as input features.",
    cta: null,
    href: null,
  },
  {
    num: "03",
    icon: Activity,
    title: "Analyse Predictions",
    desc: "The Predict dashboard shows you the action overlay chart, portfolio curve vs Buy & Hold, Sharpe ratio, max drawdown, return %, and buy/sell/hold distribution.",
    cta: "Go to Predict",
    href: "/predict",
  },
];

const modelFacts = [
  "State space: Open, High, Low, Close, Volume, Dividends, SMA(20), SMA(50), RSI(14), MACD, ATR",
  "Actor network: Linear(12→400) → LayerNorm → ReLU → Linear(400→300) → LayerNorm → ReLU → Linear(300→1) → Tanh",
  "Two critic networks with BatchNorm + Dropout(0.2) for stability",
  "Trained on AAPL daily data from 2000–2024 for 100+ epochs",
  "Reward: risk-adjusted excess return over risk-free rate (2% annual)",
  "Position size capped at ±35%, smoothed with 0.8/0.2 EMA to reduce oscillation",
];

const Index = () => {
  const navigate  = useNavigate();
  const [user, setUser] = useState<DemoUser | null>(null);

  useEffect(() => { setUser(getCurrentUser()); }, []);

  const handleLogout = () => { logoutDemoUser(); setUser(null); };

  return (
    <div className="min-h-screen bg-background">
      <Header activeView="home" onNavigateView={() => {}} user={user} onLogout={handleLogout} />

      <HeroSection />

      {/* How it works */}
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight mb-2">How It Works</h2>
          <p className="text-muted-foreground mb-10">Three steps from live data to prediction dashboard.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ num, icon: Icon, title, desc, cta, href }) => (
              <div key={num} className="glass-card p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black text-primary/20 font-mono">{num}</span>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-base mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
                {cta && href && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-auto self-start gap-2"
                    onClick={() => navigate(href)}
                  >
                    {cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Model architecture facts */}
      <section className="border-t border-border/40 bg-card/20">
        <div className="container mx-auto px-4 py-20 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight mb-2">Model Architecture</h2>
            <p className="text-muted-foreground mb-8">Key facts about the trained TD3 network.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {modelFacts.map((fact, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/40 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{fact}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <Button onClick={() => navigate("/features")} variant="outline" className="gap-2">
                View Planned Features <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={() => navigate("/help")} variant="ghost" className="gap-2 text-muted-foreground">
                Read the Help Guide
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <RiskDisclaimer />
      <Footer />
    </div>
  );
};

export default Index;
