import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { IMAGE_ACCEPT, validateImage } from '../lib/imageUpload'
import { apiRequest } from '../lib/api'
import ScanResults from './ScanResults'

export default function ScanLabelModal({ onCartUpdated }) {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleImageUpload = async event => {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file || loading || saving) return
    const validationError = validateImage(file)
    if (validationError) { setError(validationError); return }
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      setResult(await apiRequest(getToken, '/api/ai/scan-label', { method: 'POST', body }))
    } catch (failure) {
      setError(failure.message)
    } finally {
      setLoading(false)
    }
  }

  const saveResult = async nutrition => {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await apiRequest(getToken, '/api/cart', {
        method: 'POST',
        body: JSON.stringify({ ...nutrition, sodium: nutrition.sodium ?? null, quantity: 1 }),
      })
      setResult(null)
      onCartUpdated?.()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="my-4">
      <label className="inline-block rounded-lg bg-brand-dark px-4 py-2 text-white">
        {loading ? 'Scanning label…' : 'Scan nutrition label'}
        <input type="file" accept={IMAGE_ACCEPT} onChange={handleImageUpload} disabled={loading || saving} hidden />
      </label>
      {result ? (
        <ScanResults result={result} onSave={saveResult} onDiscard={() => { setResult(null); setError('') }} saving={saving} error={error} />
      ) : error && <p role="alert" className="mt-3 text-xs text-rose-700">{error}</p>}
    </div>
  )
}