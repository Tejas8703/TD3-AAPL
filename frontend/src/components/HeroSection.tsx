import { useState } from "react";
import { Search, ChevronDown, TrendingUp, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { trendingStocks } from "@/data/mockStocks";

interface HeroSectionProps {
  onSearch: (ticker: string) => void;
}

const exchanges = ["NSE", "BSE", "NASDAQ"];

const HeroSection = ({ onSearch }: HeroSectionProps) => {
  const [query, setQuery] = useState("");
  const [exchange, setExchange] = useState("NSE");
  const [exchangeOpen, setExchangeOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim().toUpperCase());
  };

  return (
    <section className="relative overflow-hidden gradient-hero grid-pattern">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto flex max-w-4xl flex-col gap-6"
        >
          {/* Left side: project summary */}
          <div className="text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/40 bg-secondary/30 px-4 py-1.5 text-xs font-medium text-white">
              <Zap className="h-3.5 w-3.5" />
              Final Year Project
            </div>

            <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl md:text-5xl">
              TD3-Based Stock Trading Intelligence Dashboard
            </h1>

            <div className="mx-auto max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                  <span>
                    This platform is a final year research implementation of{" "}
                    <span className="font-semibold text-white">Twin Delayed Deep Deterministic Policy Gradient (TD3)</span>, a reinforcement learning algorithm
                    designed for continuous decision-making in stock trading.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                  <span>
                    The model generates an action signal in{" "}
                    <span className="font-mono font-semibold text-white">[-1, 1]</span> to represent sell/hold/buy strength using market features such as{" "}
                    <span className="font-semibold text-white">price, momentum, volatility, and technical indicators</span>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                  <span>
                    The dashboard provides interpretable evaluation through{" "}
                    <span className="font-semibold text-white">candlestick charts, TD3 outputs, portfolio curve, risk metrics, and directional accuracy</span>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                  <span>
                    In short, this project demonstrates how reinforcement learning can be used and evaluated for algorithmic trading with transparent, research-oriented analytics.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Search section */}
          <div>
            <div className="glass-card p-4 sm:p-5">
              <div className="mb-3 text-sm font-semibold text-foreground">Search and Explore Stocks</div>
              <form onSubmit={handleSubmit} className="mb-4">
                <div className="flex items-center gap-0 rounded-lg border border-border bg-background/50 p-1.5">
                  {/* Exchange dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setExchangeOpen(!exchangeOpen)}
                      className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                    >
                      {exchange}
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    {exchangeOpen && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-28 rounded-lg border border-border bg-popover p-1 shadow-xl">
                        {exchanges.map((ex) => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => { setExchange(ex); setExchangeOpen(false); }}
                            className="w-full rounded-md px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-secondary"
                          >
                            {ex}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search stock (e.g., TCS, INFY, RELIANCE, AAPL)"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                  </div>

                  <Button type="submit" size="sm" className="shrink-0 px-5">
                    Search
                  </Button>
                </div>
              </form>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Trending:</span>
                  {trendingStocks.map((s) => (
                    <button
                      key={s.ticker}
                      onClick={() => onSearch(s.ticker)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:border-primary/30 hover:bg-secondary"
                    >
                      <span className="font-mono">{s.ticker}</span>
                      <span className={s.change >= 0 ? "text-gain" : "text-loss"}>
                        {s.change >= 0 ? "+" : ""}{s.change}%
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Offline data (CSV file):</span>
                  <button
                    onClick={() => onSearch("AAPL")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 bg-secondary/40 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-secondary/70"
                  >
                    <span className="font-mono">AAPL (CSV)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        {/* <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4"
        >
          {[
            { icon: TrendingUp, label: "Predictions Made", value: "2.4M+" },
            { icon: Zap, label: "Avg Accuracy", value: "84.7%" },
            { icon: Shield, label: "Active Users", value: "150K+" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="glass-card p-4 text-center">
              <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
              <div className="text-lg font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </motion.div> */}
      </div>
    </section>
  );
};

export default HeroSection;
