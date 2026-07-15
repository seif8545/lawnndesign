// Run the student open-jobs digest once, then exit. Point a scheduler at this
// (e.g. a Render Cron Job every 3 days: `node scripts/runDigest.js`). Uses the
// same env as the server (BREVO_API_KEY, DATABASE_URL, FRONTEND_URL).
import 'dotenv/config'
import { runJobDigest } from '../src/lib/jobDigest.js'

runJobDigest()
  .then(r => { console.log('[digest]', JSON.stringify(r)); process.exit(0) })
  .catch(e => { console.error('[digest] failed:', e); process.exit(1) })
