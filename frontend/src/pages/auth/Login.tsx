import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@truthguard.ai");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    {
      label: "Analyst",
      email: "analyst@truthguard.ai",
      password: "demo123",
      note: "Run image, video, and voice analysis",
    },
    {
      label: "Reviewer",
      email: "reviewer@truthguard.ai",
      password: "demo123",
      note: "Review flagged forensic cases",
    },
    {
      label: "Admin",
      email: "admin@truthguard.ai",
      password: "demo123",
      note: "Manage models, audit logs, and settings",
    },
  ];

  function fillDemoAccount(account: {
    email: string;
    password: string;
    label: string;
  }) {
    setEmail(account.email);
    setPassword(account.password);
    toast.success(`${account.label} demo account selected`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!password.trim()) {
      toast.error("Password is required");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      toast.success("Logged in successfully");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="cyber-bg grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-slate-200 transition hover:border-guard-cyan hover:text-guard-cyan"
        >
          <ArrowLeft size={17} />
          Back to website
        </Link>

        <form onSubmit={submit} className="guard-panel p-5 sm:p-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="rounded-2xl bg-guard-cyan p-3 text-guard-ink">
              <ShieldCheck />
            </span>

            <div>
              <p className="text-3xl font-black">TruthGuard AI</p>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-guard-cyan">
                Secure login
              </p>
            </div>
          </Link>

          <h1 className="mt-8 text-3xl font-black">Sign in to console</h1>

          <p className="mt-2 text-slate-400">
            Use a demo account or enter credentials manually.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-300">
                Email address
              </label>

              <input
                className="guard-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-slate-300">
                Password
              </label>

              <div className="relative">
                <input
                  className="guard-input pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-guard-cyan"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 accent-guard-cyan"
                />
                Remember me
              </label>

              <button
                type="button"
                onClick={() =>
                  toast("Password reset is disabled in demo mode.")
                }
                className="font-bold text-guard-cyan hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button className="guard-button w-full" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </div>

          <div className="mt-6 rounded-2xl bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-guard-cyan" />
              <p className="font-black text-white">Quick demo login</p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemoAccount(account)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-black transition hover:-translate-y-0.5 ${
                    email === account.email
                      ? "border-guard-cyan bg-guard-cyan text-guard-ink"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-guard-cyan hover:text-guard-cyan"
                  }`}
                >
                  {account.label}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {demoAccounts.map((account) => (
                <div
                  key={account.label}
                  className="rounded-2xl bg-black/20 p-3"
                >
                  <p className="font-black text-white">{account.label}</p>
                  <p className="mt-1 text-slate-400">{account.note}</p>
                  <p className="mt-1 text-xs text-guard-cyan">
                    {account.email} / {account.password}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              "Secure demo",
              "Role-based",
              "Audit-ready",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 px-3 py-3 text-xs font-black text-slate-300"
              >
                <LockKeyhole size={14} className="text-guard-cyan" />
                {item}
              </div>
            ))}
          </div>
        </form>
      </div>
    </main>
  );
}