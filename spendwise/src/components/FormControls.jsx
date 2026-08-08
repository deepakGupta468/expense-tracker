import React, { useState } from "react";
import Icon from "./Icon";

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

const PasswordInput = ({ label, style, ...props }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "'DM Sans', sans-serif" }}>{label}</label>}
      <div style={{ position: "relative" }}>
        <input {...props} type={show ? "text" : "password"} style={{
          width: "100%", padding: "10px 14px", paddingRight: 44, borderRadius: 10, border: "1.5px solid #e2e8f0",
          fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#0f172a", outline: "none",
          transition: "border-color .2s", background: "#f8fafc", boxSizing: "border-box",
          ...props.style
        }} onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
        <button type="button" onClick={() => setShow(!show)} title={show ? "Hide password" : "Show password"} style={{
          position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 6,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Icon name={show ? "eyeOff" : "eye"} size={18} />
        </button>
      </div>
    </div>
  );
};

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

export { Input, PasswordInput, Select, Btn };