import React from "react";
import Icon from "./Icon";

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

export default Toast;