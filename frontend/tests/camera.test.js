import assert from 'node:assert/strict'
import test from 'node:test'
import { cameraErrorMessage, capturePhoto, prefersNativeCamera, stopCamera } from '../src/lib/camera.js'
import { validateImage } from '../src/lib/imageUpload.js'

test('phones and iPads use native capture; touch-enabled PCs use the webcam', () => {
  for (const userAgent of [
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
    'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15',
  ]) {
    assert.equal(prefersNativeCamera({ userAgent, maxTouchPoints: 5 }), true)
  }
  for (const [userAgent, maxTouchPoints] of [
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 10],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', 0],
    ['Mozilla/5.0 (X11; Linux x86_64)', 0],
  ]) {
    assert.equal(prefersNativeCamera({ userAgent, maxTouchPoints }), false)
  }
})

test('camera failures give recovery instructions and preserve the upload option', () => {
  for (const [name, message] of [
    ['NotAllowedError', /Allow camera access/],
    ['SecurityError', /Allow camera access/],
    ['NotFoundError', /Connect a camera/],
    ['OverconstrainedError', /Connect a camera/],
    ['NotReadableError', /Close other apps/],
    ['AbortError', /Close other apps/],
    ['UnknownError', /Try again/],
  ]) {
    assert.match(cameraErrorMessage({ name }), message)
    assert.match(cameraErrorMessage({ name }), /upload a photo/)
  }
})

test('cleanup stops every track and tolerates a pending camera request', () => {
  let stopped = 0
  stopCamera(undefined)
  stopCamera({ getTracks: () => [{ stop: () => stopped++ }, { stop: () => stopped++ }] })
  assert.equal(stopped, 2)
})

test('capture produces a bounded JPEG accepted by the existing upload validation', async () => {
  const video = { readyState: 4, videoWidth: 3840, videoHeight: 2160 }
  let drawn
  const canvas = {
    getContext: () => ({ drawImage: (...args) => { drawn = args } }),
    toBlob: (resolve, type, quality) => {
      assert.equal(type, 'image/jpeg')
      assert.equal(quality, 0.92)
      resolve(new Blob(['photo'], { type }))
    },
  }
  const photo = await capturePhoto(video, canvas)
  assert.deepEqual(drawn, [video, 0, 0, 2560, 1440])
  assert.equal(canvas.width, 2560)
  assert.equal(canvas.height, 1440)
  assert.equal(photo.type, 'image/jpeg')
  assert.match(photo.name, /^label-\d+\.jpg$/)
  assert.equal(validateImage(photo), '')
})

test('capture preserves portrait orientation without upscaling', async () => {
  const canvas = {
    getContext: () => ({ drawImage: () => {} }),
    toBlob: resolve => resolve(new Blob(['photo'], { type: 'image/jpeg' })),
  }
  await capturePhoto({ readyState: 4, videoWidth: 720, videoHeight: 1280 }, canvas)
  assert.equal(canvas.width, 720)
  assert.equal(canvas.height, 1280)
})

test('capture rejects unloaded video, unavailable canvas, and failed encoding', async () => {
  await assert.rejects(capturePhoto({ readyState: 0, videoWidth: 0, videoHeight: 0 }, {}), /still starting/)
  const video = { readyState: 4, videoWidth: 640, videoHeight: 480 }
  await assert.rejects(capturePhoto(video, { getContext: () => null }), /Could not capture/)
  await assert.rejects(capturePhoto(video, {
    getContext: () => ({ drawImage: () => {} }),
    toBlob: resolve => resolve(null),
  }), /Could not capture/)
})

test('the mobile-friendly picker does not weaken scan file validation', () => {
  for (const [name, type, size] of [
    ['photo.heic', 'image/heic', 10],
    ['photo.gif', 'image/gif', 10],
    ['empty.jpg', 'image/jpeg', 0],
    ['large.jpg', 'image/jpeg', 11 * 1024 * 1024],
  ]) {
    assert.notEqual(validateImage({ name, type, size }), '')
  }
  assert.equal(validateImage({ name: 'camera.jpg', type: '', size: 100 }), '')
})
