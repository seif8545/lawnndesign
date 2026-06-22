import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { turnstileEnabled, verifyTurnstile, CAPTCHA_AFTER_FAILURES } from '../src/lib/turnstile.js'

describe('turnstileEnabled', () => {
  const prev = process.env.TURNSTILE_SECRET
  afterEach(() => { if (prev === undefined) delete process.env.TURNSTILE_SECRET; else process.env.TURNSTILE_SECRET = prev })

  it('is off without the secret', () => {
    delete process.env.TURNSTILE_SECRET
    expect(turnstileEnabled()).toBe(false)
  })
  it('is on with the secret', () => {
    process.env.TURNSTILE_SECRET = 'x'
    expect(turnstileEnabled()).toBe(true)
  })
})

describe('verifyTurnstile', () => {
  const prev = process.env.TURNSTILE_SECRET
  beforeEach(() => { delete process.env.TURNSTILE_SECRET })
  afterEach(() => { if (prev === undefined) delete process.env.TURNSTILE_SECRET; else process.env.TURNSTILE_SECRET = prev })

  it('passes through when Turnstile is not configured', async () => {
    expect(await verifyTurnstile(undefined)).toBe(true)
  })

  it('fails fast on a missing token when configured (no network call)', async () => {
    process.env.TURNSTILE_SECRET = 'x'
    expect(await verifyTurnstile('')).toBe(false)
    expect(await verifyTurnstile(null)).toBe(false)
  })
})

describe('CAPTCHA_AFTER_FAILURES', () => {
  it('engages before the throttle threshold (5)', () => {
    expect(CAPTCHA_AFTER_FAILURES).toBeLessThan(5)
  })
})
