import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import { Input, Select, Btn } from "../components/FormControls";

// ─── EXPENSES PAGE ───────────────────────────────────────────────────────────
const ExpensesPage = ({ token, addToast }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ title: "", description: "", amount: "", expenseDate: new Date().toISOString().split("T")[0], categoryId: "" });

  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    try {
      const [e, c] = await Promise.all([
        api(`/expenses?page=${page}&size=${PAGE_SIZE}`, {}, token),
        api("/categories", {}, token),
      ]);
      setExpenses(e.content); setCategories(c);
      setTotalPages(e.totalPages); setTotalElements(e.totalElements);
      if (page > 0 && e.totalPages > 0 && page >= e.totalPages) setPage(e.totalPages - 1);
      setForm(f => f.categoryId ? f : { ...f, categoryId: c[0]?.id || "" });
      if (c.length === 0) addToast("No categories yet — add one before recording expenses.", "info");
    } catch (e) { addToast(e.message, "error"); }
  }, [token, addToast, page]);

  useEffect(() => { load(); }, [load]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    else if (form.title.trim().length > 100) errs.title = "Title must not exceed 100 characters";
    if (form.description && form.description.length > 500) errs.description = "Description must not exceed 500 characters";
    const amount = parseFloat(form.amount);
    if (!form.amount) errs.amount = "Amount is required";
    else if (isNaN(amount) || amount <= 0) errs.amount = "Amount must be greater than 0";
    if (!form.expenseDate) errs.expenseDate = "Date is required";
    if (!form.categoryId) errs.categoryId = "Category is required";
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
    if (categories.length === 0) {
      addToast("Create a category first — every expense needs one.", "warning");
      return;
    }
    setLoading(true);
    const title = form.title.trim();
    try {
      if (editing) {
        await api(`/expenses/${editing.id}`, { method: "PUT", body: JSON.stringify({ ...form, title, amount: parseFloat(form.amount), categoryId: parseInt(form.categoryId) }) }, token);
        addToast(`"${title}" updated.`, "success");
      } else {
        await api("/expenses", { method: "POST", body: JSON.stringify({ ...form, title, amount: parseFloat(form.amount), categoryId: parseInt(form.categoryId) }) }, token);
        addToast(`"${title}" added for ₹${parseFloat(form.amount).toLocaleString("en-IN")}.`, "success");
      }
      setShowModal(false); setEditing(null); setErrors({});
      setForm({ title: "", description: "", amount: "", expenseDate: new Date().toISOString().split("T")[0], categoryId: categories[0]?.id || "" });
      if (page !== 0) setPage(0); else load();
    } catch (err) { addToast(err.message, "error"); } finally { setLoading(false); }
  };

  const del = async (expense) => {
    if (!window.confirm(`Delete "${expense.title}"? This cannot be undone.`)) {
      addToast("Delete cancelled.", "info");
      return;
    }
    try {
      await api(`/expenses/${expense.id}`, { method: "DELETE" }, token);
      addToast(`"${expense.title}" deleted.`, "success");
      load();
    } catch (e) { addToast(e.message, "error"); }
  };

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const pgBtn = (disabled) => ({
    padding: "8px 18px", borderRadius: 10, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13,
    background: disabled ? "#e2e8f0" : "#6366f1", color: disabled ? "#94a3b8" : "#fff",
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0f172a" }}>Expenses</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>{totalElements} total entries</p>
        </div>
        <Btn onClick={() => { setEditing(null); setErrors({}); setForm({ title: "", description: "", amount: "", expenseDate: new Date().toISOString().split("T")[0], categoryId: categories[0]?.id || "" }); setShowModal(true); }}>
          <Icon name="plus" size={15} /> Add Expense
        </Btn>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        {expenses.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
            <Icon name="expense" size={40} /><p style={{ marginTop: 12 }}>No expenses yet. Add your first one!</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Title", "Category", "Amount", "Date", "Actions"].map(h => (
                  <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", fontFamily: "'DM Sans', sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => (
                <tr key={e.id} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 14 }}>{e.title}</div>
                    {e.description && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{e.description}</div>}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ background: "#ede9fe", color: "#7c3aed", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{e.categoryName}</span>
                  </td>
                  <td style={{ padding: "14px 20px", fontWeight: 700, color: "#ef4444", fontSize: 14 }}>{fmt(e.amount)}</td>
                  <td style={{ padding: "14px 20px", color: "#64748b", fontSize: 13 }}>{e.expenseDate}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setEditing(e); setErrors({}); setForm({ title: e.title, description: e.description || "", amount: e.amount, expenseDate: e.expenseDate, categoryId: e.categoryId }); setShowModal(true); }}
                        style={{ padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: "#f0f9ff", color: "#0ea5e9" }}>
                        <Icon name="edit" size={14} />
                      </button>
                      <button onClick={() => del(e)}
                        style={{ padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: "#fff1f2", color: "#f43f5e" }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
          <span style={{ color: "#64748b", fontSize: 13 }}>Page {page + 1} of {totalPages}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={pgBtn(page === 0)}>Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={pgBtn(page >= totalPages - 1)}>Next</button>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? "Edit Expense" : "Add Expense"} onClose={() => { setShowModal(false); setEditing(null); setErrors({}); }}>
          <form onSubmit={submit} noValidate>
            <Input label="Title" placeholder="Lunch, Rent, etc." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} error={errors.title} required />
            <Input label="Description (optional)" placeholder="Details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} error={errors.description} />
            <Input label="Amount (₹)" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} error={errors.amount} required />
            <Input label="Date" type="date" value={form.expenseDate} onChange={e => setForm({ ...form, expenseDate: e.target.value })} error={errors.expenseDate} required />
            <Select label="Category" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} error={errors.categoryId} required>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn type="button" variant="secondary" onClick={() => { setShowModal(false); setEditing(null); setErrors({}); }}>Cancel</Btn>
              <Btn type="submit" loading={loading}>{editing ? "Update" : "Add Expense"}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ExpensesPage;