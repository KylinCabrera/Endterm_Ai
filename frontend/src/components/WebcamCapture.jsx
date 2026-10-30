import { useEffect, useId, useRef, useState } from 'react'
import { cameraErrorMessage, capturePhoto, stopCamera } from '../lib/camera'

export default function WebcamCapture({ onCapture, onClose }) {
  const dialogRef = useRef(null)
  const videoRef = useRef(null)
  const sessionRef = useRef(0)
  const capturePending = useRef(false)
  const titleId = useId()
  const cameraId = useId()
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [ready, setReady] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  useEffect(() => {
    let cancelled = false
    let stream
    const video = videoRef.current
    const start = async () => {
      if (!window.isSecureContext) {
        setError('Camera preview requires HTTPS or localhost. Open the secure site, or upload a photo.')
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This browser does not support camera preview. Use a current browser or upload a photo.')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })
        // Permission can resolve after closing the dialog or changing cameras.
        if (cancelled) { stopCamera(stream); return }
        stream.getVideoTracks().forEach(track => {
          track.addEventListener('ended', () => {
            if (!cancelled) {
              setReady(false)
              setError('The camera disconnected. Reconnect it and try again, or upload a photo.')
            }
          })
        })
        video.srcObject = stream
        await video.play()
        if (cancelled) return
        // Labels become available after the user grants camera permission.
        const available = await navigator.mediaDevices.enumerateDevices().catch(() => [])
        if (!cancelled) setDevices(available.filter(device => device.kind === 'videoinput'))
      } catch (failure) {
        stopCamera(stream)
        if (!cancelled) {
          setReady(false)
          setError(cameraErrorMessage(failure))
        }
      }
    }
    start()
    return () => {
      cancelled = true
      sessionRef.current += 1
      stopCamera(stream)
      video.srcObject = null
    }
  }, [deviceId, attempt])

  const close = () => {
    sessionRef.current += 1
    onClose()
  }

  const takePhoto = async () => {
    if (!ready || capturePending.current) return
    const session = sessionRef.current
    capturePending.current = true
    setCapturing(true)
    setError('')
    try {
      const file = await capturePhoto(videoRef.current)
      if (session === sessionRef.current) onCapture(file)
    } catch (failure) {
      if (session === sessionRef.current) setError(failure.message)
    } finally {
      capturePending.current = false
      if (session === sessionRef.current) setCapturing(false)
    }
  }

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close() }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); close() } }} className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-xl max-h-[90dvh] overflow-y-auto rounded-2xl bg-card p-5 text-ink shadow-xl backdrop:bg-black/60">
      <div className="flex items-center justify-between gap-4">
        <h2 id={titleId} className="font-serif text-2xl font-bold">Take a label photo</h2>
        <button type="button" onClick={close} className="rounded-lg border border-line px-3 py-2 text-sm">Cancel</button>
      </div>
      <p className="mt-2 text-sm text-muted">Hold the nutrition facts panel in view, then take a photo.</p>
      {/* Keep label text readable: never mirror the live preview. */}
      <video ref={videoRef} autoPlay playsInline muted onCanPlay={() => setReady(true)} aria-label="Live camera preview" style={{ transform: 'none', scale: 'none' }} className="mt-4 aspect-video w-full rounded-xl bg-black object-contain" />
      {!ready && !error && <p role="status" className="mt-3 text-sm text-muted">Starting camera. Allow access if your browser asks.</p>}
      {devices.length > 1 && (
        <div className="mt-3">
          <label htmlFor={cameraId} className="mr-2 text-sm font-semibold">Camera</label>
          <select id={cameraId} value={deviceId} disabled={capturing} onChange={event => { setReady(false); setError(''); setDeviceId(event.target.value) }} className="max-w-full rounded-lg border border-line bg-white p-2 text-sm">
            <option value="">Default camera</option>
            {devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}
          </select>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={!ready || capturing} onClick={takePhoto} className="rounded-xl bg-brand-dark px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{capturing ? 'Taking photo...' : 'Take photo'}</button>
        {error && <button type="button" disabled={capturing} onClick={() => { setReady(false); setError(''); setAttempt(value => value + 1) }} className="rounded-xl border border-line px-4 py-3 text-sm">Try again</button>}
      </div>
    </dialog>
  )
}
