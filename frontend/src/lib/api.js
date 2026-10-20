const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';


async function request(path, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMessage =
      typeof data.detail === 'string'
        ? data.detail
        : data.message || 'Something went wrong';
    throw new Error(errorMessage);
  }

  return data;
}

// System Health Checks
export const getStatus = () => request('/');
export const getHealth = () => request('/health');

// Auth Endpoints
export const register = (body) =>
  request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const login = (body) =>
  request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });

// Cart Operations
export const getCart = () => request('/api/cart');

export const addToCart = (item) =>
  request('/api/cart/items', {
    method: 'POST',
    body: JSON.stringify(item),
  });

export const updateCartItem = (itemId, updates) =>
  request(`/api/cart/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

export const removeFromCart = (itemId) =>
  request(`/api/cart/items/${itemId}`, {
    method: 'DELETE',
  });

// AI & OCR Services
export const scanGroceryLabel = (formData) =>
  fetch(`${API_BASE}/api/ai/scan`, {
    method: 'POST',
    headers: {
      ...(localStorage.getItem('token')
        ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
        : {}),
    },
    body: formData, // FormData handles its own Multipart boundaries
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Failed to analyze label');
    return data;
  });