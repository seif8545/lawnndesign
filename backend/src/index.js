import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'

import authRoutes          from './routes/auth.js'
import profileRoutes       from './routes/profiles.js'
import jobRoutes           from './routes/jobs.js'
import projectRoutes       from './routes/projects.js'
import adminRoutes         from './routes/admin.js'
import conversationRoutes  from './routes/conversations.js'
import { initSocket }      from './socket.js'

const app    = express()
const server = http.createServer(app)
const PORT   = process.env.PORT || 3001

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '10mb' }))

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/auth',          authRoutes)
app.use('/profiles',      profileRoutes)
app.use('/jobs',          jobRoutes)
app.use('/projects',      projectRoutes)
app.use('/admin',         adminRoutes)
app.use('/conversations', conversationRoutes)

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
