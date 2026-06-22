import { hash as argonHash, verify as argonVerify, Algorithm } from '@node-rs/argon2'
import bcrypt from 'bcryptjs'

// ── Password hashing ─────────────────────────────────────────────────────────
// New and changed passwords are hashed with Argon2id (the current OWASP first
// choice — memory-hard, so it resists GPU/ASIC cracking far better than bcrypt).
// Legacy bcrypt hashes (everything created before this change) are still
// verified, and transparently re-hashed to Argon2id the next time that user
// logs in (see `verifyPassword` → `needsRehash`). No forced password resets.

// Argon2id parameters (OWASP-recommended baseline): 19 MiB memory, 2 iterations,
// 1 lane. Tunable here if you later want them stronger.
const ARGON2_OPTS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456, // KiB (= 19 MiB)
  timeCost: 2,
  parallelism: 1,
}

export async function hashPassword(plain) {
  return argonHash(String(plain), ARGON2_OPTS)
}

function isBcryptHash(stored) {
  return /^\$2[aby]\$/.test(stored)
}

// Verify a plaintext password against a stored hash of either algorithm.
// Returns { valid, needsRehash } — needsRehash is true when the stored hash is
// an old bcrypt one and the password was correct, signalling the caller to
// re-hash to Argon2id and persist it.
export async function verifyPassword(plain, stored) {
  if (!stored) return { valid: false, needsRehash: false }
  try {
    if (isBcryptHash(stored)) {
      const valid = await bcrypt.compare(String(plain), stored)
      return { valid, needsRehash: valid }
    }
    const valid = await argonVerify(stored, String(plain))
    return { valid, needsRehash: false }
  } catch {
    return { valid: false, needsRehash: false }
  }
}
