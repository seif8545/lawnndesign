import { describe, it, expect } from 'vitest'
import { validatePassword, generatePassword } from '../src/lib/sanitize.js'

describe('validatePassword', () => {
  it('accepts a strong password', () => {
    expect(validatePassword('YAdmin26@.!')).toBeNull()
    expect(validatePassword('Str0ng!pass')).toBeNull()
  })

  it('requires a value', () => {
    expect(validatePassword('')).toBeTruthy()
    expect(validatePassword(null)).toBeTruthy()
    expect(validatePassword(undefined)).toBeTruthy()
  })

  it('enforces the length bounds (8–72)', () => {
    expect(validatePassword('Aa1!aaa')).toMatch(/at least 8/)        // 7 chars
    expect(validatePassword('A1!' + 'a'.repeat(70))).toMatch(/at most 72/) // 73 chars
  })

  it('requires all four character classes', () => {
    expect(validatePassword('alllower1!')).toMatch(/uppercase/)
    expect(validatePassword('ALLUPPER1!')).toMatch(/lowercase/)
    expect(validatePassword('NoNumber!!')).toMatch(/number/)
    expect(validatePassword('NoSpecial1')).toMatch(/special/)
  })
})

describe('generatePassword', () => {
  it('always produces a policy-compliant password', () => {
    for (let i = 0; i < 200; i++) {
      expect(validatePassword(generatePassword())).toBeNull()
    }
  })

  it('respects the requested length', () => {
    expect(generatePassword(20)).toHaveLength(20)
  })

  it('is effectively unique each call', () => {
    const set = new Set(Array.from({ length: 50 }, () => generatePassword()))
    expect(set.size).toBe(50)
  })
})
