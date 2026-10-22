import { Link } from 'react-router-dom'
import { SignedIn, useClerk, useUser } from '@clerk/clerk-react'
import { Leaf, ArrowRight, UserRound } from 'lucide-react'

export default function AppHeader({ showProfile = false }) {
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
            {showProfile && (
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-xs font-semibold hover:bg-cream transition"
              >
                <UserRound className="w-3.5 h-3.5" /> Profile
              </Link>
            )}

            {name && (
              <span className="hidden sm:block text-xs uppercase tracking-wide text-muted">
                Hi, {name}
              </span>
            )}

            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-brand transition"
            >
              Sign out <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        </SignedIn>
      </div>
    </header>
  )
}