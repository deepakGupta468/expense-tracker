import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import { Input, Select, Btn } from "../components/FormControls";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── BUDGETS PAGE ────────────────────────────────────────────────────────────
const BudgetsPage = ({ token, addToast }) => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const now = new Date();
  const blankForm = { monthlyLimit: "", month: now.getMonth() + 1, year: now.getFullYear(), categoryId: "" };
  const [form, setForm] = useState(blankForm);

  const load = useCallback(async () => {
    try {
      const [b, c] = await Promise.all([api("/budgets", {}, token), api("/categories", {}, token)]);
      setBudgets(b); setCategories(c);

      const over = b.filter(x => x.exceeded);
      if (over.length > 0) {
        addToast(`Over limit: ${over.map(x => x.categoryName).join(", ")}.`, "warning");
      }
    } catch (e) { addToast(e.message, "error"); }
  }, [token, addToast]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null); setErrors({}); setForm(blankForm); setShowModal(true);
  };

  const openEdit = (budget) => {
    setEditing(budget); setErrors({});
    setForm({
      monthlyLimit: budget.monthlyLimit,
      month: budget.month,
      year: budget.year,
      categoryId: budget.categoryId || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setEditing(null); setErrors({}); setForm(blankForm);
  };

  const validate = () => {
    const errs = {};
    const limit = parseFloat(form.monthlyLimit);
    if (!form.monthlyLimit) errs.monthlyLimit = "Monthly limit is required";
    else if (isNaN(limit) || limit <= 0) errs.monthlyLimit = "Monthly limit must be greater than 0";
    if (!form.year) errs.year = "Year is required";
    else if (isNaN(form.year) || form.year < 2000 || form.year > 2099) errs.year = "Year must be between 2000 and 2099";
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      addToast("Please fix the highlighted fields before saving.", "warning");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, monthlyLimit: parseFloat(form.monthlyLimit), month: parseInt(form.month), year: parseInt(form.year) };
      if (!payload.categoryId) delete payload.categoryId;
      else payload.categoryId = parseInt(payload.categoryId);

      const label = payload.categoryId
        ? categories.find(c => c.id === payload.categoryId)?.name || "Category"
        : "Overall";

      if (editing) {
        await api(`/budgets/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) }, token);
        addToast(`${label} budget updated to ${fmt(payload.monthlyLimit)}.`, "success");
      } else {
        await api("/budgets", { method: "POST", body: JSON.stringify(payload) }, token);
        addToast(`${label} budget set to ${fmt(payload.monthlyLimit)}.`, "success");
      }
      closeModal(); load();
    } catch (err) { addToast(err.message, "error"); } finally { setLoading(false); }
  };

  const del = async (budget) => {
    if (!window.confirm(`Delete the ${budget.categoryName} budget for ${MONTHS[budget.month - 1]} ${budget.year}?`)) {
      addToast("Delete cancelled.", "info");
      return;
    }
    try {
      await api(`/budgets/${budget.id}`, { method: "DELETE" }, token);
      addToast(`${budget.categoryName} budget deleted.`, "success");
      load();
    } catch (e) { addToast(e.message, "error"); }
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0f172a" }}>Budgets</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Monitor your spending limits</p>
        </div>
        <Btn onClick={openCreate}><Icon name="plus" size={15} /> Set Budget</Btn>
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
                    {MONTHS[b.month - 1]} {b.year}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {b.exceeded && <span style={{ fontSize: 11, fontWeight: 700, color, background: color + "15", padding: "3px 10px", borderRadius: 20 }}>EXCEEDED</span>}
                  <button onClick={() => openEdit(b)} title="Edit budget" style={{ padding: "6px", borderRadius: 8, border: "none", cursor: "pointer", background: "#f0f9ff", color: "#0ea5e9" }}>
                    <Icon name="edit" size={14} />
                  </button>
                  <button onClick={() => del(b)} title="Delete budget" style={{ padding: "6px", borderRadius: 8, border: "none", cursor: "pointer", background: "#fff1f2", color: "#f43f5e" }}>
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
        <Modal title={editing ? "Edit Budget" : "Set Budget"} onClose={closeModal}>
          <form onSubmit={submit} noValidate>
            <Input label="Monthly Limit (₹)" type="number" step="0.01" min="1" placeholder="5000.00" value={form.monthlyLimit} onChange={e => setForm({ ...form, monthlyLimit: e.target.value })} error={errors.monthlyLimit} required />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select label="Month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}>
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </Select>
              <Input label="Year" type="number" min="2000" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} error={errors.year} required />
            </div>
            <Select label="Category (optional — leave blank for overall)" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Overall Budget</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn type="button" variant="secondary" onClick={closeModal}>Cancel</Btn>
              <Btn type="submit" loading={loading}>{editing ? "Update Budget" : "Set Budget"}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BudgetsPage;