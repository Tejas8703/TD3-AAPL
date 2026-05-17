import { useState } from "react";
import { TrendingUp, Menu, X, LogIn, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { DemoUser } from "@/lib/demoAuth";

type ViewType = "home" | "td3" | "predict" | "fetch";

interface HeaderProps {
  activeView?: ViewType;
  onNavigateView?: (view: ViewType) => void;
  user: DemoUser | null;
  onLogout: () => void;
}

const NAV_LINKS = [
  { label: "Home",       path: "/" },
  { label: "Fetch Data", path: "/fetch" },
  { label: "Features",   path: "/features" },
  { label: "Help",       path: "/help" },
  { label: "Contact",    path: "/contact" },
];
// Predict (LIVE) is rendered after index 1 (Fetch Data) in the desktop nav

const Header = ({ activeView = "home", onNavigateView, user, onLogout }: HeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleViewChange = (view: ViewType) => {
    onNavigateView?.(view);
    setMobileOpen(false);
    if (view === "fetch") { navigate("/fetch"); return; }
    if (window.location.pathname !== "/") { navigate("/"); }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <button type="button" onClick={() => handleViewChange("home")} className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-primary">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            TD3 <span className="text-primary">prediction Model </span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((item, idx) => {
            const isActive = window.location.pathname === item.path;
            return (
              <>
                <button
                  type="button"
                  key={item.path}
                  onClick={() => { setMobileOpen(false); navigate(item.path); }}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground ${
                    isActive ? "text-foreground bg-secondary/60" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </button>
                {idx === 1 && (
                  <button
                    type="button"
                    key="predict"
                    onClick={() => { setMobileOpen(false); navigate("/predict"); }}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground flex items-center ${
                      window.location.pathname === "/predict" ? "text-foreground bg-secondary/60" : "text-muted-foreground"
                    }`}
                  >
                    Predict
                    <span className="ml-1.5 inline-flex h-4 items-center justify-center rounded-full bg-red-500/20 text-[10px] text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] font-bold px-1.5 py-0.5 animate-pulse border border-red-500/50">LIVE</span>
                  </button>
                )}
              </>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex" onClick={() => navigate("/profile")}>
                <User className="h-4 w-4" />
                {user.name}
              </Button>
              <Button variant="ghost" size="sm" className="hidden gap-2 sm:inline-flex" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex" onClick={() => navigate("/login")}>
                <LogIn className="h-4 w-4" />
                Login
              </Button>
              <Button size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/signup")}>
                Sign Up
              </Button>
            </>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/40 bg-background md:hidden"
          >
            <nav className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map((item, idx) => {
                const isActive = window.location.pathname === item.path;
                return (
                  <>
                    <button
                      type="button"
                      key={item.path}
                      className={`rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground ${
                        isActive ? "text-foreground bg-secondary/60" : "text-muted-foreground"
                      }`}
                      onClick={() => { navigate(item.path); setMobileOpen(false); }}
                    >
                      {item.label}
                    </button>
                    {idx === 1 && (
                      <button
                        type="button"
                        key="predict-mobile"
                        className={`rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground flex items-center justify-between ${
                          window.location.pathname === "/predict" ? "text-foreground bg-secondary/60" : "text-muted-foreground"
                        }`}
                        onClick={() => { navigate("/predict"); setMobileOpen(false); }}
                      >
                        Predict
                        <span className="inline-flex h-4 items-center justify-center rounded-full bg-red-500/20 text-[10px] text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] font-bold px-1.5 py-0.5 animate-pulse border border-red-500/50">LIVE</span>
                      </button>
                    )}
                  </>
                );
              })}
              <div className="mt-2 flex gap-2">
                {user ? (
                  <>
                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => { navigate("/profile"); setMobileOpen(false); }}>
                      <User className="h-4 w-4" /> Profile
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1 gap-2" onClick={() => { onLogout(); setMobileOpen(false); }}>
                      <LogOut className="h-4 w-4" /> Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => { navigate("/login"); setMobileOpen(false); }}>
                      <LogIn className="h-4 w-4" /> Login
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => { navigate("/signup"); setMobileOpen(false); }}>
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
