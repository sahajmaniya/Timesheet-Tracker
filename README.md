# PunchPilot

Modern, responsive timesheet tracker built with Next.js App Router, TypeScript, Tailwind, shadcn/ui style components, NextAuth credentials auth, Prisma, and Postgres.

## Live Demo

- Production URL: https://punch-pilot.vercel.app

## Features

- Sign up / sign in / sign out (NextAuth credentials)
- Protected pages: `/dashboard`, `/entries`, `/settings`
- User-isolated data access (server-side userId enforcement)
- Daily time log: date, punch in/out, breaks, notes
- Automatic break + worked duration calculations
- Validation with Zod + React Hook Form
- Monthly totals + average/day analytics
- CSV export by month
- Mobile-responsive UI + dark mode toggle
- Seed script for demo data

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- shadcn/ui-style components (`Card`, `Button`, `Input`, `Dialog`, `Table`, `Tabs`, `Toast`)
- NextAuth (Credentials)
- Prisma ORM
- PostgreSQL (Neon/Supabase compatible)

## Data Model Choice

This app uses **one entry per user per day** with Prisma constraint:

- `@@unique([userId, date])`

This prevents accidental duplicates and matches monthly timesheet workflows.

## Timezone Strategy

- `date` stored as local `YYYY-MM-DD` string
- `punchIn`, `punchOut`, breaks stored as local `HH:mm` strings

This avoids UTC date-shift issues when users record local workday times.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file and fill values:

```bash
cp .env.example .env.local
```

3. Set up Postgres in Neon/Supabase and paste the `DATABASE_URL`.

4. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init

# or in deployed/prod database:
# npx prisma migrate deploy
```

5. (Optional) Seed demo data:

```bash
npm run seed
```

6. Run app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

1. Push repo to GitHub.
2. Import project in Vercel.
3. Add environment variables in Vercel Project Settings:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (set to your production URL, e.g. `https://your-app.vercel.app`)
4. Deploy.
5. Run production migration once:

```bash
npx prisma migrate deploy
```

## API Routes

- `POST /api/auth/signup`
- `GET /api/entries?month=YYYY-MM`
- `POST /api/entries`
- `GET /api/entries/:id`
- `PATCH /api/entries/:id`
- `DELETE /api/entries/:id`
- `GET /api/entries/export?month=YYYY-MM`

## Notes

- All entry APIs derive `userId` from authenticated session.
- Client-submitted `userId` is never trusted.
- Chronology validation blocks invalid ranges (e.g., punch out before punch in).

## E2E Smoke Tests (Playwright)

Run smoke tests (desktop + mobile projects):

```bash
npm run test:e2e
```

Run with visible browser:

```bash
npm run test:e2e:headed
```

Optional authenticated smoke checks:

```bash
E2E_EMAIL=your_email@example.com E2E_PASSWORD=your_password npm run test:e2e
```

Without `E2E_EMAIL` and `E2E_PASSWORD`, only public/unauthenticated smoke tests run.
