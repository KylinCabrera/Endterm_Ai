import { Link } from 'react-router-dom'
import { Leaf, ArrowRight, Sparkles, Check, ScanLine, ShieldCheck } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f8f6ee] text-[#1a3a2c]">
      {/* Header */}
      <header className="border-b border-[#e6e3d3]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#066b4c] flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif font-bold text-xl text-[#066b4c]">nutrigo</span>
            <span className="text-[10px] bg-[#efe3bf] text-[#6b5a1e] px-1.5 py-0.5 rounded font-semibold">
              AI
            </span>
          </Link>

          <nav className="flex items-center gap-5">
            <Link to="/login" className="text-sm font-semibold text-[#1a3a2c] hover:text-[#066b4c]">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#066b4c] text-white text-sm font-semibold shadow-md hover:bg-[#055a40] transition"
            >
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-14 md:py-20 grid md:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div>
          <p className="flex items-center gap-2 text-[11px] tracking-widest font-semibold text-[#4a5e52] mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f08a5d]" />
            A LITTLE MORE CLARITY IN EVERY AISLE
          </p>

          <h1
            className="font-serif font-bold text-6xl md:text-7xl leading-[0.95] text-[#1a3a2c]"
            style={{ letterSpacing: '-0.04em' }}
          >
            Know what’s
            <br />
            in your <span className="italic text-[#066b4c]">food.</span>
          </h1>

          <p className="mt-7 text-lg text-[#3f5547] leading-relaxed max-w-md">
            A quick photo turns the nutrition label into something you can actually use — and
            put straight in your grocery cart.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#066b4c] text-white font-semibold shadow-lg hover:bg-[#055a40] transition"
            >
              Start with a label <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="text-sm font-medium text-[#3f5547] hover:text-[#066b4c]">
              I already have an account
            </Link>
          </div>

          <p className="mt-7 flex items-center gap-2 text-xs text-[#6e8275]">
            <ShieldCheck className="w-4 h-4 text-[#066b4c]" />
            Your grocery list stays yours. Sign in to keep your cart.
          </p>
        </div>

        {/* Right: illustration */}
        <div className="relative mx-auto w-full max-w-md aspect-square">
          <div className="absolute inset-0 rounded-full border border-dashed border-[#d8dcc6]" />
          <div className="absolute inset-[10%] rounded-full border border-[#d8dcc6]" />
          <div className="absolute inset-[18%] rounded-full bg-[#e3ebd3]" />

          {/* Label card */}
          <div className="absolute left-[27%] top-[16%] w-[48%] rotate-[8deg] bg-[#fdfcf7] rounded-xl shadow-xl p-5">
            <p className="flex items-center gap-1.5 text-[9px] tracking-widest font-semibold text-[#1a3a2c]">
              <Leaf className="w-3 h-3 text-[#066b4c]" /> NUTRITION FACTS
            </p>
            <div className="mt-3 h-2 rounded bg-[#2a3d33]" />
            <div className="mt-2 h-1.5 w-4/5 rounded bg-[#d9dccf]" />
            <div className="mt-3 border-t border-[#2a3d33]" />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-bold">Calories</span>
              <span className="text-lg leading-none tracking-widest">•••</span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-1.5 w-full rounded bg-[#d9dccf]" />
              <div className="h-1.5 w-3/5 rounded bg-[#d9dccf]" />
              <div className="h-1.5 w-4/5 rounded bg-[#d9dccf]" />
            </div>
          </div>

          {/* Floating chips */}
          <div className="absolute top-[8%] right-0 flex items-center gap-2.5 bg-white rounded-xl shadow-lg px-3 py-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fbe3c4] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#c26d4f]" />
            </div>
            <span className="text-[11px] font-semibold">Clear, not complicated</span>
          </div>

          <div className="absolute bottom-[14%] left-0 flex items-center gap-2.5 bg-white rounded-xl shadow-lg px-3 py-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e3ebd3] flex items-center justify-center">
              <Check className="w-4 h-4 text-[#066b4c]" />
            </div>
            <span className="text-[11px] font-semibold">Scan. Understand. Add.</span>
          </div>

          <div className="absolute bottom-[8%] right-[6%] flex items-center gap-2 bg-[#066b4c] text-white rounded-lg shadow-lg px-3 py-2 rotate-[4deg]">
            <ScanLine className="w-4 h-4" />
            <span className="text-[11px] font-semibold">label in focus</span>
          </div>
        </div>
      </main>
    </div>
  )
}