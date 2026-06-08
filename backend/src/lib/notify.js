import prisma from './prisma.js'

// Fire-and-forget notification creation. Never throws — a failed notification
// must not break the action that triggered it.
export async function notify(userId, { type = 'info', title, body = null, link = null }) {
  if (!userId || !title) return
  try {
    await prisma.notification.create({ data: { userId, type, title, body, link } })
  } catch (e) {
    console.warn('[notify] failed:', e.message)
  }
}
