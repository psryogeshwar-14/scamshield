/**
 * Centralized API Client for ScamShield Frontend.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok || !json?.success) {
    const errorMsg =
      json?.error?.message ||
      (Array.isArray(json?.error?.details) ? json.error.details.map((d) => d.message).join(', ') : null) ||
      `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.code = json?.error?.code || 'API_ERROR';
    err.requestId = json?.error?.requestId || response.headers.get('X-Request-Id');
    throw err;
  }

  return json;
}

export const api = {
  analyzeUrl: (url) => request('/api/analyze/url', { method: 'POST', body: JSON.stringify({ url }) }),
  analyzeMessage: (message) => request('/api/analyze/message', { method: 'POST', body: JSON.stringify({ message }) }),
  analyzePolymorphic: (inputType, userInput) => request('/api/analyze', { method: 'POST', body: JSON.stringify({ inputType, userInput }) }),
  getHistory: (page = 1, limit = 10, type = null) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type && type !== 'all' && type !== 'high_risk') {
      params.append('type', type);
    }
    return request(`/api/history?${params.toString()}`);
  },
  getHistoryById: (id) => request(`/api/history/${encodeURIComponent(id)}`),
  deleteHistoryItem: (id) => request(`/api/history/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  updateRecommendation: (id, recId, completed = true) =>
    request(`/api/history/${encodeURIComponent(id)}/recommendations/${encodeURIComponent(recId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    }),
  getHealth: () => request('/api/health'),
};

export default api;
