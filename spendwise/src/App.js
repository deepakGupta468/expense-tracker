import React, { useState, useCallback, useEffect, useRef } from "react";
import { setUnauthorizedHandler } from "./api";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ExpensesPage from "./pages/ExpensesPage";
import CategoriesPage from "./pages/CategoriesPage";
import BudgetsPage from "./pages/BudgetsPage";
import ReportsPage from "./pages/ReportsPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import Sidebar from "./components/Sidebar";
import Toast from "./components/Toast";

const STORAGE_TOKEN = "spendwise.token";
const STORAGE_USER = "spendwise.user";

const TOAST_DURATION = { error: 6000, warning: 5500, info: 4500, success: 4000 };

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN) || null);
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [active, setActive] = useState("dashboard");
  const [toasts, setToasts] = useState([]);

  // Date.now() collides when several toasts fire in the same tick, which gives
  // React duplicate keys — a counter cannot.
  const toastId = useRef(0);
  const timers = useRef(new Map());

  const removeToast = useCallback(id => {
    setToasts(t => t.filter(x => x.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const addToast = useCallback((message, type = "success") => {
    if (!message) return;
    const id = ++toastId.current;
    setToasts(t => [...t, { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
      timers.current.delete(id);
    }, TOAST_DURATION[type] || TOAST_DURATION.success);
    timers.current.set(id, timer);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => { pending.forEach(clearTimeout); pending.clear(); };
  }, []);

  const clearSession = useCallback(() => {
    setToken(null); setUser(null); setActive("dashboard");
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
  }, []);

  const handleLogin = (tok, userData) => {
    setToken(tok); setUser(userData);
    localStorage.setItem(STORAGE_TOKEN, tok);
    localStorage.setItem(STORAGE_USER, JSON.stringify(userData));
    addToast(`Welcome, ${userData.fullName || userData.email}!`, "success");
  };

  const handleLogout = () => {
    clearSession();
    addToast("Signed out. See you soon!", "info");
  };

  // A dead token can surface from any page; handle it once, centrally.
  const expiring = useRef(false);
  useEffect(() => {
    setUnauthorizedHandler(message => {
      if (expiring.current) return;
      expiring.current = true;
      clearSession();
      addToast(message || "Your session has expired. Please sign in again.", "warning");
      setTimeout(() => { expiring.current = false; }, 1000);
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession, addToast]);

  if (!token) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap'); * { box-sizing: border-box; }`}</style>
      <AuthPage onLogin={handleLogin} addToast={addToast} />
      <Toast toasts={toasts} remove={removeToast} />
    </>
  );

  const pages = { dashboard: Dashboard, expenses: ExpensesPage, categories: CategoriesPage, budgets: BudgetsPage, reports: ReportsPage, admin: AdminPage, profile: ProfilePage };
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
        <Page token={token} addToast={addToast} user={user} setUser={setUser} />
      </main>

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}
