// Star rating (1-5) for one serving of a scanned product.
// Sodium bands match lib/nutrition.js (low <= 140 mg, high > 400 mg).
const BANDS = {
  sodium: { low: 140, high: 400 }, // mg
  fat: { low: 3, high: 15 }, // g
}
const PROTEIN = { good: 5, great: 10 } // g

const LABELS = {
  1: 'Not recommended',
  2: 'Better in moderation',
  3: 'Balanced',
  4: 'Good choice',
  5: 'Recommended',
}

const toNumber = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function scoreNutrition(item = {}) {
  const sodium = toNumber(item.sodium)
  const fat = toNumber(item.fat)
  const protein = toNumber(item.protein)

  let points = 3
  const reasons = []
  let used = 0

  if (sodium !== null) {
    used += 1
    if (sodium > BANDS.sodium.high) {
      points -= 1
      reasons.push({ type: 'bad', text: `High sodium (${sodium} mg)` })
    } else if (sodium > BANDS.sodium.low) {
      points -= 0.5
      reasons.push({ type: 'warn', text: `Moderate sodium (${sodium} mg)` })
    } else {
      points += 0.5
      reasons.push({ type: 'good', text: `Low sodium (${sodium} mg)` })
    }
  }

  if (fat !== null) {
    used += 1
    if (fat > BANDS.fat.high) {
      points -= 1
      reasons.push({ type: 'bad', text: `High fat (${fat} g)` })
    } else if (fat > BANDS.fat.low) {
      points -= 0.5
      reasons.push({ type: 'warn', text: `Moderate fat (${fat} g)` })
    } else {
      points += 0.5
      reasons.push({ type: 'good', text: `Low fat (${fat} g)` })
    }
  }

  if (protein !== null) {
    used += 1
    if (protein >= PROTEIN.great) {
      points += 1
      reasons.push({ type: 'good', text: `Great source of protein (${protein} g)` })
    } else if (protein >= PROTEIN.good) {
      points += 0.5
      reasons.push({ type: 'good', text: `Good source of protein (${protein} g)` })
    }
  }

  // Do not invent a rating when there is too little data
  if (used < 2) {
    return { stars: null, label: 'Not enough data', reasons }
  }

  const stars = Math.min(5, Math.max(1, Math.round(points)))
  return { stars, label: LABELS[stars], reasons }
}