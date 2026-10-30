export function prefersNativeCamera(device = navigator) {
  return /Android|iPhone|iPad|iPod/i.test(device.userAgent) ||
    (/Macintosh/i.test(device.userAgent) && device.maxTouchPoints > 1)
}

export function cameraErrorMessage(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera access was blocked. Allow camera access in your browser and system settings, then try again, or upload a photo.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No available camera was found. Connect a camera and try again, or upload a photo.'
    case 'NotReadableError':
    case 'AbortError':
      return 'The camera could not start. Close other apps using it and try again, or upload a photo.'
    default:
      return 'Could not use the camera. Try again or upload a photo.'
  }
}

export function stopCamera(stream) {
  stream?.getTracks().forEach(track => track.stop())
}

export async function capturePhoto(video, canvas = document.createElement('canvas')) {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    throw new Error('The camera is still starting. Wait for the preview and try again.')
  }
  // Bound large external-camera frames while retaining readable label details.
  const scale = Math.min(1, 2560 / Math.max(video.videoWidth, video.videoHeight))
  canvas.width = Math.round(video.videoWidth * scale)
  canvas.height = Math.round(video.videoHeight * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not capture a photo. Please upload a photo instead.')
  // Draw the original frame without horizontal flips so label text stays readable.
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92))
  if (!blob) throw new Error('Could not capture a photo. Try again or upload a photo.')
  return new File([blob], `label-${Date.now()}.jpg`, { type: 'image/jpeg' })
}
