import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'
import { hashPassword, verifyPassword } from '../src/lib/password.js'

// Verifies the Argon2id migration: new hashes are Argon2id, both algorithms
// verify, and legacy bcrypt hashes are flagged for upgrade.

describe('hashPassword', () => {
  it('produces an Argon2id hash', async () => {
    const h = await hashPassword('YAdmin26@.!')
    expect(h.startsWith('$argon2id$')).toBe(true)
  })

  it('produces a different hash each time (random salt)', async () => {
    const [a, b] = await Promise.all([hashPassword('samePass1!'), hashPassword('samePass1!')])
    expect(a).not.toBe(b)
  })
})

describe('verifyPassword', () => {
  it('verifies a correct Argon2id password, no rehash needed', async () => {
    const h = await hashPassword('Correct1!')
    expect(await verifyPassword('Correct1!', h)).toEqual({ valid: true, needsRehash: false })
  })

  it('rejects a wrong password', async () => {
    const h = await hashPassword('Correct1!')
    expect(await verifyPassword('wrong', h)).toEqual({ valid: false, needsRehash: false })
  })

  it('verifies a legacy bcrypt hash AND flags it for rehash', async () => {
    const legacy = bcrypt.hashSync('Legacy1!', 12)
    expect(await verifyPassword('Legacy1!', legacy)).toEqual({ valid: true, needsRehash: true })
  })

  it('rejects a wrong password against a bcrypt hash (no rehash)', async () => {
    const legacy = bcrypt.hashSync('Legacy1!', 12)
    expect(await verifyPassword('nope', legacy)).toEqual({ valid: false, needsRehash: false })
  })

  it('handles empty/garbage stored hash safely', async () => {
    expect(await verifyPassword('x', '')).toEqual({ valid: false, needsRehash: false })
    expect(await verifyPassword('x', 'not-a-hash')).toEqual({ valid: false, needsRehash: false })
  })
})
