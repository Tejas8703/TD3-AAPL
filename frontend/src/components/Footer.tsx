import { TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border/40 bg-card/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-4">

          {/* Brand */}
          <div className="sm:col-span-1">
            <button onClick={() => navigate("/")} className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-bold">TD3 <span className="text-primary">Predict</span></span>
            </button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Research implementation of TD3 reinforcement learning for algorithmic stock trading.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                { label: "Home",       path: "/" },
                { label: "Fetch Data", path: "/fetch" },
                { label: "Predict",    path: "/predict" },
                { label: "Features",   path: "/features" },
              ].map(({ label, path }) => (
                <li key={path}>
                  <button onClick={() => navigate(path)} className="hover:text-foreground transition-colors">{label}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                { label: "Help Guide",   path: "/help" },
                { label: "Contact",      path: "/contact" },
              ].map(({ label, path }) => (
                <li key={path}>
                  <button onClick={() => navigate(path)} className="hover:text-foreground transition-colors">{label}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Developer</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Tejas Patil</li>
              <li>
                <a href="mailto:tejaspatil9284@gmail.com" className="hover:text-foreground transition-colors break-all">
                  tejaspatil9284@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+917709288629" className="hover:text-foreground transition-colors">
                  +91 77092 88629
                </a>
              </li>
              <li className="flex gap-3 pt-1">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">GitHub</a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">LinkedIn</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} TD3 Prediction Model — Tejas Patil. Not financial advice.</span>
          <span>Built with PyTorch · FastAPI · React · Vite</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
