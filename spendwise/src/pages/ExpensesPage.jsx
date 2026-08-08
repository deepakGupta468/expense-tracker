import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import { Input, Select, Btn } from "../components/FormControls";

// ─── EXPENSES PAGE ───────────────────────────────────────────────────────────
const ExpensesPage = ({ token, addToast }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", amount: "", expenseDate: new Date().toISOString().split("T")[0], categoryId: "" });

  const load = useCallback(async () => {
    try {
      const [e, c] = await Promise.all([api("/expenses", {}, token), api("/categories", {}, token)]);
      setExpenses(e); setCategories(c);
      setForm(f => f.categoryId ? f : { ...f, categoryId: c[0]?.id || "" });
    } catch (e) { addToast(e.message, "error"); }
  }, [token, addToast]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) {
        await api(`/expenses/${editing.id}`, { method: "PUT", body: JSON.stringify({ ...form, amount: parseFloat(form.amount), categoryId: parseInt(form.categoryId) }) }, token);
        addToast("Expense updated!", "success");
      } else {
        await api("/expenses", { method: "POST", body: JSON.stringify({ ...form, amount: parseFloat(form.amount), categoryId: parseInt(form.categoryId) }) }, token);
        addToast("Expense added!", "success");
      }
      setShowModal(false); setEditing(null);
      setForm({ title: "", description: "", amount: "", expenseDate: new Date().toISOString().split("T")[0], categoryId: categories[0]?.id || "" });
      load();
    } catch (err) { addToast(err.message, "error"); } finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try { await api(`/expenses/${id}`, { method: "DELETE" }, token); addToast("Deleted!", "success"); load(); }
    catch (e) { addToast(e.message, "error"); }
  };

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0f172a" }}>Expenses</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>{expenses.length} total entries</p>
        </div>
        <Btn onClick={() => { setEditing(null); setForm({ title: "", description: "", amount: "", expenseDate: new Date().toISOString().split("T")[0], categoryId: categories[0]?.id || "" }); setShowModal(true); }}>
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
                      <button onClick={() => { setEditing(e); setForm({ title: e.title, description: e.description || "", amount: e.amount, expenseDate: e.expenseDate, categoryId: e.categoryId }); setShowModal(true); }}
                        style={{ padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: "#f0f9ff", color: "#0ea5e9" }}>
                        <Icon name="edit" size={14} />
                      </button>
                      <button onClick={() => del(e.id)}
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

      {showModal && (
        <Modal title={editing ? "Edit Expense" : "Add Expense"} onClose={() => { setShowModal(false); setEditing(null); }}>
          <form onSubmit={submit}>
            <Input label="Title" placeholder="Lunch, Rent, etc." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            <Input label="Description (optional)" placeholder="Details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Input label="Amount (₹)" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <Input label="Date" type="date" value={form.expenseDate} onChange={e => setForm({ ...form, expenseDate: e.target.value })} required />
            <Select label="Category" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn type="button" variant="secondary" onClick={() => { setShowModal(false); setEditing(null); }}>Cancel</Btn>
              <Btn type="submit" loading={loading}>{editing ? "Update" : "Add Expense"}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ExpensesPage;