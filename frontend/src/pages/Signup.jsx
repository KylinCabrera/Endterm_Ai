import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../lib/api'

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500'

const toList = (text) =>
  text.split(',').map((s) => s.trim()).filter(Boolean)

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    height: '',
    weight: '',
    dietary_preferences: '',
    allergens: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        profile: {
          age: Number(form.age) || 0,
          height: Number(form.height) || 0,
          weight: Number(form.weight) || 0,
          dietary_preferences: toList(form.dietary_preferences),
          allergens: toList(form.allergens),
        },
      })
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>
        )}

        <input name="name" placeholder="Name" value={form.name}
          onChange={handleChange} required className={inputClass} />
        <input name="email" type="email" placeholder="Email" value={form.email}
          onChange={handleChange} required className={inputClass} />
        <input name="password" type="password" placeholder="Password" value={form.password}
          onChange={handleChange} required className={inputClass} />

        <div className="grid grid-cols-3 gap-2">
          <input name="age" type="number" placeholder="Age" value={form.age}
            onChange={handleChange} className={inputClass} />
          <input name="height" type="number" placeholder="Height (cm)" value={form.height}
            onChange={handleChange} className={inputClass} />
          <input name="weight" type="number" placeholder="Weight (kg)" value={form.weight}
            onChange={handleChange} className={inputClass} />
        </div>

        <input name="dietary_preferences" placeholder="Diet (e.g. high protein, low sodium)"
          value={form.dietary_preferences} onChange={handleChange} className={inputClass} />
        <input name="allergens" placeholder="Allergens (e.g. peanuts, shrimp)"
          value={form.allergens} onChange={handleChange} className={inputClass} />

        <button
          disabled={loading}
          className="w-full rounded-lg bg-emerald-500 py-2 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Sign up'}
        </button>

        <p className="text-sm text-slate-500 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-600 font-medium">Log in</Link>
        </p>
      </form>
    </div>
  )
}