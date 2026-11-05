import assert from 'node:assert/strict'
import test from 'node:test'
import { requestJson } from '../src/lib/http.js'

test('hung response bodies time out without retrying writes', async t => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => {
    calls++
    return { status: 200, ok: true, json: () => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    }) }
  })
  await assert.rejects(requestJson('/cart', { method: 'POST', timeoutMs: 10 }), /may have been saved/)
  assert.equal(calls, 1)
})

test('requests that never receive headers also time out', async t => {
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
  }))
  await assert.rejects(requestJson('/scan', { timeoutMs: 10 }), /timed out/)
})

test('network failures and malformed successful responses give readable errors', async t => {
  const stub = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch') })
  await assert.rejects(requestJson('/scan'), /Check your connection/)
  stub.mock.mockImplementation(async () => new Response('not JSON', { status: 200 }))
  await assert.rejects(requestJson('/scan'), /unreadable response/)
})

test('quota errors include retry time and multipart keeps browser content type', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    assert.equal(options.headers['Content-Type'], undefined)
    return new Response(JSON.stringify({ detail: 'Too many scans.' }), {
      status: 429, headers: { 'Retry-After': '20' },
    })
  })
  await assert.rejects(requestJson('/scan', { body: new FormData() }, 'test-token'), /Retry in 20 seconds/)
})

test('caller cancellation is forwarded and successful responses clear timers', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => {
    if (signal.aborted) throw new DOMException('aborted', 'AbortError')
    return new Response(JSON.stringify({ ok: true }))
  })
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(requestJson('/cart', { signal: controller.signal }), { name: 'AbortError' })
  assert.deepEqual(await requestJson('/cart'), { ok: true })
})
