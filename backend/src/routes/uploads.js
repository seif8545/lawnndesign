import { Router } from 'express'
import crypto from 'crypto'
import supabase, { PUBLIC_BUCKET, PRIVATE_BUCKET } from '../lib/supabase.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

// ── Upload policy ────────────────────────────────────────────────────────────
// `kind` → bucket + folder + which content-types are allowed.
// `application` files are private (only client/admin via signed-read URLs).
// Everything else is public-readable (CDN-cached, no per-request auth).
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const DOC_TYPES   = ['application/pdf']
const MAX_IMAGE   = 5  * 1024 * 1024   // 5 MB
const MAX_DOC     = 20 * 1024 * 1024   // 20 MB

const KINDS = {
  portfolio:        { bucket: PUBLIC_BUCKET,  folder: 'portfolio',      types: [...IMAGE_TYPES, ...DOC_TYPES] },
  feed:             { bucket: PUBLIC_BUCKET,  folder: 'feed',           types: IMAGE_TYPES },
  avatar:           { bucket: PUBLIC_BUCKET,  folder: 'avatar',         types: IMAGE_TYPES },
  'job-attachment': { bucket: PUBLIC_BUCKET,  folder: 'job-attachment', types: [...IMAGE_TYPES, ...DOC_TYPES] },
  application:      { bucket: PRIVATE_BUCKET, folder: 'application',    types: [...IMAGE_TYPES, ...DOC_TYPES] },
  // InstaPay transfer screenshots — private (financial), images or PDF.
  'payment-proof':  { bucket: PRIVATE_BUCKET, folder: 'payment-proof',  types: [...IMAGE_TYPES, ...DOC_TYPES] },
}

function maxSizeFor(contentType) {
  return DOC_TYPES.includes(contentType) ? MAX_DOC : MAX_IMAGE
}

function extFor(contentType) {
  return {
    'image/jpeg':      'jpg',
    'image/png':       'png',
    'image/webp':      'webp',
    'image/gif':       'gif',
    'application/pdf': 'pdf',
  }[contentType] || 'bin'
}

// ── POST /uploads/sign ───────────────────────────────────────────────────────
// Body: { kind, contentType, size }
// Returns: { signedUrl, token, path, bucket, publicUrl?, isPrivate }
//   - Client PUTs the file to `signedUrl` with header Content-Type: <contentType>.
//   - On success, client persists `publicUrl` (public bucket) or `path`
//     (private bucket) via the normal API endpoints (job-create, profile-patch, etc.).
router.post('/sign', requireAuth, async (req, res) => {
  const { kind, contentType, size } = req.body || {}

  const policy = KINDS[kind]
  if (!policy) {
    return res.status(400).json({ error: `kind must be one of: ${Object.keys(KINDS).join(', ')}` })
  }
  if (!contentType || !policy.types.includes(contentType)) {
    return res.status(400).json({ error: `contentType not allowed for kind=${kind}. Allowed: ${policy.types.join(', ')}` })
  }
  const maxBytes = maxSizeFor(contentType)
  if (typeof size === 'number' && size > maxBytes) {
    return res.status(413).json({ error: `File too large. Max ${Math.round(maxBytes / 1024 / 1024)}MB for ${contentType}` })
  }

  const ext  = extFor(contentType)
  const path = `${policy.folder}/${req.user.id}/${crypto.randomUUID()}.${ext}`

  const { data, error } = await supabase
    .storage
    .from(policy.bucket)
    .createSignedUploadUrl(path)

  if (error) {
    console.error('[uploads] createSignedUploadUrl failed:', error)
    return res.status(500).json({ error: 'Could not create signed upload URL' })
  }

  const isPrivate = policy.bucket === PRIVATE_BUCKET
  const publicUrl = isPrivate
    ? null
    : supabase.storage.from(policy.bucket).getPublicUrl(path).data.publicUrl

  return res.json({
    bucket:    policy.bucket,
    path,
    signedUrl: data.signedUrl,
    token:     data.token,
    publicUrl,
    isPrivate,
  })
})

// NOTE: A public `POST /uploads/sign-read` endpoint was removed for security.
// It would mint a signed read URL for ANY private-bucket path supplied by any
// authenticated caller, bypassing the per-resource authorisation enforced by
// the routes that actually own those files (e.g. jobs.js applications). Private
// files are now only ever signed internally via `signPrivateRead` below, called
// from a route that has already checked the caller is allowed to see the file.

// Helper used by other routes (e.g. jobs.js applications endpoint) to swap
// stored paths for short-lived signed read URLs before sending to the client.
export async function signPrivateRead(path, expiresIn = 60 * 60) {
  if (!path) return null
  const { data, error } = await supabase
    .storage
    .from(PRIVATE_BUCKET)
    .createSignedUrl(path, expiresIn)
  if (error) {
    console.warn('[uploads] signPrivateRead failed:', error.message)
    return null
  }
  return data.signedUrl
}

export default router
