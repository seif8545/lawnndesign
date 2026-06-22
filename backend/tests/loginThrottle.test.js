import { describe, it, expect } from 'vitest'
import { cooldownMs, waitMessage, LOGIN_FAIL_THRESHOLD } from '../src/lib/loginThrottle.js'

describe('cooldownMs', () => {
  it('is zero below the threshold', () => {
    for (let i = 0; i < LOGIN_FAIL_THRESHOLD; i++) expect(cooldownMs(i)).toBe(0)
  })

  it('escalates after the threshold and caps', () => {
    expect(cooldownMs(5)).toBe(30_000)
    expect(cooldownMs(6)).toBe(60_000)
    expect(cooldownMs(7)).toBe(120_000)
    expect(cooldownMs(8)).toBe(300_000)
    expect(cooldownMs(9)).toBe(900_000)
    expect(cooldownMs(50)).toBe(900_000) // capped, never permanent
  })

  it('handles bad input', () => {
    expect(cooldownMs(NaN)).toBe(0)
    expect(cooldownMs(undefined)).toBe(0)
  })
})

describe('waitMessage', () => {
  it('uses seconds under a minute', () => {
    expect(waitMessage(15_000)).toMatch(/seconds/)
  })
  it('uses minutes at or over a minute', () => {
    expect(waitMessage(120_000)).toMatch(/minute/)
  })
})
