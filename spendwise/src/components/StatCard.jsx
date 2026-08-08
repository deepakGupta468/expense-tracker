import React from "react";
import Icon from "./Icon";

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

export default StatCard;