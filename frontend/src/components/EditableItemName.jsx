import { useState } from 'react'

export default function EditableItemName({ item, onSave, disabled }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.item_name)
  const [error, setError] = useState('')
  if (!editing) {
    return (
      <div className="flex items-start gap-2">
        <h4 className="min-w-0 break-words text-sm font-semibold">{item.item_name}</h4>
        <button type="button" disabled={disabled} className="shrink-0 text-xs text-brand-dark underline disabled:opacity-50" aria-label={`Edit name of ${item.item_name}`} onClick={() => {
          setName(item.item_name)
          setError('')
          setEditing(true)
        }}>Edit name</button>
      </div>
    )
  }
  return (
    <form onSubmit={async event => {
      event.preventDefault()
      if (!name.trim() || disabled) return
      setError('')
      try {
        await onSave(item, name.trim())
        setEditing(false)
      } catch (failure) {
        setError(failure.message || 'Could not save the name. Try again.')
      }
    }} className="space-y-2">
      <label className="block text-xs font-semibold">
        Item name
        <input autoFocus required maxLength={200} disabled={disabled} value={name} onChange={event => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-line px-2 py-2 text-sm" />
      </label>
      <div className="flex gap-3 text-xs">
        <button disabled={disabled || !name.trim()} type="submit" className="text-brand-dark underline disabled:opacity-50">Save name</button>
        <button disabled={disabled} type="button" onClick={() => setEditing(false)} className="text-muted underline">Cancel</button>
      </div>
      {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
    </form>
  )
}
