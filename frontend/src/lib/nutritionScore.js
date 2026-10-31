// Star rating (1-5) for one serving of a scanned product.
// Sodium bands match lib/nutrition.js (low <= 140 mg, high > 400 mg).
// The other bands are rough per-serving values (about 5% and 20% of US FDA
// Daily Values). Tune them with the team.
const BANDS = {
  sodium: { low: 140, high: 400 }, // mg
  fat: { low: 3, high: 15 }, // g
  satFat: { low: 1, high: 4 }, // g
  sugar: { low: 2.5, high: 10 }, // g
}
const PROTEIN = { good: 5, great: 10 } // g
const FIBER = { good: 3, great: 6 } // g

const LABELS = {
  1: 'Not recommended',
  2: 'Better in moderation',
  3: 'Balanced',
  4: 'Good choice',
  5: 'Recommended',
}

// null / undefined / '' means "the label did not say", which is not the same as 0
const toNumber = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function scoreNutrition(item = {}) {
  const sodium = toNumber(item.sodium)
  const fat = toNumber(item.fat)
  const satFat = toNumber(item.saturated_fat ?? item.sat_fat)
  const sugar = toNumber(item.sugar ?? item.sugars)
  const protein = toNumber(item.protein)
  const fiber = toNumber(item.fiber ?? item.fibre)

  let points = 3
  const reasons = []
  const basedOn = []

  // Nutrients where less is better
  const lessIsBetter = (value, band, name, unit) => {
    if (value === null) return
    basedOn.push(name)
    if (value > band.high) {
      points -= 1
      reasons.push({ type: 'bad', text: `High ${name} (${value}${unit})` })
    } else if (value > band.low) {
      points -= 0.5
      reasons.push({ type: 'warn', text: `Moderate ${name} (${value}${unit})` })
    } else {
      points += 0.5
      reasons.push({ type: 'good', text: `Low ${name} (${value}${unit})` })
    }
  }

  // Nutrients where more is better
  const moreIsBetter = (value, band, name) => {
    if (value === null) return
    basedOn.push(name)
    if (value >= band.great) {
      points += 1
      reasons.push({ type: 'good', text: `Great source of ${name} (${value} g)` })
    } else if (value >= band.good) {
      points += 0.5
      reasons.push({ type: 'good', text: `Good source of ${name} (${value} g)` })
    }
  }

  lessIsBetter(sodium, BANDS.sodium, 'sodium', ' mg')
  // Use saturated fat when the label has it, otherwise fall back to total fat
  if (satFat !== null) lessIsBetter(satFat, BANDS.satFat, 'saturated fat', ' g')
  else lessIsBetter(fat, BANDS.fat, 'fat', ' g')
  lessIsBetter(sugar, BANDS.sugar, 'sugar', ' g')
  moreIsBetter(protein, PROTEIN, 'protein')
  moreIsBetter(fiber, FIBER, 'fiber')

  // Do not invent a rating when there is too little data
  if (basedOn.length < 2) {
    return { stars: null, label: 'Not enough data', reasons, basedOn }
  }

  const stars = Math.min(5, Math.max(1, Math.round(points)))
  return { stars, label: LABELS[stars], reasons, basedOn }
}