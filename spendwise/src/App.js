import React, { useState, useCallback } from "react";
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

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const handleLogin = (tok, userData) => {
    setToken(tok); setUser(userData);
    localStorage.setItem(STORAGE_TOKEN, tok);
    localStorage.setItem(STORAGE_USER, JSON.stringify(userData));
  };
  const handleLogout = () => {
    setToken(null); setUser(null); setActive("dashboard");
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
  };

  if (!token) return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap'); * { box-sizing: border-box; }`}</style>
      <AuthPage onLogin={handleLogin} />
      <Toast toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id !== id))} />
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

      <Toast toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}