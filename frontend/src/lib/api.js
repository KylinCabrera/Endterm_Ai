const API = import.meta.env.VITE_API_URL

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Something went wrong')
  }
  return data
}

export const getStatus = () => request('/')

export const register = (body) =>
  request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) })

export const login = (body) =>
  request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) })