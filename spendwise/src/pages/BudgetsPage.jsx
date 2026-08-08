import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import { Input, Select, Btn } from "../components/FormControls";

// ─── BUDGETS PAGE ────────────────────────────────────────────────────────────
const BudgetsPage = ({ token, addToast }) => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({ monthlyLimit: "", month: now.getMonth() + 1, year: now.getFullYear(), categoryId: "" });

  const load = useCallback(async () => {
    try {
      const [b, c] = await Promise.all([api("/budgets", {}, token), api("/categories", {}, token)]);
      setBudgets(b); setCategories(c);
    } catch (e) { addToast(e.message, "error"); }
  }, [token, addToast]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = { ...form, monthlyLimit: parseFloat(form.monthlyLimit), month: parseInt(form.month), year: parseInt(form.year) };
      if (!payload.categoryId) delete payload.categoryId;
      else payload.categoryId = parseInt(payload.categoryId);
      await api("/budgets", { method: "POST", body: JSON.stringify(payload) }, token);
      addToast("Budget set!", "success"); setShowModal(false); setForm({ monthlyLimit: "", month: now.getMonth() + 1, year: now.getFullYear(), categoryId: "" }); load();
    } catch (err) { addToast(err.message, "error"); } finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this budget?")) return;
    try { await api(`/budgets/${id}`, { method: "DELETE" }, token); addToast("Deleted!", "success"); load(); }
    catch (e) { addToast(e.message, "error"); }
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0f172a" }}>Budgets</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Monitor your spending limits</p>
        </div>
        <Btn onClick={() => setShowModal(true)}><Icon name="plus" size={15} /> Set Budget</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {budgets.length === 0 ? (
          <div style={{ gridColumn: "1/-1", padding: 60, textAlign: "center", color: "#94a3b8", background: "#fff", borderRadius: 16 }}>
            <Icon name="budget" size={40} /><p style={{ marginTop: 12 }}>No budgets set yet.</p>
          </div>
        ) : budgets.map(b => {
          const pct = Math.min(Math.round(((b.totalSpent || 0) / b.monthlyLimit) * 100), 100);
          const color = b.exceeded ? "#ef4444" : pct > 75 ? "#f59e0b" : "#10b981";
          return (
            <div key={b.id} style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: `1px solid ${color}30` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{b.categoryName}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][b.month - 1]} {b.year}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {b.exceeded && <span style={{ fontSize: 11, fontWeight: 700, color, background: color + "15", padding: "3px 10px", borderRadius: 20 }}>EXCEEDED</span>}
                  <button onClick={() => del(b.id)} style={{ padding: "6px", borderRadius: 8, border: "none", cursor: "pointer", background: "#fff1f2", color: "#f43f5e" }}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
              <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, marginBottom: 12 }}>
                <div style={{ height: 8, borderRadius: 4, background: color, width: `${pct}%`, transition: "width .5s" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["Spent", fmt(b.totalSpent), "#ef4444"], ["Limit", fmt(b.monthlyLimit), "#0f172a"], ["Left", fmt(b.remaining), color]].map(([l, v, c]) => (
                  <div key={l} style={{ textAlign: "center", padding: "10px 0", background: "#f8fafc", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Set Budget" onClose={() => setShowModal(false)}>
          <form onSubmit={submit}>
            <Input label="Monthly Limit (₹)" type="number" step="0.01" min="1" placeholder="5000.00" value={form.monthlyLimit} onChange={e => setForm({ ...form, monthlyLimit: e.target.value })} required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select label="Month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}>
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </Select>
              <Input label="Year" type="number" min="2000" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required />
            </div>
            <Select label="Category (optional — leave blank for overall)" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Overall Budget</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn type="submit" loading={loading}>Set Budget</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BudgetsPage;