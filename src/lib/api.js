const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function getToken() {
  return localStorage.getItem('lawnn_token')
}

export function setToken(token) {
  localStorage.setItem('lawnn_token', token)
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
    throw new Error(data.error || `Request failed (${res.status})`)
  }

  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  login:         (email, password)  => request('/auth/login',         { method: 'POST', body: { email, password } }),
  register:      (fields)           => request('/auth/register',      { method: 'POST', body: fields }),
  acceptInvite:  (token, password)  => request('/auth/accept-invite', { method: 'POST', body: { token, password } }),
  me:            ()                 => request('/auth/me'),
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export const profiles = {
  list:   (params = {}) => request('/profiles?' + new URLSearchParams(params)),
  get:    (id)          => request(`/profiles/${id}`),
  update: (id, body)    => request(`/profiles/${id}`, { method: 'PATCH', body }),
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export const jobs = {
  list:          (params = {})    => request('/jobs?' + new URLSearchParams(params)),
  get:           (id)             => request(`/jobs/${id}`),
  create:        (body)           => request('/jobs',                       { method: 'POST',   body }),
  setStatus:     (id, status)     => request(`/jobs/${id}/status`,          { method: 'PATCH',  body: { status } }),
  delete:        (id)             => request(`/jobs/${id}`,                 { method: 'DELETE' }),
  apply:         (id, body)       => request(`/jobs/${id}/applications`,    { method: 'POST',   body }),
  applications:  (id)             => request(`/jobs/${id}/applications`),
  acceptApplication: (jobId, appId) => request(`/jobs/${jobId}/applications/${appId}/accept`, { method: 'POST' }),
  rejectApplication: (jobId, appId) => request(`/jobs/${jobId}/applications/${appId}/reject`, { method: 'POST' }),
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export const admin = {
  // Returns { user, inviteUrl, expiresAt }. Admin shares inviteUrl with the student.
  createStudent:  (body) => request('/admin/students',                  { method: 'POST', body }),
  reinviteStudent:(id)   => request(`/admin/students/${id}/reinvite`,   { method: 'POST' }),
  listStudents:   ()     => request('/admin/students'),
  listUsers:      ()     => request('/admin/users'),
  deleteStudent:  (id)   => request(`/admin/students/${id}`,            { method: 'DELETE' }),
}

// ── Projects ──────────────────────────────────────────────────────────────────

export const projects = {
  list:    ()           => request('/projects'),
  get:     (id)         => request(`/projects/${id}`),
  create:  (body)       => request('/projects',              { method: 'POST', body }),
  advance: (id, body)   => request(`/projects/${id}/advance`, { method: 'POST', body }),
  review:  (id, body)   => request(`/projects/${id}/reviews`, { method: 'POST', body }),
  delete:  (id)         => request(`/projects/${id}`,         { method: 'DELETE' }),
}

// ── Feed ──────────────────────────────────────────────────────────────────────

export const feed = {
  list:       ()             => request('/feed'),
  create:     (body)         => request('/feed',                 { method: 'POST',   body }),
  like:       (id)           => request(`/feed/${id}/like`,      { method: 'POST' }),
  setStatus:  (id, status)   => request(`/feed/${id}/status`,    { method: 'PATCH',  body: { status } }),
  delete:     (id)           => request(`/feed/${id}`,           { method: 'DELETE' }),
}

// ── Marketplace ───────────────────────────────────────────────────────────────

export const marketplace = {
  list:       ()             => request('/marketplace'),
  create:     (body)         => request('/marketplace',                   { method: 'POST',   body }),
  update:     (id, body)     => request(`/marketplace/${id}`,             { method: 'PATCH',  body }),
  setStatus:  (id, status)   => request(`/marketplace/${id}/status`,      { method: 'PATCH',  body: { status } }),
  delete:     (id)           => request(`/marketplace/${id}`,             { method: 'DELETE' }),
}

// ── News ──────────────────────────────────────────────────────────────────────

export const news = {
  list:    ()         => request('/news'),
  create:  (body)     => request('/news',        { method: 'POST',   body }),
  update:  (id, body) => request(`/news/${id}`,   { method: 'PATCH',  body }),
  delete:  (id)       => request(`/news/${id}`,   { method: 'DELETE' }),
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
  messages: (id, params = {})   => request(`/conversations/${id}/messages?` + new URLSearchParams(params)),
}
