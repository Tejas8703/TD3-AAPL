import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, Send, CheckCircle2, MapPin, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCurrentUser, logoutDemoUser, type DemoUser } from "@/lib/demoAuth";

const TOPICS = ["General Question", "Bug Report", "Feature Request", "Research Collaboration", "Other"];

const TEAM = [
  { initials: "TP1", name: "Tejas Patil",      role: "Lead Developer & ML Engineer" },
  { initials: "TV",  name: "Tejas Verma",       role: "Backend & Data Engineering" },
  { initials: "HS",  name: "Harshal Sonawane",  role: "Frontend & UI/UX" },
  { initials: "VC",  name: "Vivek Chaudhari",   role: "Research & Model Training" },
];

const AVATAR_COLORS = ["bg-indigo-500", "bg-purple-500", "bg-sky-500", "bg-emerald-500"];

export default function Contact() {
  const navigate = useNavigate();
  const [user, setUser] = useState<DemoUser | null>(null);

  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [topic,   setTopic]   = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setUser(getCurrentUser()); }, []);
  const handleLogout = () => { logoutDemoUser(); setUser(null); navigate("/login"); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false); setSent(true);
      setName(""); setEmail(""); setMessage("");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeView="home" user={user} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-14 max-w-5xl">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/40 bg-secondary/30 px-4 py-1.5 text-xs font-medium">
            <Mail className="h-3.5 w-3.5 text-primary" /> Get In Touch
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">
            Contact <span className="text-primary">the Team</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Questions about our research or the platform? Send us a message below.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-10">

          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="md:col-span-2 space-y-6"
          >

            {/* Project info card */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm">Final Year Project</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                This platform is developed as a <span className="text-foreground font-semibold">B.E. Computer Engineering Final Year Project</span> at
                our college in Maharashtra. It demonstrates the application of reinforcement learning (TD3) for
                algorithmic stock trading with a full-stack web dashboard.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["TD3 / RL", "PyTorch", "FastAPI", "React", "Yahoo Finance"].map(t => (
                  <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            </div>

            {/* Team */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Team Members</span>
              </div>
              <div className="space-y-3">
                {TEAM.map((m, i) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl ${AVATAR_COLORS[i]} flex items-center justify-center text-xs font-black text-white shrink-0`}>
                      {m.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact info */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Contact Info</p>
              <a href="mailto:tejaspatil9284@gmail.com"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                tejaspatil9284@gmail.com
              </a>
              <a href="tel:+917709288629"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                +91 77092 88629
              </a>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                Maharashtra, India
              </div>
            </div>

          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="md:col-span-3"
          >
            <div className="rounded-2xl border border-border bg-card p-7">
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center gap-4"
                >
                  <div className="h-16 w-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Message Sent!</h3>
                    <p className="text-muted-foreground text-sm">Thanks for reaching out. We'll get back to you soon.</p>
                  </div>
                  <Button variant="outline" className="mt-2" onClick={() => setSent(false)}>Send Another</Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold mb-0.5">Send a Message</h2>
                    <p className="text-sm text-muted-foreground">All fields required.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Your Name</Label>
                      <Input id="name" placeholder="e.g. John Doe" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Topic</Label>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map(t => (
                        <button key={t} type="button" onClick={() => setTopic(t)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                            topic === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                          }`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message</Label>
                    <textarea
                      id="message" rows={5}
                      placeholder="Describe your question, issue, or idea…"
                      value={message} onChange={e => setMessage(e.target.value)} required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>

                  <Button type="submit" disabled={loading}
                    className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-11">
                    {loading
                      ? <><div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Sending…</>
                      : <><Send className="h-4 w-4" />Send Message</>}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
