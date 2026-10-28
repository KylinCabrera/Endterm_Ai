import { formatNutrition, sodiumSummary } from '../lib/nutrition'

const tones = {
  Low: { badge: 'bg-emerald-50 text-emerald-800', bar: 'bg-emerald-600' },
  Moderate: { badge: 'bg-amber-50 text-amber-900', bar: 'bg-amber-500' },
  High: { badge: 'bg-rose-50 text-rose-800', bar: 'bg-rose-600' },
}

export default function SodiumIndicator({ sodium }) {
  const summary = sodiumSummary(sodium)
  if (!summary) {
    return <p className="mt-3 text-xs text-muted">Sodium not available — scan a label with a readable sodium value.</p>
  }
  const tone = tones[summary.level]
  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span><strong>{formatNutrition(sodium)} mg</strong> sodium / serving</span>
        <span className={`rounded-full px-2 py-1 font-semibold ${tone.badge}`}>
          {summary.level} sodium
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Sodium per serving against the 2,000 mg daily reference"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={summary.progress}
        aria-valuetext={`${formatNutrition(sodium)} mg, ${formatNutrition(summary.percent)}% of 2,000 mg`}
        className="h-2 overflow-hidden rounded-full bg-stone-200"
      >
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${summary.progress}%` }} />
      </div>
      <p className="text-[11px] text-muted">
        {formatNutrition(summary.percent)}% of the 2,000 mg/day reference in one serving.
      </p>
      {summary.level === 'High' && (
        <p className="text-xs font-medium text-rose-800">
          {sodium >= 2000
            ? 'One serving meets or exceeds the daily sodium reference.'
            : 'High sodium: one serving exceeds 400 mg. Consider a smaller portion or a lower-sodium option.'}
        </p>
      )}
    </div>
  )
}
