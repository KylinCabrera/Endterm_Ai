import assert from 'node:assert/strict'
import test from 'node:test'
import { sodiumSummary } from '../src/lib/nutrition.js'

test('classifies exact boundaries and fractional sodium without rounding first', () => {
  for (const [value, level] of [[0, 'Low'], [140, 'Low'], [140.1, 'Moderate'], [141, 'Moderate'], [400, 'Moderate'], [400.1, 'High'], [401, 'High']]) {
    assert.equal(sodiumSummary(value).level, level)
  }
})

test('uses 2,000 mg reference and caps the bar without hiding excess', () => {
  assert.equal(sodiumSummary(400).percent, 20)
  assert.deepEqual(sodiumSummary(2500), { level: 'High', percent: 125, progress: 100 })
})

test('missing or invalid sodium is never classified as low', () => {
  for (const value of [undefined, null, '', '140', -1, NaN, Infinity]) {
    assert.equal(sodiumSummary(value), null)
  }
})
