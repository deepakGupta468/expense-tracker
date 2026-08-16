import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import StatCard from "../components/StatCard";
import Icon from "../components/Icon";
import { Btn } from "../components/FormControls";

// ─── ADMIN PAGE ────────────────────────────────────────────────────────────
const AdminPage = ({ token, addToast }) => {
    const [users, setUsers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUsers = useCallback(async ({ announce = false } = {}) => {
        if (announce) setRefreshing(true);
        try {
            const response = await api('/admin/users', {}, token);
            setUsers(response);
            if (announce) {
                const inactive = response.filter(u => !u.isActive).length;
                addToast(
                    `${response.length} user${response.length === 1 ? "" : "s"} loaded` +
                    (inactive > 0 ? ` — ${inactive} inactive.` : "."),
                    "success"
                );
            }
        } catch (error) {
            addToast(error.message, "error");
        } finally {
            if (announce) setRefreshing(false);
        }
    }, [token, addToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDeactivate = async (user) => {
        if (!window.confirm(`Deactivate ${user.fullName}?\n\nThey will be signed out and cannot sign back in until reactivated.`)) {
            addToast("Deactivation cancelled.", "info");
            return;
        }
        try {
            await api(`/admin/users/${user.id}/deactivate`, { method: 'PUT' }, token);
            setUsers(users.map(u => u.id === user.id ? { ...u, isActive: false } : u));
            addToast(`${user.fullName} deactivated.`, "success");
        } catch (error) {
            addToast(error.message, "error");
        }
    };

    const handleActivate = async (user) => {
        try {
            await api(`/admin/users/${user.id}/activate`, { method: 'PUT' }, token);
            setUsers(users.map(u => u.id === user.id ? { ...u, isActive: true } : u));
            addToast(`${user.fullName} reactivated.`, "success");
        } catch (error) {
            addToast(error.message, "error");
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Delete ${user.fullName} (${user.email}) permanently?\n\nAll their expenses, categories and budgets go with them. This cannot be undone.`)) {
            addToast("Delete cancelled.", "info");
            return;
        }
        try {
            await api(`/admin/users/${user.id}`, { method: 'DELETE' }, token);
            setUsers(users.filter(u => u.id !== user.id));
            addToast(`${user.fullName} and all their data deleted.`, "success");
        } catch (error) {
            addToast(error.message, "error");
        }
    };

    const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0f172a" }}>Admin</h1>
                    <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>User Management</p>
                </div>
                <Btn onClick={() => fetchUsers({ announce: true })} loading={refreshing}>
                    <Icon name="refresh" size={15} /> Refresh
                </Btn>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
                <StatCard label="Total Users" value={users.length} color="#6366f1" icon="user" />
                <StatCard label="Active" value={users.filter(u => u.isActive).length} color="#10b981" icon="check" />
                <StatCard label="Inactive" value={users.filter(u => !u.isActive).length} color="#ef4444" icon="alert" />
            </div>

            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
                {users.length === 0 ? (
                    <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
                        <Icon name="user" size={40} /><p style={{ marginTop: 12 }}>No users found.</p>
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc" }}>
                                {["User", "Role", "Status", "Joined", "Actions"].map(h => (
                                    <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em", fontFamily: "'DM Sans', sans-serif" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, i) => (
                                <tr key={u.id} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                                    <td style={{ padding: "14px 20px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed", fontWeight: 700, fontSize: 14 }}>
                                                {u.fullName ? u.fullName.charAt(0).toUpperCase() : "?"}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 14 }}>{u.fullName}</div>
                                                <div style={{ color: "#94a3b8", fontSize: 12 }}>{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: "14px 20px" }}>
                                        <span style={{ background: u.role === "ADMIN" ? "#ede9fe" : "#f0f9ff", color: u.role === "ADMIN" ? "#7c3aed" : "#0ea5e9", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: "14px 20px" }}>
                                        <span style={{ background: u.isActive ? "#dcfce7" : "#fee2e2", color: u.isActive ? "#166534" : "#991b1b", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                                            {u.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "14px 20px", color: "#64748b", fontSize: 13 }}>{fmt(u.createdAt)}</td>
                                    <td style={{ padding: "14px 20px" }}>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            {u.isActive ? (
                                                <button onClick={() => handleDeactivate(u)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "#fff7ed", color: "#f59e0b", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600 }}>
                                                    Deactivate
                                                </button>
                                            ) : (
                                                <button onClick={() => handleActivate(u)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "#ecfdf5", color: "#059669", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600 }}>
                                                    Activate
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(u)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "#fff1f2", color: "#f43f5e", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600 }}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminPage;