export const API_BASE = "http://localhost:8080/api";

// ─── API HELPERS ────────────────────────────────────────────────────────────
export const api = async (path, options = {}, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Something went wrong");
  }
  if (res.status === 204) return null;
  return res.json();
};