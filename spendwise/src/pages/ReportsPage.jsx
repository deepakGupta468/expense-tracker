import React, { useState } from "react";
import { api } from "../api";
import StatCard from "../components/StatCard";
import { Input, Select, Btn } from "../components/FormControls";

// ─── REPORTS PAGE ────────────────────────────────────────────────────────────
const ReportsPage = ({ token, addToast }) => {
  const now = new Date();
  const [type, setType] = useState("monthly");
  const [params, setParams] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), date: now.toISOString().split("T")[0], startDate: "", endDate: "" });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // The range endpoint rejects these server-side too, but catching them here
  // saves a round trip and points at the offending field.
  const validate = () => {
    if (type === "monthly") {
      const year = parseInt(params.year, 10);
      if (!params.year || isNaN(year) || year < 2000 || year > 2099) return "Enter a year between 2000 and 2099.";
    }
    if (type === "daily" && !params.date) return "Pick a date to report on.";
    if (type === "range") {
      if (!params.startDate || !params.endDate) return "Pick both a start and an end date.";
      if (params.startDate > params.endDate) return "Start date cannot be after end date.";
    }
    return null;
  };

  const generate = async () => {
    const problem = validate();
    if (problem) { addToast(problem, "warning"); return; }

    setLoading(true);
    try {
      let r;
      if (type === "monthly") r = await api(`/reports/monthly?month=${params.month}&year=${params.year}`, {}, token);
      else if (type === "daily") r = await api(`/reports/daily?date=${params.date}`, {}, token);
      else r = await api(`/reports/range?startDate=${params.startDate}&endDate=${params.endDate}`, {}, token);
      setReport(r);

      if (r.totalTransactions === 0) {
        addToast("No expenses found for this period.", "info");
      } else {
        addToast(
          `Report ready: ${r.totalTransactions} transaction${r.totalTransactions > 1 ? "s" : ""}, ${fmt(r.totalAmount)} total.`,
          "success"
        );
      }
    } catch (e) { addToast(e.message, "error"); } finally { setLoading(false); }
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00";
  const palette = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6"];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0f172a" }}>Reports</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Analyze your spending patterns</p>
      </div>

      {/* Controls */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {[["monthly", "Monthly"], ["daily", "Daily"], ["range", "Date Range"]].map(([v, l]) => (
            <button key={v} onClick={() => setType(v)} style={{
              padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, transition: "all .15s",
              background: type === v ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#f1f5f9",
              color: type === v ? "#fff" : "#64748b"
            }}>{l}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          {type === "monthly" && <>
            <div style={{ flex: 1, minWidth: 120 }}>
              <Select label="Month" value={params.month} onChange={e => setParams({ ...params, month: e.target.value })} style={{ marginBottom: 0 }}>
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </Select>
            </div>
            <div style={{ flex: 1, minWidth: 100 }}>
              <Input label="Year" type="number" min="2000" value={params.year} onChange={e => setParams({ ...params, year: e.target.value })} style={{ marginBottom: 0 }} />
            </div>
          </>}
          {type === "daily" && (
            <div style={{ flex: 1, minWidth: 160 }}>
              <Input label="Date" type="date" value={params.date} onChange={e => setParams({ ...params, date: e.target.value })} style={{ marginBottom: 0 }} />
            </div>
          )}
          {type === "range" && <>
            <div style={{ flex: 1, minWidth: 150 }}>
              <Input label="Start Date" type="date" value={params.startDate} onChange={e => setParams({ ...params, startDate: e.target.value })} style={{ marginBottom: 0 }} />
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <Input label="End Date" type="date" value={params.endDate} onChange={e => setParams({ ...params, endDate: e.target.value })} style={{ marginBottom: 0 }} />
            </div>
          </>}
          <Btn onClick={generate} loading={loading} style={{ marginBottom: 0 }}>Generate Report</Btn>
        </div>
      </div>

      {report && (
        <div>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
            <StatCard label="Total Spent" value={fmt(report.totalAmount)} color="#6366f1" icon="expense" />
            <StatCard label="Transactions" value={report.totalTransactions} color="#0ea5e9" icon="wallet" />
            <StatCard label="Period" value={report.period?.split(": ")[1] || ""} color="#10b981" icon="report" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Category chart */}
            {report.categoryBreakdown && Object.keys(report.categoryBreakdown).length > 0 && (
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9" }}>
                <h3 style={{ margin: "0 0 20px", fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>By Category</h3>
                {Object.entries(report.categoryBreakdown).map(([cat, amt], i) => {
                  const pct = Math.round((amt / (report.totalAmount || 1)) * 100);
                  return (
                    <div key={cat} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: palette[i % palette.length] }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{cat}</span>
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
                          <span style={{ color: "#64748b" }}>{pct}%</span>
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>{fmt(amt)}</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3 }}>
                        <div style={{ height: 6, borderRadius: 3, background: palette[i % palette.length], width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Expense list */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9", maxHeight: 420, overflowY: "auto" }}>
              <h3 style={{ margin: "0 0 16px", fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Transactions</h3>
              {report.expenses?.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13 }}>No transactions in this period.</p>
              ) : report.expenses?.map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f8fafc" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{e.title}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{e.expenseDate} · {e.categoryName}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>−{fmt(e.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;