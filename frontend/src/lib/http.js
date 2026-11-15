// Keep the deadline active while reading the response body as well as headers.
export async function requestJson(url, { timeoutMs = 65000, ...options } = {}, token = null) {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  if (options.signal?.aborted) cancel()
  options.signal?.addEventListener('abort', cancel, { once: true })
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeoutMs)
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(!(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (response.status === 204) return null
    let data
    try {
      data = await response.json()
    } catch (failure) {
      if (controller.signal.aborted) throw failure
      if (response.ok) throw new Error('The service returned an unreadable response. Please try again.', { cause: failure })
    }
    if (!response.ok) {
      let message = `Request failed (${response.status}). Please try again.`
      if (typeof data?.detail === 'string') message = data.detail
      else if (Array.isArray(data?.detail)) message = data.detail.map(error => error.msg).join('; ')
      else if (typeof data?.message === 'string') message = data.message
      const retry = response.headers.get('Retry-After')
      if (response.status === 429 && retry) message += ` Retry in ${retry} seconds.`
      throw new Error(message)
    }
    return data
  } catch (failure) {
    if (timedOut) throw new Error('The request timed out. If you were saving, refresh your cart before retrying; it may have been saved.', { cause: failure })
    if (failure instanceof TypeError) throw new Error('Cannot reach the service. Check your connection and try again.', { cause: failure })
    throw failure
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', cancel)
  }
}
