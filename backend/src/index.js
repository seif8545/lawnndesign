import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import authRoutes          from './routes/auth.js'
import profileRoutes       from './routes/profiles.js'
import projectRoutes       from './routes/projects.js'
import adminRoutes         from './routes/admin.js'
import conversationRoutes  from './routes/conversations.js'
import feedRoutes          from './routes/feed.js'
import marketplaceRoutes   from './routes/marketplace.js'
import newsRoutes          from './routes/news.js'
import notificationRoutes  from './routes/notifications.js'
import uploadRoutes        from './routes/uploads.js'
import settingsRoutes      from './routes/settings.js'
import { initSocket }      from './socket.js'

// Fail fast on misconfiguration: a missing/weak JWT secret silently breaks auth
// or, worse, makes tokens forgeable. Refuse to boot without a strong one.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET is missing or too short (need at least 32 characters).')
  process.exit(1)
}

const app    = express()
const server = http.createServer(app)
const PORT   = process.env.PORT || 3001

// Behind a reverse proxy (Render, Fly, Cloudflare, etc.) — required for
// correct client IPs in rate-limit and accurate `req.secure`.
app.set('trust proxy', 1)

// ── Middleware ─────────────────────────────────────────────────────────────────
// Multiple frontend origins supported via comma-separated FRONTEND_URL.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

app.use(helmet())
app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin / curl / server-to-server (no Origin header).
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))

// Baseline limiter on every request — blunts scraping, brute-forcing of
// object IDs, and notification/offer/upload-sign spam. Generous enough not to
// bother normal use.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
})
app.use(globalLimiter)

// Rate limit auth endpoints to slow credential stuffing and abuse.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
})
app.use('/auth/login', authLimiter)
app.use('/auth/register', authLimiter)
app.use('/auth/accept-invite', authLimiter)
app.use('/auth/change-password', authLimiter)

// Stricter cap on content-creating writes (posts, comments, applications,
// offers, listings, signed-upload requests). Reads (GET/HEAD) are exempt and
// stay under the global limiter, so browsing is unaffected while automated
// spam/flooding of these endpoints is throttled.
const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' || req.method === 'HEAD',
  message: { error: 'You are doing that too often. Please slow down.' },
})
for (const path of ['/feed', '/marketplace', '/projects', '/conversations', '/uploads']) {
  app.use(path, writeLimiter)
}

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/auth',          authRoutes)
app.use('/profiles',      profileRoutes)
app.use('/projects',      projectRoutes)
app.use('/admin',         adminRoutes)
app.use('/conversations', conversationRoutes)
app.use('/feed',          feedRoutes)
app.use('/marketplace',   marketplaceRoutes)
app.use('/news',          newsRoutes)
app.use('/notifications', notificationRoutes)
app.use('/uploads',       uploadRoutes)
app.use('/settings',      settingsRoutes)

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// ── 404 catch-all ──────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// ── Socket.io ─────────────────────────────────────────────────────────────────
initSocket(server)

// ── Last-resort safety nets ──────────────────────────────────────────────────
// Express 4 does not catch a rejected promise inside an async route handler; on
// Node ≥15 such a rejection would otherwise kill the whole process. Log loudly
// and keep serving. Truly unknown synchronous exceptions still exit (the host
// restarts us) after being logged.
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err)
})
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
  process.exit(1)
})

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🌿 Lawnn API running on http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health\n`)
})
