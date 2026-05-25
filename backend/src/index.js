import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import authRoutes          from './routes/auth.js'
import profileRoutes       from './routes/profiles.js'
import jobRoutes           from './routes/jobs.js'
import projectRoutes       from './routes/projects.js'
import adminRoutes         from './routes/admin.js'
import conversationRoutes  from './routes/conversations.js'
import feedRoutes          from './routes/feed.js'
import { initSocket }      from './socket.js'

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

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/auth',          authRoutes)
app.use('/profiles',      profileRoutes)
app.use('/jobs',          jobRoutes)
app.use('/projects',      projectRoutes)
app.use('/admin',         adminRoutes)
app.use('/conversations', conversationRoutes)
app.use('/feed',          feedRoutes)

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

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🌿 Lawnn API running on http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health\n`)
})
