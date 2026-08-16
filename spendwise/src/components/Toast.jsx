import React from "react";
import Icon from "./Icon";

// ─── TOAST ──────────────────────────────────────────────────────────────────
const THEMES = {
  success: { bg: "#dcfce7", border: "#86efac", fg: "#166534", icon: "check" },
  error:   { bg: "#fee2e2", border: "#fca5a5", fg: "#991b1b", icon: "alert" },
  warning: { bg: "#fef3c7", border: "#fcd34d", fg: "#92400e", icon: "alert" },
  info:    { bg: "#e0f2fe", border: "#7dd3fc", fg: "#075985", icon: "info" },
};

const Toast = ({ toasts, remove }) => (
  <div
    role="status"
    aria-live="polite"
    style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 10, maxWidth: 380,
    }}
  >
    {toasts.map(t => {
      const theme = THEMES[t.type] || THEMES.success;
      return (
        <div key={t.id} style={{
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          color: theme.fg,
          padding: "12px 14px 12px 18px", borderRadius: 10, fontFamily: "'DM Sans', sans-serif",
          fontSize: 14, fontWeight: 500, display: "flex", alignItems: "flex-start", gap: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)", animation: "slideIn .3s ease",
          minWidth: 280,
        }}>
          <span style={{ flexShrink: 0, marginTop: 1 }}><Icon name={theme.icon} size={16} /></span>
          <span style={{ flex: 1, lineHeight: 1.4, wordBreak: "break-word" }}>{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            aria-label="Dismiss notification"
            style={{
              flexShrink: 0, background: "transparent", border: "none", cursor: "pointer",
              color: theme.fg, opacity: .6, padding: 0, marginTop: 1, lineHeight: 0,
            }}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      );
    })}
  </div>
);

export default Toast;
