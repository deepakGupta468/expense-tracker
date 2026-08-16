import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import StatCard from "../components/StatCard";
import Icon from "../components/Icon";
import { Btn } from "../components/FormControls";

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const Dashboard = ({ token, addToast }) => {
  const [report, setReport] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async ({ announce = false } = {}) => {
    const now = new Date();
    if (announce) setRefreshing(true);
    try {
      const [r, b, e] = await Promise.all([
        api(`/reports/monthly?month=${now.getMonth() + 1}&year=${now.getFullYear()}`, {}, token),
        api("/budgets/monthly?month=" + (now.getMonth() + 1) + "&year=" + now.getFullYear(), {}, token),
        api("/expenses?page=0&size=5", {}, token),
      ]);
      setReport(r); setBudgets(b); setExpenses(e.content || []);

      if (announce) addToast("Dashboard refreshed.", "success");

      const over = b.filter(x => x.exceeded).length;
      if (over > 0) {
        addToast(`${over} budget${over > 1 ? "s are" : " is"} over the limit this month.`, "warning");
      }
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      if (announce) setRefreshing(false);
    }
  }, [token, addToast]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0f172a" }}>Dashboard</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>{months[now.getMonth()]} {now.getFullYear()} overview</p>
        </div>
        <Btn onClick={() => load({ announce: true })} loading={refreshing}>
          <Icon name="refresh" size={15} /> Refresh
        </Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Monthly Spending" value={fmt(report?.totalAmount)} sub={`${report?.totalTransactions || 0} transactions`} color="#6366f1" icon="expense" />
        <StatCard label="Total Expenses" value={expenses.length} sub="all time" color="#0ea5e9" icon="wallet" />
        <StatCard label="Active Budgets" value={budgets.length} sub="this month" color="#10b981" icon="budget" />
        <StatCard label="Over Budget" value={budgets.filter(b => b.exceeded).length} sub="categories" color="#f59e0b" icon="alert" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Category Breakdown */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: "0 0 18px", fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Category Breakdown</h3>
          {report?.categoryBreakdown && Object.keys(report.categoryBreakdown).length > 0 ? (
            Object.entries(report.categoryBreakdown).map(([cat, amt], i) => {
              const colors = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
              const total = report.totalAmount || 1;
              const pct = Math.round((amt / total) * 100);
              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{cat}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{fmt(amt)}</span>
                  </div>
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3 }}>
                    <div style={{ height: 6, borderRadius: 3, background: colors[i % colors.length], width: `${pct}%`, transition: "width .5s ease" }} />
                  </div>
                </div>
              );
            })
          ) : <p style={{ color: "#94a3b8", fontSize: 13 }}>No data this month yet.</p>}
        </div>

        {/* Recent Expenses */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: "0 0 18px", fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Recent Expenses</h3>
          {expenses.length > 0 ? expenses.map(e => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f8fafc" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{e.title}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{e.categoryName} · {e.expenseDate}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>−{fmt(e.amount)}</div>
            </div>
          )) : <p style={{ color: "#94a3b8", fontSize: 13 }}>No expenses recorded yet.</p>}
        </div>

        {/* Budget Status */}
        {budgets.length > 0 && (
          <div style={{ gridColumn: "1 / -1", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9" }}>
            <h3 style={{ margin: "0 0 18px", fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Budget Status</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
              {budgets.map(b => {
                const pct = Math.min(Math.round((b.totalSpent / b.monthlyLimit) * 100), 100);
                const color = b.exceeded ? "#ef4444" : pct > 75 ? "#f59e0b" : "#10b981";
                return (
                  <div key={b.id} style={{ padding: "14px 16px", borderRadius: 12, background: color + "08", border: `1px solid ${color}30` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{b.categoryName}</span>
                      {b.exceeded && <span style={{ fontSize: 11, fontWeight: 600, color, background: color + "1a", padding: "2px 8px", borderRadius: 20 }}>Over!</span>}
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, marginBottom: 6 }}>
                      <div style={{ height: 6, borderRadius: 3, background: color, width: `${pct}%` }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}>
                      <span>{fmt(b.totalSpent)} spent</span>
                      <span>{fmt(b.monthlyLimit)} limit</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;