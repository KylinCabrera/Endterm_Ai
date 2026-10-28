export const SODIUM_DAILY_LIMIT_MG = 2000

export function sodiumSummary(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null
  }
  const level = value <= 140 ? 'Low' : value <= 400 ? 'Moderate' : 'High'
  const percent = value / SODIUM_DAILY_LIMIT_MG * 100
  return { level, percent, progress: Math.min(100, percent) }
}

export function formatNutrition(value) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}
