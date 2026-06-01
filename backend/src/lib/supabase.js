import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.warn('[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — uploads will fail')
}

// Service-role client. NEVER expose this key to the browser — it bypasses RLS.
// Used only on the backend to mint signed upload/read URLs for Storage.
const supabase = createClient(url || 'http://placeholder', serviceKey || 'placeholder', {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Bucket names — must exist in Supabase Dashboard → Storage.
export const PUBLIC_BUCKET  = process.env.SUPABASE_PUBLIC_BUCKET  || 'lawnn-public'
export const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET || 'lawnn-private'

export default supabase
