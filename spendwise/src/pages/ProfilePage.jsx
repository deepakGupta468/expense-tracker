import React, { useState, useEffect } from "react";
import { api } from "../api";
import { PasswordInput } from "../components/FormControls";

// ─── PROFILE PAGE ───────────────────────────────────────────────────────────
const ProfilePage = ({ token, addToast, user, setUser }) => {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [pw, setPw] = useState({ current: "", next: "" });
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
    setLoading(true);
    try {
      const res = await api('/profile', { method: 'PUT', body: JSON.stringify({ fullName: name }) }, token);
      setProfile(res);
      setUser({ ...user, fullName: res.fullName });
      addToast("Profile updated", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/profile/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next })
      }, token);
      setPw({ current: "", next: "" });
      addToast("Password changed", "success");
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

          <form onSubmit={handleUpdateName}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
              Full Name
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
              <button disabled={loading} style={{
                padding: "0 20px", borderRadius: 10, border: "none", cursor: "pointer", whiteSpace: "nowrap",
                background: "#6366f1", color: "#fff", fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif"
              }}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>

        {/* Change password */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
          <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, margin: "0 0 18px", color: "#0f172a" }}>Change Password</h3>
          <form onSubmit={handleChangePassword} style={{ display: "grid", gap: 14 }}>
            <div>
              <PasswordInput label="Current Password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} required />
            </div>
            <div>
              <PasswordInput label="New Password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} required minLength={6} />
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