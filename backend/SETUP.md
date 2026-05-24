# Lawnn Backend — Setup Guide

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Name it `lawnn`, pick a strong database password, choose the closest region (e.g. EU West for Egypt)
4. Wait ~2 minutes for it to provision

## 2. Get your connection string

1. In your Supabase project, go to **Settings → Database**
2. Scroll down to **Connection string**
3. Select the **URI** tab
4. Copy the string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```

## 3. Create your .env file

In the `backend/` folder, copy the example:

```bash
cp .env.example .env
```

Then open `.env` and fill in:
- `DATABASE_URL` — paste the Supabase URI from step 2
- `DIRECT_URL` — same URI (you can use the same value for both)
- `JWT_SECRET` — generate one by running this in your terminal:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

## 4. Install dependencies and run migrations

```bash
cd backend
npm install
npm run db:generate   # generates the Prisma client
npm run db:push       # pushes the schema to your Supabase database (no migration files)
```

`db:push` is the fastest way to get started. When you're closer to production, switch
to `db:migrate` to track changes properly.

## 5. Start the server

```bash
npm run dev
```

You should see:
```
🌿 Lawnn API running on http://localhost:3001
   Health: http://localhost:3001/health
```

Visit http://localhost:3001/health to confirm it's working.

## 6. Keep your free tier awake (optional)

Supabase pauses free databases after 7 days of inactivity.
To prevent this, set up a free cron job at https://cron-job.org that pings:
```
https://db.YOUR-PROJECT-REF.supabase.co
```
every 3 days.

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | — | Create account |
| POST | /auth/login | — | Login, get JWT |
| GET | /auth/me | ✓ | Get current user |
| GET | /profiles | — | List all talent profiles |
| GET | /profiles/:id | — | Single profile |
| PATCH | /profiles/:id | student/admin | Update own profile |
| GET | /jobs | — | List live jobs |
| GET | /jobs/:id | — | Single job |
| POST | /jobs | client/admin | Post a job |
| PATCH | /jobs/:id/status | admin | Approve/close a job |
| DELETE | /jobs/:id | client/admin | Delete a job |
| POST | /jobs/:id/applications | student | Apply to a job |
| GET | /jobs/:id/applications | client/admin | View applications |
| GET | /projects | ✓ | My projects |
| GET | /projects/:id | ✓ | Single project |
| POST | /projects | client/admin | Create project (direct hire) |
| POST | /projects/:id/advance | ✓ | Drive escrow state machine |
| POST | /projects/:id/reviews | ✓ | Leave a review |
