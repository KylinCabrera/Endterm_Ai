import { requestJson } from './http.js';

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  'https://nutrigo-ai-backend.onrender.com'
).replace(/\/$/, '');

// Shared request handler
async function sendRequest(path, options = {}, token = null) {
  return requestJson(`${API_BASE}${path}`, options, token);
}

// Authenticated Clerk requests
export async function apiRequest(
  getToken,
  path,
  options = {}
) {
  const token = await getToken();

  if (!token) {
    throw new Error('Please sign in again.');
  }

  return sendRequest(path, options, token);
}

// Public service checks
export const getStatus = () => sendRequest('/');

export const getHealth = () => sendRequest('/health');

// Legacy exports retained for the old Login/Signup page imports.
// Clerk pages do not use these endpoints.
export const register = body =>
  sendRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const login = body =>
  sendRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });

// Grocery operations — pass Clerk's getToken as the first argument
export const getCart = getToken =>
  apiRequest(getToken, '/api/cart');

export const addToCart = (getToken, item) =>
  apiRequest(getToken, '/api/cart', {
    method: 'POST',
    body: JSON.stringify(item),
  });

export const updateCartItem = (getToken, itemId, updates) =>
  apiRequest(
    getToken,
    `/api/cart/${encodeURIComponent(itemId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(updates),
    }
  );

export const removeFromCart = (getToken, itemId) =>
  apiRequest(
    getToken,
    `/api/cart/${encodeURIComponent(itemId)}`,
    { method: 'DELETE' }
  );

// Label scanning
export const scanGroceryLabel = (getToken, formData) =>
  apiRequest(getToken, '/api/ai/scan-label', {
    method: 'POST',
    body: formData,
  });

// User profile
export const getProfile = getToken =>
  apiRequest(getToken, '/api/profile');

export const saveProfile = (getToken, profile) =>
  apiRequest(getToken, '/api/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
