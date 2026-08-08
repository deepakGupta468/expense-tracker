import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import { Input, Btn } from "../components/FormControls";

// ─── CATEGORIES PAGE ─────────────────────────────────────────────────────────
const CategoriesPage = ({ token, addToast }) => {
  const [cats, setCats] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ name: "", description: "", icon: "" });

  const load = useCallback(async () => {
    try { const c = await api("/categories", {}, token); setCats(c); }
    catch (e) { addToast(e.message, "error"); }
  }, [token, addToast]);

  useEffect(() => { load(); }, [load]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Category name is required";
    else if (form.name.trim().length < 2) errs.name = "Category name must be at least 2 characters";
    else if (form.name.trim().length > 50) errs.name = "Category name must not exceed 50 characters";
    if (form.description && form.description.length > 200) errs.description = "Description must not exceed 200 characters";
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const payload = { ...form, name: form.name.trim() };
      if (editing) {
        await api(`/categories/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) }, token);
        addToast("Category updated!", "success");
      } else {
        await api("/categories", { method: "POST", body: JSON.stringify(payload) }, token);
        addToast("Category created!", "success");
      }
      setShowModal(false); setEditing(null); setErrors({}); setForm({ name: "", description: "", icon: "" }); load();
    } catch (err) { addToast(err.message, "error"); } finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try { await api(`/categories/${id}`, { method: "DELETE" }, token); addToast("Deleted!", "success"); load(); }
    catch (e) { addToast(e.message, "error"); }
  };

  const palette = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
  const EMOJIS = ["🍔","🚗","💡","🛒","🏠","🎓","💊","✈️","🎬","📱","☕","🍿","⚽","🎮","🧾","🏋️","🎁","🐾","💼","🏥","🚌","👕","📦","💸"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0f172a" }}>Categories</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>{cats.length} categories</p>
        </div>
        <Btn onClick={() => { setEditing(null); setErrors({}); setForm({ name: "", description: "", icon: "" }); setShowModal(true); }}>
          <Icon name="plus" size={15} /> New Category
        </Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {cats.length === 0 ? (
          <div style={{ gridColumn: "1/-1", padding: 60, textAlign: "center", color: "#94a3b8", background: "#fff", borderRadius: 16 }}>
            <Icon name="category" size={40} /><p style={{ marginTop: 12 }}>No categories yet.</p>
          </div>
        ) : cats.map((c, i) => (
          <div key={c.id} style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9", position: "relative" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
              background: palette[i % palette.length] + "15", color: palette[i % palette.length], fontSize: 22, marginBottom: 14
            }}>
              {c.icon || <Icon name="category" size={22} />}
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", marginBottom: 4 }}>{c.name}</div>
            {c.description && <div style={{ color: "#94a3b8", fontSize: 13 }}>{c.description}</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
              <button onClick={() => { setEditing(c); setErrors({}); setForm({ name: c.name, description: c.description || "", icon: c.icon || "" }); setShowModal(true); }}
                style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1.5px solid #e2e8f0", cursor: "pointer", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 500 }}>
                Edit
              </button>
              <button onClick={() => del(c.id)}
                style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1.5px solid #fee2e2", cursor: "pointer", background: "#fff", color: "#f43f5e", fontSize: 13, fontWeight: 500 }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Category" : "New Category"} onClose={() => { setShowModal(false); setEditing(null); setErrors({}); }}>
          <form onSubmit={submit} noValidate>
            <Input label="Name" placeholder="Food, Travel, Bills..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} error={errors.name} required />
            <Input label="Description" placeholder="Optional description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} error={errors.description} />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "'DM Sans', sans-serif" }}>Icon</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 140, overflowY: "auto", padding: 10, border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#f8fafc" }}>
                {EMOJIS.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setForm({ ...form, icon: em })}
                    style={{
                      width: 40, height: 40, borderRadius: 8, border: form.icon === em ? "2px solid #6366f1" : "1.5px solid #e2e8f0",
                      background: form.icon === em ? "#eef2ff" : "#fff", cursor: "pointer", fontSize: 20,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >{em}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => setForm({ ...form, icon: "" })} style={{ padding: "4px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Remove Icon
                </button>
                <span style={{ fontSize: 12, color: "#94a3b8", alignSelf: "center" }}>{form.icon ? `Selected: ${form.icon}` : "No icon selected"}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn type="button" variant="secondary" onClick={() => { setShowModal(false); setEditing(null); setErrors({}); }}>Cancel</Btn>
              <Btn type="submit" loading={loading}>{editing ? "Update" : "Create"}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CategoriesPage;