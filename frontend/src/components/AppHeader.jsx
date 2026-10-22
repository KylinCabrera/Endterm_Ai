import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SignedIn, useClerk, useUser } from '@clerk/clerk-react'
import { Leaf, ArrowRight, Scale, Wifi, WifiOff } from 'lucide-react'

const API_ROOT = import.meta.env.VITE_API_URL || 'https://nutrigo-ai-backend.onrender.com'

function ServiceStatus() {
  const [state, setState] = useState('checking') // checking | ok | down

  useEffect(() => {
    let cancelled = false
    fetch(`${API_ROOT}/`)
      .then((r) => !cancelled && setState(r.ok ? 'ok' : 'down'))
      .catch(() => !cancelled && setState('down'))
    return () => {
      cancelled = true
    }
  }, [])

  const dot =
    state === 'ok' ? 'bg-brand' : state === 'down' ? 'bg-rose-500' : 'bg-amber-400'
  const label =
    state === 'ok'
      ? 'NutriGo service connected'
      : state === 'down'
        ? 'NutriGo service unavailable'
        : 'Checking NutriGo service'

  return (
    <span className="hidden md:flex items-center gap-2 text-[10px] font-semibold text-brand-dark">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
      {state === 'down' ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
    </span>
  )
}

export default function AppHeader({ showProfile = false, showStatus = false }) {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()

  const name = isLoaded
    ? user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || ''
    : ''

  return (
    <header className="sticky top-0 z-30 bg-card/90 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif font-bold text-xl text-brand-dark">nutrigo</span>
          <span className="text-[10px] bg-[#efe3bf] text-[#6b5a1e] px-1.5 py-0.5 rounded font-semibold">
            AI
          </span>
        </Link>

        <SignedIn>
          <nav className="flex items-center gap-3 sm:gap-5">
            {showStatus && <ServiceStatus />}

            {showProfile && (
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-[11px] font-semibold hover:bg-cream transition"
              >
                <Scale className="w-3.5 h-3.5" /> Profile
              </Link>
            )}

            {name && (
              <span className="hidden sm:block text-[11px] uppercase tracking-wide text-muted border-l border-line pl-4">
                Hi, {name}
              </span>
            )}

            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink hover:text-brand transition"
            >
              Sign out <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        </SignedIn>
      </div>
    </header>
  )
}