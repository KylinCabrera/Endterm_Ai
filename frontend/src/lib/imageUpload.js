export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
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
