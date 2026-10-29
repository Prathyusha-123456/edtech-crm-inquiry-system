const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const TOKEN_KEY = 'crm_admin_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Please try again.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (auth && res.status === 401) {
      clearToken();
      window.dispatchEvent(new Event('auth:expired'));
    }
    const err = new Error(data.error || 'Something went wrong');
    err.details = data.details;
    throw err;
  }
  return data;
}

export const submitInquiry = (payload) => request('/api/inquiries', { method: 'POST', body: payload });
export const login = (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } });
export const fetchMe = () => request('/api/auth/me', { auth: true });
export const fetchInquiries = (params) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString();
  return request(`/api/inquiries?${qs}`, { auth: true });
};
export const updateStatus = (id, status) =>
  request(`/api/inquiries/${id}/status`, { method: 'PATCH', body: { status }, auth: true });
