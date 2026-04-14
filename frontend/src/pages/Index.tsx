import { useEffect, useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import TD3Results from "@/components/TD3Results";
import StockOverview from "@/components/StockOverview";
import StockChart from "@/components/StockChart";
import RiskDisclaimer from "@/components/RiskDisclaimer";
import Footer from "@/components/Footer";
import { stocks } from "@/data/mockStocks";
import type { Stock } from "@/data/mockStocks";
import { getCurrentUser, initDemoAuth, logoutDemoUser, type DemoUser } from "@/lib/demoAuth";

const Index = () => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [activeView, setActiveView] = useState<"home" | "td3">("home");
  const [user, setUser] = useState<DemoUser | null>(null);

  useEffect(() => {
    initDemoAuth();
    setUser(getCurrentUser());
  }, []);

  const handleSearch = (ticker: string) => {
    const stock = stocks[ticker];
    if (stock) {
      setSelectedStock(stock);
      setActiveView("home");
      // Scroll to results
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleLogout = () => {
    logoutDemoUser();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeView={activeView} onNavigateView={setActiveView} user={user} onLogout={handleLogout} />

      {activeView === "home" ? (
        <>
          <HeroSection onSearch={handleSearch} />

          {selectedStock && (
            <section id="results" className="container mx-auto space-y-6 px-4 py-10">
              <StockOverview stock={selectedStock} />
              <StockChart stock={selectedStock} />
              <RiskDisclaimer />
            </section>
          )}
        </>
      ) : (
        <section id="td3-output">
          {/* TD3 model output: CSV data run through ML model — charts, open/close, metrics */}
          <TD3Results />
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Index;
