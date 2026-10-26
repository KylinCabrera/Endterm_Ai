import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { ArrowLeft, ArrowRight, HeartPulse, Scale, ShieldCheck, Check } from 'lucide-react'
import AppHeader from '../components/AppHeader'

const inputWrap =
  'flex items-center rounded-xl border border-line bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-brand/30 focus-within:border-brand'
const inputClass =
  'w-full bg-transparent text-sm text-ink placeholder:text-muted/60 focus:outline-none'

function bmiInfo(heightCm, weightKg) {
  const h = Number(heightCm)
  const w = Number(weightKg)
  if (!h || !w) return null
  const value = w / Math.pow(h / 100, 2)
  let label = 'Healthy range'
  if (value < 18.5) label = 'Below healthy range'
  else if (value >= 25 && value < 30) label = 'Above healthy range'
  else if (value >= 30) label = 'Well above healthy range'
  return { value: value.toFixed(1), label }
}

export default function Profile() {
  const { user, isLoaded } = useUser()
  const storageKey = user ? `nutrigo_profile_${user.id}` : null

  const [form, setForm] = useState({ height: '', weight: '', calorieLimit: '' })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!storageKey) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setForm(JSON.parse(raw))
    } catch {
      /* ignore bad data */
    }
  }, [storageKey])

  const bmi = useMemo(() => bmiInfo(form.height, form.weight), [form.height, form.weight])
  const hasProfile = Boolean(form.height && form.weight && form.calorieLimit)

  const handleChange = (e) => {
    setSaved(false)
    setError('')
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const h = Number(form.height)
    const w = Number(form.weight)
    const c = Number(form.calorieLimit)

    if (!(h >= 50 && h <= 250)) return setError('Height should be between 50 and 250 cm.')
    if (!(w >= 10 && w <= 400)) return setError('Weight should be between 10 and 400 kg.')
    if (!(c >= 200 && c <= 10000)) return setError('Calorie limit should be between 200 and 10,000 kcal.')

    try {
      localStorage.setItem(storageKey, JSON.stringify(form))
      setSaved(true)
    } catch {
      setError('Could not save your profile on this device.')
    }
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-[11px] tracking-widest font-semibold text-muted hover:text-brand"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> YOUR GROCERY SPACE
        </Link>

        <p className="mt-8 flex items-center gap-2 text-[11px] tracking-widest font-semibold text-muted">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f08a5d]" />
          A SETTING THAT’S YOURS
        </p>

        <div className="mt-4 flex items-start justify-between gap-6">
          <div>
            <h1
              className="font-serif font-bold text-5xl md:text-6xl leading-[0.98]"
              style={{ letterSpacing: '-0.04em' }}
            >
              Your profile,
              <br />
              <span className="italic">your pace.</span>
            </h1>
            <p className="mt-5 text-sm text-muted max-w-md leading-relaxed">
              Add a few measurements and choose a calorie alert for a shopping trip. NutriGo uses
              it as a practical cart guide—not a daily nutrition prescription.
            </p>
          </div>

          <div className="hidden md:flex w-24 h-24 shrink-0 rounded-full bg-[#e6ecd5] border border-[#cfd8b8] items-center justify-center">
            <HeartPulse className="w-9 h-9 text-brand" strokeWidth={1.5} />
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-5 gap-6">
          {/* Form card */}
          <form
            onSubmit={handleSubmit}
            className="md:col-span-3 bg-card rounded-3xl border border-line shadow-sm p-7"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e6ecd5] flex items-center justify-center">
                <Scale className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-[9px] tracking-widest font-semibold text-muted">
                  YOUR NUTRITION PROFILE
                </p>
                <h2 className="font-serif font-bold text-2xl">Make it personal</h2>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Height</label>
                <div className={inputWrap}>
                  <input
                    name="height"
                    type="number"
                    inputMode="decimal"
                    placeholder="e.g. 168"
                    value={form.height}
                    onChange={handleChange}
                    className={inputClass}
                  />
                  <span className="text-[10px] text-muted">cm</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Weight</label>
                <div className={inputWrap}>
                  <input
                    name="weight"
                    type="number"
                    inputMode="decimal"
                    placeholder="e.g. 67"
                    value={form.weight}
                    onChange={handleChange}
                    className={inputClass}
                  />
                  <span className="text-[10px] text-muted">kg</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold mb-1.5">
                Calorie limit for one shopping trip
              </label>
              <div className={inputWrap}>
                <input
                  name="calorieLimit"
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 2,000"
                  value={form.calorieLimit}
                  onChange={handleChange}
                  className={inputClass}
                />
                <span className="text-[10px] text-muted whitespace-nowrap">kcal / trip</span>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                A personal alert for the items in your cart. This is not a daily target.
              </p>
            </div>

            {error && (
              <p className="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3">
                {error}
              </p>
            )}

            <div className="mt-6 pt-5 border-t border-line flex items-center justify-between gap-4">
              <p className="flex items-center gap-2 text-[11px] text-muted">
                <ShieldCheck className="w-4 h-4 text-brand" />
                Your measurements are private to your account.
              </p>
              <button
                type="submit"
                disabled={!isLoaded}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-dark text-white text-sm font-semibold hover:bg-brand transition disabled:opacity-60"
              >
                {saved ? (
                  <>
                    Saved <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Save profile <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Context card */}
          <aside className="md:col-span-2 rounded-3xl bg-[#e9eedc] border border-[#d8e0c4] p-6">
            <p className="text-[9px] tracking-widest font-semibold text-muted">JUST FOR CONTEXT</p>

            <div className="mt-8">
              <p className="font-serif font-bold text-4xl">{bmi ? bmi.value : '—'}</p>
              <p className="mt-1 text-xs text-muted">
                BMI{bmi ? ` · ${bmi.label}` : ''}
              </p>
            </div>

            <p className="mt-5 text-xs text-muted leading-relaxed">
              Your BMI is shown as an informational calculation from your saved height and weight.
              It does not determine your shopping limit.
            </p>

            <div className="mt-5 pt-4 border-t border-[#d8e0c4] flex items-center gap-2 text-[11px] text-muted">
              <HeartPulse className="w-4 h-4" />
              BMI is informational only and is not medical advice.
            </div>

            <div className="mt-5 rounded-xl bg-sand p-4 text-xs text-[#6b5a1e] leading-relaxed">
              {hasProfile
                ? 'Your profile is set. Your cart calorie alert is ready.'
                : 'Your profile is not set up yet. Add your details to see BMI and activate a cart calorie alert.'}
            </div>
          </aside>
        </div>

        <footer className="mt-12 pt-5 border-t border-line flex items-center justify-between text-[11px] text-muted">
          <span>NutriGo AI · thoughtful grocery choices, on your terms.</span>
          <Link to="/dashboard" className="font-semibold text-brand-dark inline-flex items-center gap-1">
            Return to your cart <ArrowRight className="w-3 h-3" />
          </Link>
        </footer>
      </main>
    </div>
  )
}