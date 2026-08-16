export const API_BASE = "http://localhost:8080/api";

// The app shell registers a handler here so an expired token can drop the user
// back to the login screen from anywhere, without every page having to know.
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (fn) => { unauthorizedHandler = fn; };

// ─── API HELPERS ────────────────────────────────────────────────────────────
export const api = async (path, options = {}, token = null) => {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    const err = new Error("Can't reach the server. Is the backend running on port 8080?");
    err.status = 0;
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const err = new Error(body?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.fieldErrors = body?.errors || null;

    // A 401 on a call that carried a token means the session itself is gone —
    // a 401 from the login form just means wrong credentials.
    if (res.status === 401 && token && unauthorizedHandler) {
      unauthorizedHandler(err.message);
    }
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
};
