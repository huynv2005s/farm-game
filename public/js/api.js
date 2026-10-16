// ==========================================================================
// FARM RPG CLIENT API CONNECTOR
// ==========================================================================

const API = {
  token: localStorage.getItem('farm_jwt_token') || null,

  setToken(t) {
    this.token = t;
    if (t) localStorage.setItem('farm_jwt_token', t);
    else localStorage.removeItem('farm_jwt_token');
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || `Lỗi yêu cầu (${response.status})`);
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  async register(username, password, gender, characterName) {
    const res = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, gender, characterName })
    });
    if (res.data && res.data.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  },

  async login(username, password) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res.data && res.data.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  },

  async getProfile() {
    const res = await this.request('/api/auth/me');
    return res.data;
  },

  async getFarmState() {
    const res = await this.request('/api/farm/state');
    return res.data;
  },

  async plant(plotIndex, seedId) {
    const res = await this.request('/api/farm/plant', {
      method: 'POST',
      body: JSON.stringify({ plotIndex, seedId })
    });
    return res.data;
  },

  async water(plotIndex) {
    const res = await this.request('/api/farm/water', {
      method: 'POST',
      body: JSON.stringify({ plotIndex })
    });
    return res.data;
  },

  async harvest(plotIndex) {
    const res = await this.request('/api/farm/harvest', {
      method: 'POST',
      body: JSON.stringify({ plotIndex })
    });
    return res.data;
  },

  async getLayout() {
    const res = await this.request('/api/farm/layout');
    return res.data;
  },

  async saveLayout(layout) {
    const res = await this.request('/api/farm/layout', {
      method: 'POST',
      body: JSON.stringify({ layout })
    });
    return res.data;
  },

  logout() {
    this.setToken(null);
    window.location.reload();
  }
};

window.API = API;
