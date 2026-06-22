import { describe, it, expect } from 'vitest'
import { safeUrl, clampText, nonNegativeInt, normalizeEmail } from '../src/lib/sanitize.js'

// These functions are the input-validation backbone of the API (XSS-sink
// prevention, traversal prevention, integer/wallet safety, account dedupe).
// They run with no DB, so they're the cheapest high-value regression net.

describe('safeUrl', () => {
  it('allows absolute http(s) URLs', () => {
    expect(safeUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
    expect(safeUrl('http://x.test/y')).toBe('http://x.test/y')
  })

  it('allows scheme-less storage paths', () => {
    expect(safeUrl('application/user-123/abcd.pdf')).toBe('application/user-123/abcd.pdf')
    expect(safeUrl('feed/x.png')).toBe('feed/x.png')
  })

  it('rejects javascript: and other executable schemes', () => {
    expect(safeUrl('javascript:alert(1)')).toBeNull()
    expect(safeUrl('JavaScript:alert(1)')).toBeNull()
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(safeUrl('vbscript:msgbox(1)')).toBeNull()
    expect(safeUrl('file:///etc/passwd')).toBeNull()
    expect(safeUrl('blob:https://x/abc')).toBeNull()
  })

  it('rejects protocol-relative URLs', () => {
    expect(safeUrl('//evil.com/x')).toBeNull()
  })

  it('rejects leading-slash absolute paths', () => {
    expect(safeUrl('/etc/passwd')).toBeNull()
  })

  it('rejects path-traversal segments', () => {
    expect(safeUrl('a/../../etc/passwd')).toBeNull()
    expect(safeUrl('../secret')).toBeNull()
    expect(safeUrl('foo/..%2f')).toBeNull()
  })

  it('returns null for empty / nullish input', () => {
    expect(safeUrl('')).toBeNull()
    expect(safeUrl('   ')).toBeNull()
    expect(safeUrl(null)).toBeNull()
    expect(safeUrl(undefined)).toBeNull()
  })
})

describe('clampText', () => {
  it('trims and caps to the max length', () => {
    expect(clampText('  hi  ')).toBe('hi')
    expect(clampText('x'.repeat(10), 5)).toBe('xxxxx')
  })

  it('returns empty string for nullish input (never null)', () => {
    expect(clampText(null)).toBe('')
    expect(clampText(undefined)).toBe('')
  })

  it('coerces non-strings', () => {
    expect(clampText(123)).toBe('123')
  })

  it('defaults to a 5000-char cap', () => {
    expect(clampText('a'.repeat(6000)).length).toBe(5000)
  })
})

describe('nonNegativeInt', () => {
  it('accepts non-negative numbers and numeric strings', () => {
    expect(nonNegativeInt(0)).toBe(0)
    expect(nonNegativeInt('42')).toBe(42)
    expect(nonNegativeInt(3.9)).toBe(3) // floored
  })

  it('rejects negatives, NaN, and empty', () => {
    expect(nonNegativeInt(-1)).toBeNull()
    expect(nonNegativeInt('abc')).toBeNull()
    expect(nonNegativeInt('')).toBeNull()
    expect(nonNegativeInt(null)).toBeNull()
    expect(nonNegativeInt(undefined)).toBeNull()
    expect(nonNegativeInt(Infinity)).toBeNull()
  })
})

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  A@X.COM ')).toBe('a@x.com')
  })

  it('returns empty string for nullish', () => {
    expect(normalizeEmail(null)).toBe('')
    expect(normalizeEmail(undefined)).toBe('')
  })
})
