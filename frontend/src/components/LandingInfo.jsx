import { Link } from 'react-router-dom'
import { ArrowRight, Camera, CornerLeftDown, Salad, ShoppingBasket } from 'lucide-react'

const FEATURES = [
  {
    icon: Camera,
    tint: 'bg-[#dfead6] text-[#066b4c]',
    title: 'Start with the package',
    text: 'Upload a clear photo of its nutrition label.',
  },
  {
    icon: Salad,
    tint: 'bg-[#fbe3d6] text-[#c26d4f]',
    title: 'Keep the useful bits',
    text: 'See the values returned for that label.',
  },
  {
    icon: ShoppingBasket,
    tint: 'bg-[#f0e6bf] text-[#8a6d1e]',
    title: 'Build your real cart',
    text: 'Save items as you shop, all in one place.',
  },
]

export default function LandingInfo() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <p className="text-[11px] tracking-widest font-semibold text-[#4a5e52]">
        SMALL TOOL. REAL-LIFE USEFUL.
      </p>

      <div className="mt-6 grid md:grid-cols-2 gap-10 items-start">
        <h2
          className="font-serif font-bold text-5xl md:text-6xl leading-[0.98] text-[#1a3a2c]"
          style={{ letterSpacing: '-0.04em' }}
        >
          Because grocery
          <br />
          decisions happen
          <br />
          <span className="italic text-[#066b4c]">in the moment.</span>
        </h2>

        <div className="md:pt-4 md:max-w-sm">
          <CornerLeftDown className="w-5 h-5 text-[#e07a4f] -rotate-90" />
          <p className="mt-3 text-[15px] text-[#3f5547] leading-relaxed">
            Not a diet plan. Not a lecture. Just a friendly way to read what’s already on the
            package, then keep the things you’re considering together.
          </p>
          <Link
            to="/sign-up"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#066b4c] hover:text-[#055a40]"
          >
            Try NutriGo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="mt-14 pt-8 border-t border-[#e6e3d3] grid gap-8 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, tint, title, text }) => (
          <div key={title} className="flex items-start gap-4">
            <div
              className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${tint}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1a3a2c]">{title}</h3>
              <p className="mt-1 text-xs text-[#6e8275] leading-relaxed max-w-[14rem]">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}