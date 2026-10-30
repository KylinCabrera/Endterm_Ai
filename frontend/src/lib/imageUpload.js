// A broad image filter lets mobile browsers offer their native photo sources.
// Keep validation separate: the scan API accepts JPEG, PNG, and WebP only.
export const IMAGE_ACCEPT = 'image/*'
const IMAGE_EXTENSION = /\.(jpe?g|png|webp)$/i

export function validateImage(file) {
  if (!file.size || file.size > 10 * 1024 * 1024) {
    return 'Choose a nonempty image no larger than 10 MB.'
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) &&
      !(file.type === '' && IMAGE_EXTENSION.test(file.name))) {
    return 'Choose a JPEG, PNG, or WebP image.'
  }
  return ''
}
