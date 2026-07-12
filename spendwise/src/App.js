import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8080/api";

// ─── API HELPERS ────────────────────────────────────────────────────────────
const api = async (path, options = {}, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Something went wrong");
  }
  if (res.status === 204) return null;
  return res.json();
};

// ─── ICONS ──────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    expense: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    category: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
    budget: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    report: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    plus: "M12 4v16m8-8H4",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    close: "M6 18L18 6M6 6l12 12",
    alert: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    wallet: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  };
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={icons[name] || icons.expense} />
    </svg>
  );
};

// ─── TOAST ──────────────────────────────────────────────────────────────────
const Toast = ({ toasts, remove }) => (
  <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        background: t.type === "error" ? "#fee2e2" : "#dcfce7",
        border: `1px solid ${t.type === "error" ? "#fca5a5" : "#86efac"}`,
        color: t.type === "error" ? "#991b1b" : "#166534",
        padding: "12px 18px", borderRadius: 10, fontFamily: "'DM Sans', sans-serif",
        fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)", animation: "slideIn .3s ease",
        minWidth: 280, cursor: "pointer"
      }} onClick={() => remove(t.id)}>
        <Icon name={t.type === "error" ? "alert" : "check"} size={16} />
        {t.message}
      </div>
    ))}
  </div>
);

// ─── MODAL ──────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    backdropFilter: "blur(4px)"
  }}>
    <div style={{
      background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 480,
      boxShadow: "0 25px 60px rgba(0,0,0,0.2)", animation: "modalIn .2s ease"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0f172a" }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
          <Icon name="close" size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── FORM COMPONENTS ────────────────────────────────────────────────────────
const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "'DM Sans', sans-serif" }}>{label}</label>}
    <input {...props} style={{
      width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0",
      fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#0f172a", outline: "none",
      transition: "border-color .2s", background: "#f8fafc", boxSizing: "border-box",
      ...props.style
    }} onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "'DM Sans', sans-serif" }}>{label}</label>}
    <select {...props} style={{
      width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0",
      fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#0f172a", outline: "none",
      background: "#f8fafc", boxSizing: "border-box", cursor: "pointer"
    }}>{children}</select>
  </div>
);

const Btn = ({ children, variant = "primary", loading, ...props }) => {
  const styles = {
    primary: { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none" },
    secondary: { background: "#f1f5f9", color: "#374151", border: "1.5px solid #e2e8f0" },
    danger: { background: "#fee2e2", color: "#dc2626", border: "1.5px solid #fca5a5" },
  };
  return (
    <button {...props} style={{
      padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6,
      transition: "all .2s", opacity: props.disabled ? .6 : 1,
      ...styles[variant], ...props.style
    }}>
      {loading ? "..." : children}
    </button>
  );
};

// ─── AUTH PAGE ───────────────────────────────────────────────────────────────
const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = await api(
        mode === "login" ? "/auth/login" : "/auth/register",
        { method: "POST", body: JSON.stringify(form) }
      );
      onLogin(data.token, data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      fontFamily: "'DM Sans', sans-serif", padding: 20
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes modalIn { from { transform: scale(.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        input:focus, select:focus { outline: none !important; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,.15) !important; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            boxShadow: "0 8px 32px rgba(99,102,241,.4)", animation: "float 3s ease-in-out infinite"
          }}>
            <Icon name="wallet" size={32} />
          </div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 28, fontFamily: "'Sora', sans-serif", fontWeight: 800 }}>SpendWise</h1>
          <p style={{ color: "rgba(255,255,255,.5)", margin: "6px 0 0", fontSize: 14 }}>Track every penny, master your money</p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 36, boxShadow: "0 30px 80px rgba(0,0,0,.4)" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 28 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, transition: "all .2s",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#6366f1" : "#64748b",
                boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,.1)" : "none"
              }}>{m === "login" ? "Sign In" : "Create Account"}</button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode === "register" && <Input label="Full Name" placeholder="John Doe" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />}
            <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />

            {error && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="alert" size={14} /> {error}
              </div>
            )}

            <Btn type="submit" loading={loading} style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 15 }}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </Btn>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const Sidebar = ({ active, setActive, user, onLogout }) => {
  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "expenses", label: "Expenses", icon: "expense" },
    { id: "categories", label: "Categories", icon: "category" },
    { id: "budgets", label: "Budgets", icon: "budget" },
    { id: "reports", label: "Reports", icon: "report" },
  ];

  return (
    <div style={{
      width: 240, background: "#0f172a", height: "100vh", display: "flex", flexDirection: "column",
      position: "fixed", left: 0, top: 0, zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Icon name="wallet" size={20} />
          </div>
          <div>
            <div style={{ color: "#fff", fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16 }}>SpendWise</div>
            <div style={{ color: "rgba(255,255,255,.35)", fontSize: 11 }}>Expense Tracker</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10,
            border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            fontSize: 14, transition: "all .15s", textAlign: "left",
            background: active === item.id ? "rgba(99,102,241,.2)" : "transparent",
            color: active === item.id ? "#a5b4fc" : "rgba(255,255,255,.5)",
            borderLeft: active === item.id ? "3px solid #6366f1" : "3px solid transparent",
          }}>
            <Icon name={item.icon} size={17} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: "16px 16px 24px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,.05)" }}>
          <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{user?.fullName}</div>
          <div style={{ color: "rgba(255,255,255,.35)", fontSize: 11, marginTop: 2 }}>{user?.email}</div>
        </div>
        <button onClick={onLogout} style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px",
          borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(239,68,68,.1)",
          color: "#f87171", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 13
        }}>
          <Icon name="logout" size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
};

// ─── STAT CARD ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color, icon }) => (
  <div style={{
    background: "#fff", borderRadius: 16, padding: "22px 24px",
    boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9"
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ color: "#64748b", fontSize: 13, fontWeight: 500, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
        <div style={{ color: "#0f172a", fontSize: 26, fontWeight: 700, fontFamily: "'Sora', sans-serif" }}>{value}</div>
        {sub && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: color + "1a",
        display: "flex", alignItems: "center", justifyContent: "center", color
      }}>
        <Icon name={icon} size={20} />
      </div>
    </div>
  </div>
);

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const Dashboard = ({ token, addToast }) => {
  const [report, setReport] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const now = new Date();

  useEffect(() => {
    const load = async () => {
      try {
        const [r, b, e] = await Promise.all([
          api(`/reports/monthly?month=${now.getMonth() + 1}&year=${now.getFullYear()}`, {}, token),
          api("/budgets/monthly?month=" + (now.getMonth() + 1) + "&year=" + now.getFullYear(), {}, token),
          api("/expenses", {}, token),
        ]);
        setReport(r); setBudgets(b); setExpenses(e.slice(0, 5));
      } catch (e) { addToast(e.message, "error"); }
    };
    load();
  }, [token]);

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0f172a" }}>Dashboard</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>{months[now.getMonth()]} {now.getFullYear()} overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Monthly Spending" value={fmt(report?.totalAmount)} sub={`${report?.totalTransactions || 0} transactions`} color="#6366f1" icon="expense" />
        <StatCard label="Total Expenses" value={expenses.length} sub="all time" color="#0ea5e9" icon="wallet" />
        <StatCard label="Active Budgets" value={budgets.length} sub="this month" color="#10b981" icon="budget" />
        <StatCard label="Over Budget" value={budgets.filter(b => b.exceeded).length} sub="categories" color="#f59e0b" icon="alert" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Category Breakdown */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: "0 0 18px", fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Category Breakdown</h3>
          {report?.categoryBreakdown && Object.keys(report.categoryBreakdown).length > 0 ? (
            Object.entries(report.categoryBreakdown).map(([cat, amt], i) => {
              const colors = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
              const total = report.totalAmount || 1;
              const pct = Math.round((amt / total) * 100);
              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{cat}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{fmt(amt)}</span>
                  </div>
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3 }}>
                    <div style={{ height: 6, borderRadius: 3, background: colors[i % colors.length], width: `${pct}%`, transition: "width .5s ease" }} />
                  </div>
                </div>
              );
            })
          ) : <p style={{ color: "#94a3b8", fontSize: 13 }}>No data this month yet.</p>}
        </div>

        {/* Recent Expenses */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: "0 0 18px", fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Recent Expenses</h3>
          {expenses.length > 0 ? expenses.map(e => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f8fafc" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{e.title}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{e.categoryName} · {e.expenseDate}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>−{fmt(e.amount)}</div>
            </div>
          )) : <p style={{ color: "#94a3b8", fontSize: 13 }}>No expenses recorded yet.</p>}
        </div>

        {/* Budget Status */}
        {budgets.length > 0 && (
          <div style={{ gridColumn: "1 / -1", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9" }}>
            <h3 style={{ margin: "0 0 18px", fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Budget Status</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
              {budgets.map(b => {
                const pct = Math.min(Math.round((b.totalSpent / b.monthlyLimit) * 100), 100);
                const color = b.exceeded ? "#ef4444" : pct > 75 ? "#f59e0b" : "#10b981";
                return (
                  <div key={b.id} style={{ padding: "14px 16px", borderRadius: 12, background: color + "08", border: `1px solid ${color}30` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{b.categoryName}</span>
                      {b.exceeded && <span style={{ fontSize: 11, fontWeight: 600, color, background: color + "1a", padding: "2px 8px", borderRadius: 20 }}>Over!</span>}
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, marginBottom: 6 }}>
                      <div style={{ height: 6, borderRadius: 3, background: color, width: `${pct}%` }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}>
                      <span>{fmt(b.totalSpent)} spent</span>
                      <span>{fmt(b.monthlyLimit)} limit</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── EXPENSES PAGE ───────────────────────────────────────────────────────────
const ExpensesPage = ({ token, addToast }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", amount: "", expenseDate: new Date().toISOString().split("T")[0], categoryId: "" });

  const load = useCallback(async () => {
    try {
      const [e, c] = await Promise.all([api("/expenses", {}, token), api("/categories", {}, token)]);
      setExpenses(e); setCategories(c);
      if (c.length && !form.categoryId) setForm(f => ({ ...f, categoryId: c[0].id }));
    } catch (e) { addToast(e.message, "error"); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) {
        await api(`/expenses/${editing.id}`, { method: "PUT", body: JSON.stringify({ ...form, amount: parseFloat(form.amount), categoryId: parseInt(form.categoryId) }) }, token);
        addToast("Expense updated!", "success");
      } else {
        await api("/expenses", { method: "POST", body: JSON.stringify({ ...form, amount: parseFloat(form.amount), categoryId: parseInt(form.categoryId) }) }, token);
        addToast("Expense added!", "success");
      }
      setShowModal(false); setEditing(null);
      setForm({ title: "", description: "", amount: "", expenseDate: new Date().toISOString().split("T")[0], categoryId: categories[0]?.id || "" });
      load();
    } catch (err) { addToast(err.message, "error"); } finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try { await api(`/expenses/${id}`, { method: "DELETE" }, token); addToast("Deleted!", "success"); load(); }
    catch (e) { addToast(e.message, "error"); }
  };

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0f172a" }}>Expenses</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>{expenses.length} total entries</p>
        </div>
        <Btn onClick={() => { setEditing(null); setForm({ title: "", description: "", amount: "", expenseDate: new Date().toISOString().split("T")[0], categoryId: categories[0]?.id || "" }); setShowModal(true); }}>
          <Icon name="plus" size={15} /> Add Expense
        </Btn>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        {expenses.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
            <Icon name="expense" size={40} /><p style={{ marginTop: 12 }}>No expenses yet. Add your first one!</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Title", "Category", "Amount", "Date", "Actions"].map(h => (
                  <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", fontFamily: "'DM Sans', sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => (
                <tr key={e.id} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 14 }}>{e.title}</div>
                    {e.description && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{e.description}</div>}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ background: "#ede9fe", color: "#7c3aed", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{e.categoryName}</span>
                  </td>
                  <td style={{ padding: "14px 20px", fontWeight: 700, color: "#ef4444", fontSize: 14 }}>{fmt(e.amount)}</td>
                  <td style={{ padding: "14px 20px", color: "#64748b", fontSize: 13 }}>{e.expenseDate}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setEditing(e); setForm({ title: e.title, description: e.description || "", amount: e.amount, expenseDate: e.expenseDate, categoryId: e.categoryId }); setShowModal(true); }}
                        style={{ padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: "#f0f9ff", color: "#0ea5e9" }}>
                        <Icon name="edit" size={14} />
                      </button>
                      <button onClick={() => del(e.id)}
                        style={{ padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: "#fff1f2", color: "#f43f5e" }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Expense" : "Add Expense"} onClose={() => { setShowModal(false); setEditing(null); }}>
          <form onSubmit={submit}>
            <Input label="Title" placeholder="Lunch, Rent, etc." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            <Input label="Description (optional)" placeholder="Details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Input label="Amount (₹)" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <Input label="Date" type="date" value={form.expenseDate} onChange={e => setForm({ ...form, expenseDate: e.target.value })} required />
            <Select label="Category" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn type="button" variant="secondary" onClick={() => { setShowModal(false); setEditing(null); }}>Cancel</Btn>
              <Btn type="submit" loading={loading}>{editing ? "Update" : "Add Expense"}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─── CATEGORIES PAGE ─────────────────────────────────────────────────────────
const CategoriesPage = ({ token, addToast }) => {
  const [cats, setCats] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", icon: "" });

  const load = useCallback(async () => {
    try { const c = await api("/categories", {}, token); setCats(c); }
    catch (e) { addToast(e.message, "error"); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) {
        await api(`/categories/${editing.id}`, { method: "PUT", body: JSON.stringify(form) }, token);
        addToast("Category updated!", "success");
      } else {
        await api("/categories", { method: "POST", body: JSON.stringify(form) }, token);
        addToast("Category created!", "success");
      }
      setShowModal(false); setEditing(null); setForm({ name: "", description: "", icon: "" }); load();
    } catch (err) { addToast(err.message, "error"); } finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try { await api(`/categories/${id}`, { method: "DELETE" }, token); addToast("Deleted!", "success"); load(); }
    catch (e) { addToast(e.message, "error"); }
  };

  const palette = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0f172a" }}>Categories</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>{cats.length} categories</p>
        </div>
        <Btn onClick={() => { setEditing(null); setForm({ name: "", description: "", icon: "" }); setShowModal(true); }}>
          <Icon name="plus" size={15} /> New Category
        </Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {cats.length === 0 ? (
          <div style={{ gridColumn: "1/-1", padding: 60, textAlign: "center", color: "#94a3b8", background: "#fff", borderRadius: 16 }}>
            <Icon name="category" size={40} /><p style={{ marginTop: 12 }}>No categories yet.</p>
          </div>
        ) : cats.map((c, i) => (
          <div key={c.id} style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9", position: "relative" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
              background: palette[i % palette.length] + "15", color: palette[i % palette.length], fontSize: 22, marginBottom: 14
            }}>
              {c.icon || <Icon name="category" size={22} />}
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 4 }}>{c.name}</div>
            {c.description && <div style={{ color: "#94a3b8", fontSize: 13 }}>{c.description}</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
              <button onClick={() => { setEditing(c); setForm({ name: c.name, description: c.description || "", icon: c.icon || "" }); setShowModal(true); }}
                style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1.5px solid #e2e8f0", cursor: "pointer", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 500 }}>
                Edit
              </button>
              <button onClick={() => del(c.id)}
                style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1.5px solid #fee2e2", cursor: "pointer", background: "#fff", color: "#f43f5e", fontSize: 13, fontWeight: 500 }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Category" : "New Category"} onClose={() => { setShowModal(false); setEditing(null); }}>
          <form onSubmit={submit}>
            <Input label="Name" placeholder="Food, Travel, Bills..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <Input label="Description" placeholder="Optional description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Input label="Icon (emoji)" placeholder="🍔 🚗 💡" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn type="button" variant="secondary" onClick={() => { setShowModal(false); setEditing(null); }}>Cancel</Btn>
              <Btn type="submit" loading={loading}>{editing ? "Update" : "Create"}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─── BUDGETS PAGE ────────────────────────────────────────────────────────────
const BudgetsPage = ({ token, addToast }) => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({ monthlyLimit: "", month: now.getMonth() + 1, year: now.getFullYear(), categoryId: "" });

  const load = useCallback(async () => {
    try {
      const [b, c] = await Promise.all([api("/budgets", {}, token), api("/categories", {}, token)]);
      setBudgets(b); setCategories(c);
    } catch (e) { addToast(e.message, "error"); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = { ...form, monthlyLimit: parseFloat(form.monthlyLimit), month: parseInt(form.month), year: parseInt(form.year) };
      if (!payload.categoryId) delete payload.categoryId;
      else payload.categoryId = parseInt(payload.categoryId);
      await api("/budgets", { method: "POST", body: JSON.stringify(payload) }, token);
      addToast("Budget set!", "success"); setShowModal(false); setForm({ monthlyLimit: "", month: now.getMonth() + 1, year: now.getFullYear(), categoryId: "" }); load();
    } catch (err) { addToast(err.message, "error"); } finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this budget?")) return;
    try { await api(`/budgets/${id}`, { method: "DELETE" }, token); addToast("Deleted!", "success"); load(); }
    catch (e) { addToast(e.message, "error"); }
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0f172a" }}>Budgets</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Monitor your spending limits</p>
        </div>
        <Btn onClick={() => setShowModal(true)}><Icon name="plus" size={15} /> Set Budget</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {budgets.length === 0 ? (
          <div style={{ gridColumn: "1/-1", padding: 60, textAlign: "center", color: "#94a3b8", background: "#fff", borderRadius: 16 }}>
            <Icon name="budget" size={40} /><p style={{ marginTop: 12 }}>No budgets set yet.</p>
          </div>
        ) : budgets.map(b => {
          const pct = Math.min(Math.round(((b.totalSpent || 0) / b.monthlyLimit) * 100), 100);
          const color = b.exceeded ? "#ef4444" : pct > 75 ? "#f59e0b" : "#10b981";
          return (
            <div key={b.id} style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: `1px solid ${color}30` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{b.categoryName}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][b.month - 1]} {b.year}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {b.exceeded && <span style={{ fontSize: 11, fontWeight: 700, color, background: color + "15", padding: "3px 10px", borderRadius: 20 }}>EXCEEDED</span>}
                  <button onClick={() => del(b.id)} style={{ padding: "6px", borderRadius: 8, border: "none", cursor: "pointer", background: "#fff1f2", color: "#f43f5e" }}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
              <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, marginBottom: 12 }}>
                <div style={{ height: 8, borderRadius: 4, background: color, width: `${pct}%`, transition: "width .5s" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["Spent", fmt(b.totalSpent), "#ef4444"], ["Limit", fmt(b.monthlyLimit), "#0f172a"], ["Left", fmt(b.remaining), color]].map(([l, v, c]) => (
                  <div key={l} style={{ textAlign: "center", padding: "10px 0", background: "#f8fafc", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Set Budget" onClose={() => setShowModal(false)}>
          <form onSubmit={submit}>
            <Input label="Monthly Limit (₹)" type="number" step="0.01" min="1" placeholder="5000.00" value={form.monthlyLimit} onChange={e => setForm({ ...form, monthlyLimit: e.target.value })} required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select label="Month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}>
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </Select>
              <Input label="Year" type="number" min="2000" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required />
            </div>
            <Select label="Category (optional — leave blank for overall)" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Overall Budget</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn type="submit" loading={loading}>Set Budget</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ─── REPORTS PAGE ────────────────────────────────────────────────────────────
const ReportsPage = ({ token, addToast }) => {
  const now = new Date();
  const [type, setType] = useState("monthly");
  const [params, setParams] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), date: now.toISOString().split("T")[0], startDate: "", endDate: "" });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      let r;
      if (type === "monthly") r = await api(`/reports/monthly?month=${params.month}&year=${params.year}`, {}, token);
      else if (type === "daily") r = await api(`/reports/daily?date=${params.date}`, {}, token);
      else r = await api(`/reports/range?startDate=${params.startDate}&endDate=${params.endDate}`, {}, token);
      setReport(r);
    } catch (e) { addToast(e.message, "error"); } finally { setLoading(false); }
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00";
  const palette = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6"];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0f172a" }}>Reports</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Analyze your spending patterns</p>
      </div>

      {/* Controls */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {[["monthly", "Monthly"], ["daily", "Daily"], ["range", "Date Range"]].map(([v, l]) => (
            <button key={v} onClick={() => setType(v)} style={{
              padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, transition: "all .15s",
              background: type === v ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#f1f5f9",
              color: type === v ? "#fff" : "#64748b"
            }}>{l}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          {type === "monthly" && <>
            <div style={{ flex: 1, minWidth: 120 }}>
              <Select label="Month" value={params.month} onChange={e => setParams({ ...params, month: e.target.value })} style={{ marginBottom: 0 }}>
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </Select>
            </div>
            <div style={{ flex: 1, minWidth: 100 }}>
              <Input label="Year" type="number" min="2000" value={params.year} onChange={e => setParams({ ...params, year: e.target.value })} style={{ marginBottom: 0 }} />
            </div>
          </>}
          {type === "daily" && (
            <div style={{ flex: 1, minWidth: 160 }}>
              <Input label="Date" type="date" value={params.date} onChange={e => setParams({ ...params, date: e.target.value })} style={{ marginBottom: 0 }} />
            </div>
          )}
          {type === "range" && <>
            <div style={{ flex: 1, minWidth: 150 }}>
              <Input label="Start Date" type="date" value={params.startDate} onChange={e => setParams({ ...params, startDate: e.target.value })} style={{ marginBottom: 0 }} />
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <Input label="End Date" type="date" value={params.endDate} onChange={e => setParams({ ...params, endDate: e.target.value })} style={{ marginBottom: 0 }} />
            </div>
          </>}
          <Btn onClick={generate} loading={loading} style={{ marginBottom: 0 }}>Generate Report</Btn>
        </div>
      </div>

      {report && (
        <div>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
            <StatCard label="Total Spent" value={fmt(report.totalAmount)} color="#6366f1" icon="expense" />
            <StatCard label="Transactions" value={report.totalTransactions} color="#0ea5e9" icon="wallet" />
            <StatCard label="Period" value={report.period?.split(": ")[1] || ""} color="#10b981" icon="report" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Category chart */}
            {report.categoryBreakdown && Object.keys(report.categoryBreakdown).length > 0 && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9" }}>
                <h3 style={{ margin: "0 0 20px", fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>By Category</h3>
                {Object.entries(report.categoryBreakdown).map(([cat, amt], i) => {
                  const pct = Math.round((amt / (report.totalAmount || 1)) * 100);
                  return (
                    <div key={cat} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: palette[i % palette.length] }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{cat}</span>
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
                          <span style={{ color: "#64748b" }}>{pct}%</span>
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>{fmt(amt)}</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3 }}>
                        <div style={{ height: 6, borderRadius: 3, background: palette[i % palette.length], width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Expense list */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9", maxHeight: 420, overflowY: "auto" }}>
              <h3 style={{ margin: "0 0 16px", fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Transactions</h3>
              {report.expenses?.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13 }}>No transactions in this period.</p>
              ) : report.expenses?.map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f8fafc" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{e.title}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{e.expenseDate} · {e.categoryName}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>−{fmt(e.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const handleLogin = (tok, userData) => { setToken(tok); setUser(userData); };
  const handleLogout = () => { setToken(null); setUser(null); setActive("dashboard"); };

  if (!token) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap'); * { box-sizing: border-box; }`}</style>
      <AuthPage onLogin={handleLogin} />
      <Toast toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </>
  );

  const pages = { dashboard: Dashboard, expenses: ExpensesPage, categories: CategoriesPage, budgets: BudgetsPage, reports: ReportsPage };
  const Page = pages[active];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes modalIn { from { transform: scale(.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        input:focus, select:focus { outline: none !important; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,.15) !important; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>

      <Sidebar active={active} setActive={setActive} user={user} onLogout={handleLogout} />

      <main style={{ marginLeft: 240, padding: "36px 36px 60px", minHeight: "100vh" }}>
        <Page token={token} addToast={addToast} />
      </main>

      <Toast toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}