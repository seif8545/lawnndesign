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
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export const admin = {
  // Returns { user, inviteUrl, expiresAt }. Admin shares inviteUrl with the student.
  createStudent:  (body) => request('/admin/students',                  { method: 'POST', body }),
  reinviteStudent:(id)   => request(`/admin/students/${id}/reinvite`,   { method: 'POST' }),
  listStudents:   ()     => request('/admin/students'),
  deleteStudent:  (id)   => request(`/admin/students/${id}`,            { method: 'DELETE' }),
}

// ── Projects ──────────────────────────────────────────────────────────────────

export const projects = {
  list:    ()           => request('/projects'),
  get:     (id)         => request(`/projects/${id}`),
  create:  (body)       => request('/projects',              { method: 'POST', body }),
  advance: (id, body)   => request(`/projects/${id}/advance`, { method: 'POST', body }),
  review:  (id, body)   => request(`/projects/${id}/reviews`, { method: 'POST', body }),
}

// ── Conversations ─────────────────────────────────────────────────────────────

export const conversations = {
  list:     ()                  => request('/conversations'),
  create:   (body)              => request('/conversations',             { method: 'POST', body }),
  messages: (id, params = {})   => request(`/conversations/${id}/messages?` + new URLSearchParams(params)),
}
