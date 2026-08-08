import React from "react";
import Icon from "./Icon";

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const Sidebar = ({ active, setActive, user, onLogout }) => {
  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "expenses", label: "Expenses", icon: "expense" },
    { id: "categories", label: "Categories", icon: "category" },
    { id: "budgets", label: "Budgets", icon: "budget" },
    { id: "reports", label: "Reports", icon: "report" },
    { id: "profile", label: "Profile", icon: "user" },
  ];

  if (user?.role === 'ADMIN') {
    nav.push({ id: "admin", label: "Admin", icon: "admin" });
  }

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

export default Sidebar;