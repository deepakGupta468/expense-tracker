import React from "react";
import Icon from "./Icon";

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

export default Modal;