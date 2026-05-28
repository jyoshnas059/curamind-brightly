// ─────────────────────────────────────────────
//  CuraMind  ·  frontend/js/api.js
//  All API calls in one place.
//  Import this in any page: <script src="js/api.js"></script>
// ─────────────────────────────────────────────

const API_BASE = 'http://localhost:3001/api';

// ── TOKEN HELPERS ────────────────────────────
const Auth = {
  setToken(token)  { localStorage.setItem('cm_token', token); },
  getToken()       { return localStorage.getItem('cm_token'); },
  removeToken()    { localStorage.removeItem('cm_token'); localStorage.removeItem('cm_user'); },
  setUser(user)    { localStorage.setItem('cm_user', JSON.stringify(user)); },
  getUser()        {
    try { return JSON.parse(localStorage.getItem('cm_user')); } catch { return null; }
  },
  isLoggedIn()     { return !!Auth.getToken(); },
  logout() {
    Auth.removeToken();
    window.location.href = 'login.html';
  }
};

// ── FETCH WRAPPER ────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    Auth.logout();
    return;
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ── AUTH API ─────────────────────────────────
const AuthAPI = {
  async register(name, email, password) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    Auth.setToken(data.token);
    Auth.setUser(data.user);
    return data;
  },

  async login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    Auth.setToken(data.token);
    Auth.setUser(data.user);
    return data;
  },

  async me() {
    return apiFetch('/auth/me');
  }
};

// ── HEALTH API ───────────────────────────────
const HealthAPI = {
  async getLatest()   { return apiFetch('/health'); },
  async getHistory()  { return apiFetch('/health/history'); },
  async log(data)     {
    return apiFetch('/health', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

// ── MOOD API ─────────────────────────────────
const MoodAPI = {
  async getAll()         { return apiFetch('/mood'); },
  async log(mood, note)  {
    return apiFetch('/mood', {
      method: 'POST',
      body: JSON.stringify({ mood, note })
    });
  }
};

// ── SYMPTOMS API ─────────────────────────────
const SymptomsAPI = {
  async getAll()                     { return apiFetch('/symptoms'); },
  async log(symptoms, ai_response)   {
    return apiFetch('/symptoms', {
      method: 'POST',
      body: JSON.stringify({ symptoms, ai_response })
    });
  }
};

// ── SLEEP API ────────────────────────────────
const SleepAPI = {
  async getAll()              { return apiFetch('/sleep'); },
  async log(hours, quality)   {
    return apiFetch('/sleep', {
      method: 'POST',
      body: JSON.stringify({ hours, quality })
    });
  }
};

// ── MEDICATION API ───────────────────────────
const MedsAPI = {
  async getAll()           { return apiFetch('/medications'); },
  async add(data)          {
    return apiFetch('/medications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async remove(id)         {
    return apiFetch(`/medications/${id}`, { method: 'DELETE' });
  }
};

// ── DASHBOARD API ────────────────────────────
const DashboardAPI = {
  async getSummary() { return apiFetch('/dashboard'); }
};

// ── GUARD: redirect to login if not authenticated ──
function requireAuth() {
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// ── SHOW USER NAME IN NAV ────────────────────
function injectUserNav() {
  const user = Auth.getUser();
  if (!user) return;
  const nav = document.querySelector('.nav-auth');
  if (nav) {
    nav.innerHTML = `
      <span class="nav-username">👤 ${user.name}</span>
      <button class="btn-logout" onclick="Auth.logout()">Logout</button>
    `;
  }
}