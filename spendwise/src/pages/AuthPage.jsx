import React, { useState } from "react";
import { api } from "../api";
import Icon from "../components/Icon";
import { Input, PasswordInput, Btn } from "../components/FormControls";

// ─── AUTH PAGE ───────────────────────────────────────────────────────────────
const AuthPage = ({ onLogin, addToast }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    const errs = {};
    if (mode === "register") {
      if (!form.fullName.trim()) errs.fullName = "Full name is required";
      else if (form.fullName.trim().length < 2) errs.fullName = "Full name must be at least 2 characters";
    }
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Please enter a valid email address";
    if (!form.password) errs.password = "Password is required";
    else if (mode === "register" && form.password.length < 6) errs.password = "Password must be at least 6 characters";
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      addToast?.("Please fix the highlighted fields before continuing.", "warning");
      return;
    }
    setLoading(true); setError("");
    const isLogin = mode === "login";
    try {
      const body = isLogin
        ? { email: form.email.trim(), password: form.password }
        : { fullName: form.fullName.trim(), email: form.email.trim(), password: form.password };
      const data = await api(
        isLogin ? "/auth/login" : "/auth/register",
        { method: "POST", body: JSON.stringify(body) }
      );
      if (!isLogin) addToast?.("Account created successfully.", "success");
      // handleLogin raises the welcome toast once the session is stored.
      onLogin(data.token, data);
    } catch (err) {
      setError(err.message);
      addToast?.(err.message, "error");
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
              <button key={m} onClick={() => { setMode(m); setErrors({}); setError(""); }} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, transition: "all .2s",
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#6366f1" : "#64748b",
                boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,.1)" : "none"
              }}>{m === "login" ? "Sign In" : "Create Account"}</button>
            ))}
          </div>

          <form onSubmit={submit} noValidate>
            {mode === "register" && <Input label="Full Name" placeholder="John Doe" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} error={errors.fullName} required />}
            <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} error={errors.email} required />
            <PasswordInput label="Password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} error={errors.password} required />

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

export default AuthPage;