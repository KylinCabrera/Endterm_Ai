import { useRef, useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import { IMAGE_ACCEPT } from '../lib/imageUpload'
import { prefersNativeCamera } from '../lib/camera'
import WebcamCapture from './WebcamCapture'

export default function ImagePicker({ onSelect, disabled = false, inputRef }) {
  const galleryRef = useRef(null)
  const nativeCameraRef = useRef(null)
  const [webcamOpen, setWebcamOpen] = useState(false)
  const uploadRef = inputRef || galleryRef

  const selectPhoto = event => {
    const file = event.target.files?.[0]
    // Allow selecting the same photo again after discarding or a failed scan.
    event.target.value = ''
    if (file && !disabled) onSelect(file)
  }

  const openCamera = () => {
    if (disabled) return
    if (prefersNativeCamera()) {
      // Keep this synchronous with the tap so mobile browsers allow the picker.
      nativeCameraRef.current?.click()
    } else {
      setWebcamOpen(true)
    }
  }

  return (
    <div className="mt-4">
      <input ref={uploadRef} type="file" accept={IMAGE_ACCEPT} disabled={disabled} hidden onChange={selectPhoto} aria-label="Upload label photo" />
      <input ref={nativeCameraRef} type="file" accept={IMAGE_ACCEPT} capture="environment" disabled={disabled} hidden onChange={selectPhoto} aria-label="Take label photo" />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={openCamera} disabled={disabled} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-dark px-3 py-2 text-xs font-semibold text-white hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50">
          <Camera className="h-4 w-4" /> Use camera
        </button>
        <button type="button" onClick={() => uploadRef.current?.click()} disabled={disabled} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50">
          <Upload className="h-4 w-4" /> Upload photo
        </button>
      </div>
      <p className="mt-3 text-center text-[10px] text-muted">JPEG, PNG, or WebP, up to 10 MB.</p>
      {webcamOpen && !disabled && (
        <WebcamCapture
          onClose={() => setWebcamOpen(false)}
          onCapture={file => { setWebcamOpen(false); onSelect(file) }}
        />
      )}
    </div>
  )
}
