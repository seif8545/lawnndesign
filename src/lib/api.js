const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function getToken() {
  return localStorage.getItem('lawnn_token')
}

// Fired when an authenticated request is rejected with 401 (session expired or
// token revoked). Registered once by App; kept dependency-free like toast.js.
let unauthorizedHandler = null
// Guards against a burst of parallel 401s triggering the handler repeatedly.
// Re-armed on the next setToken (i.e. a fresh login).
let handlingUnauthorized = false

export function onUnauthorized(fn) {
  unauthorizedHandler = fn
}

export function setToken(token) {
  localStorage.setItem('lawnn_token', token)
  handlingUnauthorized = false
}

export function clearToken() {
  localStorage.removeItem('lawnn_token')
}

async function request(path, options = {}) {
  const token = getToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    // A 401 on a request that carried a token means the session is no longer
    // valid — clear it and notify the app. A 401 without a token is just a
    // failed login attempt, so leave that to the caller's error handling.
    if (res.status === 401 && token) {
      clearToken()
      if (!handlingUnauthorized && !options.skipAuthHandler) {
        handlingUnauthorized = true
        unauthorizedHandler?.()
      }
    }
    throw new Error(data.error || `Request failed (${res.status})`)
  }

  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  login:         (email, password)  => request('/auth/login',         { method: 'POST', body: { email, password } }),
  register:      (fields)           => request('/auth/register',      { method: 'POST', body: fields }),
  acceptInvite:  (token, password)  => request('/auth/accept-invite', { method: 'POST', body: { token, password } }),
  // Bootstrap hydration call. Skips the global 401 handler so a stale stored
  // token logs out silently on load rather than flashing a "session expired"
  // toast before the user has done anything.
  me:            ()                 => request('/auth/me', { skipAuthHandler: true }),
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export const profiles = {
  list:   (params = {}) => request('/profiles?' + new URLSearchParams(params)),
  get:    (id)          => request(`/profiles/${id}`),
  update: (id, body)    => request(`/profiles/${id}`, { method: 'PATCH', body }),
  // Client (not talent) profile of the current user.
  clientProfile:       () => request('/profiles/client/me'),
  updateClientProfile: (body) => request('/profiles/client/me', { method: 'PATCH', body }),
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export const admin = {
  // Returns { user, inviteUrl, expiresAt }. Admin shares inviteUrl with the student.
  createStudent:  (body) => request('/admin/students',                  { method: 'POST', body }),
  reinviteStudent:(id)   => request(`/admin/students/${id}/reinvite`,   { method: 'POST' }),
  listStudents:   ()     => request('/admin/students'),
  listUsers:      ()     => request('/admin/users'),
  createClient:   (body) => request('/admin/clients',                  { method: 'POST', body }),
  deleteStudent:  (id)   => request(`/admin/students/${id}`,            { method: 'DELETE' }),
  deleteUser:     (id)   => request(`/admin/users/${id}`,              { method: 'DELETE' }),
}

// ── Projects ──────────────────────────────────────────────────────────────────

export const projects = {
  // Public board — browse open projects (optional category/skill filters).
  board:   (params = {}) => request('/projects/board?' + new URLSearchParams(params)),
  // The current user's own projects (posted + hired).
  list:    ()           => request('/projects'),
  get:     (id)         => request(`/projects/${id}`),
  create:  (body)       => request('/projects',               { method: 'POST', body }),
  setStatus: (id, status) => request(`/projects/${id}/status`, { method: 'PATCH', body: { status } }),
  delete:  (id)         => request(`/projects/${id}`,         { method: 'DELETE' }),
  // Applications
  apply:         (id, body)         => request(`/projects/${id}/applications`, { method: 'POST', body }),
  applications:  (id)               => request(`/projects/${id}/applications`),
  acceptApplication: (projectId, appId) => request(`/projects/${projectId}/applications/${appId}/accept`, { method: 'POST' }),
  rejectApplication: (projectId, appId) => request(`/projects/${projectId}/applications/${appId}/reject`, { method: 'POST' }),
  // Payment / delivery lifecycle
  advance: (id, body)   => request(`/projects/${id}/advance`, { method: 'POST', body }),
  paymentSent: (id, body) => request(`/projects/${id}/payment-sent`, { method: 'POST', body }),
  review:  (id, body)   => request(`/projects/${id}/reviews`, { method: 'POST', body }),
}

// ── Feed ──────────────────────────────────────────────────────────────────────

export const feed = {
  list:       ()             => request('/feed'),
  get:        (id)           => request(`/feed/${id}`),
  create:     (body)         => request('/feed',                 { method: 'POST',   body }),
  like:       (id)           => request(`/feed/${id}/like`,      { method: 'POST' }),
  setStatus:  (id, status)   => request(`/feed/${id}/status`,    { method: 'PATCH',  body: { status } }),
  delete:     (id)           => request(`/feed/${id}`,           { method: 'DELETE' }),
  comments:   (id)           => request(`/feed/${id}/comments`),
  addComment: (id, content)  => request(`/feed/${id}/comments`,  { method: 'POST', body: { content } }),
}

// ── Marketplace ───────────────────────────────────────────────────────────────

export const marketplace = {
  list:       ()             => request('/marketplace'),
  create:     (body)         => request('/marketplace',                   { method: 'POST',   body }),
  update:     (id, body)     => request(`/marketplace/${id}`,             { method: 'PATCH',  body }),
  setStatus:  (id, status)   => request(`/marketplace/${id}/status`,      { method: 'PATCH',  body: { status } }),
  delete:     (id)           => request(`/marketplace/${id}`,             { method: 'DELETE' }),
  makeOffer:   (id, body)       => request(`/marketplace/${id}/offers`,           { method: 'POST', body }),
  acceptOffer: (offerId)        => request(`/marketplace/offers/${offerId}/accept`, { method: 'POST' }),
  rejectOffer: (offerId)        => request(`/marketplace/offers/${offerId}/reject`, { method: 'POST' }),
  replyOffer:  (offerId, reply) => request(`/marketplace/offers/${offerId}/reply`,  { method: 'POST', body: { reply } }),
}

// ── News ──────────────────────────────────────────────────────────────────────

export const news = {
  list:    ()         => request('/news'),
  create:  (body)     => request('/news',        { method: 'POST',   body }),
  update:  (id, body) => request(`/news/${id}`,   { method: 'PATCH',  body }),
  delete:  (id)       => request(`/news/${id}`,   { method: 'DELETE' }),
}

// ── Notifications ───────────────────────────────────────────────────────────

export const notifications = {
  list:    ()   => request('/notifications'),
  read:    (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
  readAll: ()   => request('/notifications/read-all',   { method: 'POST' }),
}

// ── Uploads ───────────────────────────────────────────────────────────────────
// Two-step upload: ask backend for a signed PUT URL, then PUT the file directly
// to Supabase Storage. Returns the URL/path to persist via the normal create/
// update endpoints (e.g. profile PATCH, jobs POST).
//
// Returns: { url, path, isPrivate, mimeType, name, size }
//   - `url`: for public files, a CDN-cached publicUrl; for private files, the
//     storage path (backend swaps for a signed read URL when serving the parent
//     resource, e.g. job applications).
//   - `path`: always the storage path. Keep around if you ever need re-signing.
export async function uploadFile(file, kind) {
  if (!file) throw new Error('No file provided')

  // 1. Ask backend for a signed upload URL.
  const sign = await request('/uploads/sign', {
    method: 'POST',
    body: { kind, contentType: file.type, size: file.size },
  })

  // 2. PUT the bytes straight to Supabase Storage.
  const put = await fetch(sign.signedUrl, {
    method:  'PUT',
    headers: { 'Content-Type': file.type, 'x-upsert': 'false' },
    body:    file,
  })
  if (!put.ok) {
    const text = await put.text().catch(() => '')
    throw new Error(`Upload failed (${put.status}): ${text || put.statusText}`)
  }

  return {
    url:       sign.isPrivate ? sign.path : sign.publicUrl,
    path:      sign.path,
    isPrivate: sign.isPrivate,
    mimeType:  file.type,
    name:      file.name,
    size:      file.size,
  }
}

// ── Conversations ─────────────────────────────────────────────────────────────

export const conversations = {
  list:     ()                  => request('/conversations'),
  create:   (body)              => request('/conversations',             { method: 'POST', body }),
  support:  ()                  => request('/conversations/support',     { method: 'POST' }),
  messages: (id, params = {})   => request(`/conversations/${id}/messages?` + new URLSearchParams(params)),
}
