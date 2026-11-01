import { Leaf } from 'lucide-react'

const TEAM = [
  { name: 'Kylin Eudora Z. Cabrera', role: 'Project Lead & Backend' },
  { name: 'Clent Jordan Supapo', role: 'Frontend Lead' },
]

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#e6e3d3] bg-[#f3f0e3]">
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#066b4c] flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif font-bold text-xl text-[#066b4c]">nutrigo</span>
            <span className="text-[10px] bg-[#efe3bf] text-[#6b5a1e] px-1.5 py-0.5 rounded font-semibold">
              AI
            </span>
          </div>
          <p className="mt-4 text-xs text-[#6e8275] leading-relaxed max-w-xs">
            A small tool to read nutrition labels and keep your grocery items in one place.
          </p>
        </div>

        <div>
          <p className="text-[11px] tracking-widest font-semibold text-[#4a5e52]">THE TEAM</p>
          <ul className="mt-4 space-y-3">
            {TEAM.map((member) => (
              <li key={member.name}>
                <p className="text-sm font-semibold text-[#1a3a2c]">{member.name}</p>
                <p className="text-xs text-[#6e8275]">{member.role}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] tracking-widest font-semibold text-[#4a5e52]">ABOUT THIS PROJECT</p>
          <p className="mt-4 text-sm text-[#1a3a2c]">University of St. La Salle</p>
          <p className="text-xs text-[#6e8275]">BS Computer Science (2026)</p>
          <p className="mt-1 text-xs text-[#6e8275]">CSP221A Final Project</p>
        </div>
      </div>

      <div className="border-t border-[#e6e3d3]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] text-[#6e8275]">
          <p>© 2026 NutriGo AI. All rights reserved.</p>
          <p>Nutrition ratings are informational only and are not medical advice.</p>
        </div>
      </div>
    </footer>
  )
}