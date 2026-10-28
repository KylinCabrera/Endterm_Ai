import { useState } from 'react'
import SodiumIndicator from './SodiumIndicator'
import { formatNutrition } from '../lib/nutrition'

export default function ScanResults({ result, onSave, onDiscard, saving, error }) {
  const [name, setName] = useState(result.item_name)
  const validName = name.trim().length > 0 && name.trim().length <= 200

  return (
    <form
      className="mt-6 rounded-2xl border border-line bg-white p-5 space-y-4"
      onSubmit={event => {
        event.preventDefault()
        if (validName && !saving) onSave({ ...result, item_name: name.trim() })
      }}
    >
      <div>
        <h3 className="font-serif text-xl font-bold">Scan results</h3>
        <p className="mt-1 text-xs text-muted">Review the label values per serving before saving.</p>
      </div>
      <label className="block text-xs font-semibold">
        Item name
        <input
          value={name}
          onChange={event => setName(event.target.value)}
          required
          maxLength={200}
          disabled={saving}
          className="mt-2 w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm focus:outline-brand"
        />
        <span className="mt-1 block font-normal text-muted">You can correct the name if the AI got it wrong.</span>
      </label>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Calories', result.calories, 'kcal'],
          ['Protein', result.protein, 'g'],
          ['Carbs', result.carbs, 'g'],
          ['Fat', result.fat, 'g'],
        ].map(([label, value, unit]) => (
          <div key={label} className="rounded-lg bg-cream p-3">
            <dt className="text-[11px] text-muted">{label}</dt>
            <dd className="mt-1 text-sm font-semibold">{formatNutrition(value)} {unit}</dd>
          </div>
        ))}
      </dl>
      <SodiumIndicator sodium={result.sodium} />
      <p className="text-[11px] text-muted">
        Per-serving guide: low ≤140 mg; moderate &gt;140–400 mg; high &gt;400 mg.
        {' '}The bar uses a daily reference, not a record of what you have eaten.
        {' '}<a className="underline" href="https://www.who.int/news-room/fact-sheets/detail/sodium-reduction" target="_blank" rel="noreferrer">WHO adult sodium guidance</a>.
      </p>
      {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving || !validName} className="rounded-xl bg-brand-dark px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Add to cart'}
        </button>
        <button type="button" disabled={saving} onClick={onDiscard} className="rounded-xl border border-line px-4 py-2 text-sm disabled:opacity-50">Discard result</button>
      </div>
    </form>
  )
}
