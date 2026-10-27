import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser, useAuth } from '@clerk/clerk-react'
import { apiRequest } from '../lib/api'
import { IMAGE_ACCEPT, validateImage } from '../lib/imageUpload'
import {
  ArrowRight,
  Clock,
  Leaf,
  Loader2,
  Lock,
  Minus,
  Plus,
  ScanLine,
  Scale,
  ShoppingBasket,
  Trash2,
  Upload,
  FileImage,
  CornerLeftDown,
} from 'lucide-react'
import AppHeader from '../components/AppHeader'

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

export default function Dashboard() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [saving, setSaving] = useState(false)
  const [calorieLimit, setCalorieLimit] = useState(0)
  const [profileError, setProfileError] = useState('')

  const [items, setItems] = useState([])
  const [loadingCart, setLoadingCart] = useState(true)
  const [cartError, setCartError] = useState('')

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

const fetchCart = useCallback(async () => {
  if (!user?.id) return

  setLoadingCart(true)
  setCartError('')

  try {
    const data = await apiRequest(getToken, '/api/cart')
    setItems(data)
  } catch (error) {
    setCartError(error.message)
  } finally {
    setLoadingCart(false)
  }
}, [user?.id, getToken])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    apiRequest(getToken, '/api/cart').then(data => {
      if (!cancelled) { setItems(data); setCartError('') }
    }).catch(error => {
      if (!cancelled) setCartError(error.message || 'Could not load your cart.')
    }).finally(() => { if (!cancelled) setLoadingCart(false) })
    return () => { cancelled = true }
  }, [user?.id, getToken])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    apiRequest(getToken, '/api/profile').then(profile => {
      if (!cancelled) setCalorieLimit(num(profile?.calorieLimit))
    }).catch(error => {
      if (!cancelled) setProfileError('Could not load your saved calorie limit: ' + error.message)
    })
    return () => { cancelled = true }
  }, [user?.id, getToken])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const totalCalories = useMemo(
    () => items.reduce((sum, i) => sum + num(i.calories) * (num(i.quantity) || 1), 0),
    [items],
  )
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + (num(i.quantity) || 1), 0),
    [items],
  )
  const overLimit = calorieLimit > 0 && totalCalories > calorieLimit

  const pickFile = (f) => {
    if (!f) return
    const error = validateImage(f)
    if (error) {
      setScanError(error)
      return
    }
    setScanError('')
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

const handleScan = async () => {
  if (!file || !user?.id || scanning || saving) return

  setScanning(true)
  setScanError('')

  try {
    const formData = new FormData()
    formData.append('file', file)

    const scanned = await apiRequest(
      getToken,
      '/api/ai/scan-label',
      {
        method: 'POST',
        body: formData,
      }
    )

    const savedItem = await apiRequest(
      getToken,
      '/api/cart',
      {
        method: 'POST',
        body: JSON.stringify({
          item_name: scanned.item_name,
          calories: scanned.calories,
          protein: scanned.protein,
          carbs: scanned.carbs,
          fat: scanned.fat,
          quantity: 1,
        }),
      }
    )

    setItems(previous => [...previous, savedItem])

    setFile(null)
    setPreviewUrl(null)
  } catch (error) {
    setScanError(error.message)
  } finally {
    setScanning(false)
  }
}

const changeQty = async (item, delta) => {
  if (saving || scanning) return

  setSaving(true)
  setCartError('')

  try {
    const quantity = Math.max(
      1,
      (Number(item.quantity) || 1) + delta
    )

    const savedItem = await apiRequest(
      getToken,
      `/api/cart/${item.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }
    )

    setItems(previous =>
      previous.map(current =>
        current.id === item.id ? savedItem : current
      )
    )
  } catch (error) {
    setCartError(error.message)
  } finally {
    setSaving(false)
  }
}

const removeItem = async item => {
  if (saving || scanning) return

  setSaving(true)
  setCartError('')

  try {
    await apiRequest(
      getToken,
      `/api/cart/${item.id}`,
      { method: 'DELETE' }
    )

    setItems(previous =>
      previous.filter(current => current.id !== item.id)
    )
  } catch (error) {
    setCartError(error.message)
  } finally {
    setSaving(false)
  }
}

  return (
    <div className="min-h-screen bg-cream text-ink">
      <AppHeader showProfile showStatus />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {profileError && <p role="alert" className="mb-5 text-sm text-rose-700">{profileError}</p>}
        {/* Hero */}
        <p className="flex items-center gap-2 text-[10px] tracking-[0.2em] font-semibold text-muted">
          <span className="w-2 h-2 rounded-full bg-[#f08a5d]" />
          YOUR GROCERY SIDEKICK
        </p>

        <div className="mt-4 flex items-start justify-between gap-6">
          <div>
            <h1
              className="font-serif font-bold text-5xl md:text-6xl leading-[0.98]"
              style={{ letterSpacing: '-0.04em' }}
            >
              Let’s make this
              <br />
              <span className="italic text-brand">label make sense.</span>
            </h1>
            <p className="mt-4 text-xs text-muted">
              Drop in a nutrition label photo, see its details, then add it to your cart.
            </p>
          </div>

          <div className="hidden md:flex w-28 h-28 shrink-0 rounded-full border border-dashed border-[#cfd8b8] items-center justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-[#e6ecd5] flex items-center justify-center">
                <Leaf className="w-4 h-4 text-brand" />
              </div>
              <p className="text-[7px] leading-tight font-bold tracking-widest text-muted">
                SHOP
                <br />
                WITH
                <br />
                CLARITY
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-6 items-start">
          {/* Scan card */}
          <section className="bg-card rounded-3xl border border-line shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e6ecd5] flex items-center justify-center">
                  <ScanLine className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="text-[9px] tracking-widest font-semibold text-muted">
                    THE LABEL READER
                  </p>
                  <h2 className="font-serif font-bold text-2xl">Scan a product</h2>
                </div>
              </div>
              <p className="font-serif text-sm text-muted">
                <span className="font-bold text-ink">01</span> / 02
              </p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                pickFile(e.dataTransfer.files?.[0])
              }}
              onClick={() => inputRef.current?.click()}
              className={`mt-6 h-64 rounded-2xl border border-dashed cursor-pointer flex flex-col items-center justify-center text-center transition ${
                dragOver ? 'border-brand bg-[#e6ecd5]/50' : 'border-[#cfd8b8] bg-white/40'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept={IMAGE_ACCEPT}
                hidden
                onChange={(e) => pickFile(e.target.files?.[0])}
              />

              {previewUrl ? (
                <div className="space-y-2 px-4">
                  <img
                    src={previewUrl}
                    alt="Label preview"
                    className="max-h-44 mx-auto rounded-xl object-contain"
                  />
                  <p className="text-[11px] font-semibold text-brand-dark">
                    Click to choose a different photo
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-[#e6ecd5] flex items-center justify-center">
                    <Upload className="w-5 h-5 text-brand" />
                  </div>
                  <p className="mt-4 text-sm font-semibold">Choose a label photo</p>
                  <p className="mt-1 text-[10px] text-muted">
                    Use a clear image of the nutrition facts panel.
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold">
                    Browse photos <ArrowRight className="w-3 h-3" />
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[9px] text-muted">
                    <FileImage className="w-3 h-3" /> Image files
                  </p>
                </>
              )}
            </div>

            {scanError && (
              <p className="mt-4 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3">
                {scanError}
              </p>
            )}

            <button
              onClick={handleScan}
              disabled={!file || scanning || saving}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-dark py-3.5 text-sm font-semibold text-white transition hover:bg-brand disabled:bg-[#cfdccf] disabled:text-white/80 disabled:cursor-not-allowed"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Reading your label…
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4" /> Read this label <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="mt-4 flex items-center gap-2 text-[10px] text-muted">
              <Lock className="w-3.5 h-3.5" />
              NutriGo reads the label photo you choose. We don’t fill in missing values.
            </p>
          </section>

          {/* Cart card */}
          <section className="bg-card rounded-3xl border border-line shadow-sm overflow-hidden">
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#fbe3d6] flex items-center justify-center">
                    <ShoppingBasket className="w-5 h-5 text-[#c26d4f]" />
                  </div>
                  <div>
                    <p className="text-[9px] tracking-widest font-semibold text-muted">
                      YOUR SHOPPING LIST
                    </p>
                    <h2 className="font-serif font-bold text-2xl flex items-center gap-2">
                      Grocery cart
                      <span className="text-[10px] font-sans font-semibold bg-[#ecebe0] text-muted rounded-md px-1.5 py-0.5">
                        {itemCount}
                      </span>
                    </h2>
                  </div>
                </div>
                <p className="flex items-center gap-1.5 text-[9px] text-muted mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                  Saved to your account
                </p>
              </div>
            </div>

            {/* Calorie estimate */}
            <div
              className={`mx-4 rounded-2xl border p-4 ${
                overLimit ? 'bg-rose-50 border-rose-200' : 'bg-sand border-[#ecdfb8]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="flex items-center gap-2 text-[10px] tracking-widest font-semibold">
                  <Scale className="w-3.5 h-3.5" /> CART CALORIE ESTIMATE
                </p>
                <p className="text-right shrink-0">
                  <span className="font-serif font-bold text-2xl">{Math.round(totalCalories)}</span>
                  <span className="ml-1.5 text-[9px] text-muted">
                    {calorieLimit > 0 ? `/ ${calorieLimit} kcal` : 'estimated kcal'}
                  </span>
                </p>
              </div>

              {overLimit ? (
                <p className="mt-2 text-[11px] text-rose-700">
                  Heads up: your cart is over your {calorieLimit} kcal trip limit.
                </p>
              ) : (
                <p className="mt-2 text-[10px] text-[#6b5a1e] leading-relaxed">
                  We estimate from each item’s calories × quantity.{' '}
                  {calorieLimit > 0
                    ? 'You’ll see a heads-up if you go over your limit.'
                    : 'Set your own trip alert to get a heads-up as you shop.'}
                </p>
              )}

              {calorieLimit === 0 && (
                <Link
                  to="/profile"
                  className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold hover:text-brand"
                >
                  Set a shopping limit <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {/* List */}
            <div className="p-4 min-h-[16rem]">
              {loadingCart ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-16 rounded-2xl bg-[#f1efe4] animate-pulse" />
                  ))}
                </div>
              ) : cartError ? (
                <div className="text-center py-10">
                  <p className="text-xs text-rose-700">{cartError}</p>
                  <button
                    onClick={fetchCart}
                    className="mt-3 text-[11px] font-semibold text-brand-dark underline"
                  >
                    Try again
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-[#e6ecd5] flex items-center justify-center">
                    <ShoppingBasket className="w-5 h-5 text-brand" />
                  </div>
                  <h3 className="mt-4 font-serif font-bold text-lg">Your cart is ready</h3>
                  <p className="mt-1 text-[10px] text-muted max-w-[16rem] mx-auto leading-relaxed">
                    Scan a product label and add the item here. Your list will build as you shop.
                  </p>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#f1efe4] px-3 py-1.5 text-[10px] font-semibold hover:bg-[#e9e6d6]"
                  >
                    Start with a photo <CornerLeftDown className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => {
                    const qty = num(item.quantity) || 1
                    return (
                      <li
                        key={item.id}
                        className="rounded-2xl border border-line bg-white/60 p-4 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold truncate">{item.item_name}</h4>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {num(item.calories)} kcal · P {num(item.protein)}g · C {num(item.carbs)}g · F{' '}
                            {num(item.fat)}g
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center rounded-lg border border-line bg-white">
                            <button
                              onClick={() => changeQty(item, -1)}
                              disabled={qty <= 1 || saving || scanning}
                              className="p-1.5 hover:bg-cream disabled:opacity-40"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-semibold">{qty}</span>
                            <button
                              disabled={saving || scanning}
                              onClick={() => changeQty(item, 1)}
                              className="p-1.5 hover:bg-cream"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            disabled={saving || scanning}
                            onClick={() => removeItem(item)}
                            className="p-1.5 text-rose-600 hover:text-rose-800"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-line px-6 py-3 flex items-center gap-2 text-[10px] text-muted">
              <Clock className="w-3.5 h-3.5" />
              Items stay in your cart until you remove them.
            </div>
          </section>
        </div>

        <footer className="mt-12 flex items-center justify-between text-[10px] text-muted">
          <p>
            <span className="font-semibold text-ink">NutriGo AI</span>
            <span className="ml-3">Clarity for the everyday shop.</span>
          </p>
          <Link to="/" className="font-semibold text-ink inline-flex items-center gap-1">
            About NutriGo <ArrowRight className="w-3 h-3" />
          </Link>
        </footer>
      </main>
    </div>
  )
}
