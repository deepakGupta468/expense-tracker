import React, { useState, useEffect } from "react";
import { api } from "../api";
import { PasswordInput } from "../components/FormControls";

// ─── PROFILE PAGE ───────────────────────────────────────────────────────────
const ProfilePage = ({ token, addToast, user, setUser }) => {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [pw, setPw] = useState({ current: "", next: "" });
  const [nameError, setNameError] = useState("");
  const [pwErrors, setPwErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api('/profile/me', {}, token);
        setProfile(res);
        setName(res.fullName);
      } catch (e) {
        addToast(e.message, "error");
      }
    };
    load();
  }, [token, addToast]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    const problem = !trimmed ? "Full name is required"
      : trimmed.length < 2 ? "Full name must be at least 2 characters"
      : trimmed.length > 100 ? "Full name must not exceed 100 characters"
      : null;
    if (problem) { setNameError(problem); addToast(problem, "warning"); return; }

    if (profile && trimmed === profile.fullName) {
      addToast("That is already your name — nothing to save.", "info");
      return;
    }

    setLoading(true);
    try {
      const res = await api('/profile', { method: 'PUT', body: JSON.stringify({ fullName: trimmed }) }, token);
      setProfile(res);
      setUser({ ...user, fullName: res.fullName });
      setName(res.fullName);
      setNameError("");
      addToast(`Name updated to "${res.fullName}".`, "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pw.current) errs.current = "Current password is required";
    if (!pw.next) errs.next = "New password is required";
    else if (pw.next.length < 6) errs.next = "New password must be at least 6 characters";
    else if (pw.current === pw.next) errs.next = "New password must be different from current password";
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) {
      addToast(errs.current || errs.next, "warning");
      return;
    }
    setLoading(true);
    try {
      await api('/profile/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next })
      }, token);
      setPw({ current: "", next: "" });
      setPwErrors({});
      addToast("Password changed. Use it the next time you sign in.", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0",
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, background: "#fff"
  };

  return (
    <div style={{ animation: "slideIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, margin: 0, color: "#0f172a" }}>Profile</h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "6px 0 0" }}>Manage your account details and password</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 900 }}>
        {/* Details + Update name */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
          <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, margin: "0 0 18px", color: "#0f172a" }}>Account Details</h3>
          {profile && (
            <div style={{ display: "grid", gap: 12, marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>Email</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{profile.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>Role</div>
                <span style={{
                  display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                  background: profile.role === 'ADMIN' ? "#ede9fe" : "#dbeafe",
                  color: profile.role === 'ADMIN' ? "#7c3aed" : "#2563eb"
                }}>{profile.role}</span>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>Member since</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{new Date(profile.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleUpdateName} noValidate>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
              Full Name
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={name} onChange={e => { setName(e.target.value); setNameError(""); }} style={{ ...inputStyle, borderColor: nameError ? "#ef4444" : "#e2e8f0" }} required />
              <button disabled={loading} style={{
                padding: "0 20px", borderRadius: 10, border: "none", cursor: "pointer", whiteSpace: "nowrap",
                background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif"
              }}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
            {nameError && <div style={{ marginTop: 5, fontSize: 12, color: "#ef4444", fontWeight: 500 }}>{nameError}</div>}
          </form>
        </div>

        {/* Change password */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
          <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, margin: "0 0 18px", color: "#0f172a" }}>Change Password</h3>
          <form onSubmit={handleChangePassword} style={{ display: "grid", gap: 14 }} noValidate>
            <div>
              <PasswordInput label="Current Password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} error={pwErrors.current} required />
            </div>
            <div>
              <PasswordInput label="New Password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} error={pwErrors.next} required minLength={6} />
            </div>
            <button disabled={loading} style={{
              padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
              background: "#0f172a", color: "#fff", fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif"
            }}>
              {loading ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;