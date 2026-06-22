import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  readCookie, csrfOk, isMutating, cookieAuthEnabled, CSRF_COOKIE,
} from '../src/lib/cookies.js'

// These back the cookie-auth transition: cookie parsing, the double-submit CSRF
// check, and the mutating-method classifier. All pure, no DB.

describe('readCookie', () => {
  it('extracts a named cookie from the Cookie header', () => {
    const req = { headers: { cookie: 'a=1; lawnn_session=xyz; b=2' } }
    expect(readCookie(req, 'lawnn_session')).toBe('xyz')
    expect(readCookie(req, 'a')).toBe('1')
  })

  it('URL-decodes values and tolerates whitespace', () => {
    const req = { headers: { cookie: ' tok=a%20b ' } }
    expect(readCookie(req, 'tok')).toBe('a b')
  })

  it('returns null when absent or no header', () => {
    expect(readCookie({ headers: { cookie: 'x=1' } }, 'y')).toBeNull()
    expect(readCookie({ headers: {} }, 'x')).toBeNull()
    expect(readCookie({}, 'x')).toBeNull()
  })
})

describe('csrfOk (double-submit)', () => {
  it('passes when header matches the CSRF cookie', () => {
    const req = {
      headers: { 'x-csrf-token': 'abc123', cookie: `${CSRF_COOKIE}=abc123` },
    }
    expect(csrfOk(req)).toBe(true)
  })

  it('fails when header and cookie differ', () => {
    const req = {
      headers: { 'x-csrf-token': 'abc123', cookie: `${CSRF_COOKIE}=nope` },
    }
    expect(csrfOk(req)).toBe(false)
  })

  it('fails when either side is missing', () => {
    expect(csrfOk({ headers: { cookie: `${CSRF_COOKIE}=abc` } })).toBe(false)
    expect(csrfOk({ headers: { 'x-csrf-token': 'abc' } })).toBe(false)
    expect(csrfOk({ headers: {} })).toBe(false)
  })
})

describe('isMutating', () => {
  it('treats GET/HEAD/OPTIONS as safe', () => {
    expect(isMutating('GET')).toBe(false)
    expect(isMutating('head')).toBe(false)
    expect(isMutating('OPTIONS')).toBe(false)
  })
  it('treats writes as mutating', () => {
    expect(isMutating('POST')).toBe(true)
    expect(isMutating('PATCH')).toBe(true)
    expect(isMutating('DELETE')).toBe(true)
  })
})

describe('cookieAuthEnabled', () => {
  const prev = process.env.COOKIE_AUTH
  beforeEach(() => { delete process.env.COOKIE_AUTH })
  afterEach(() => { if (prev === undefined) delete process.env.COOKIE_AUTH; else process.env.COOKIE_AUTH = prev })

  it('defaults to off', () => {
    expect(cookieAuthEnabled()).toBe(false)
  })
  it('is on only for the exact value "on"', () => {
    process.env.COOKIE_AUTH = 'on'
    expect(cookieAuthEnabled()).toBe(true)
    process.env.COOKIE_AUTH = 'true'
    expect(cookieAuthEnabled()).toBe(false)
  })
})
