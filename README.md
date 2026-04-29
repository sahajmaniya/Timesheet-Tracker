# PunchPilot

Modern, responsive timesheet tracker built with Next.js App Router, TypeScript, Tailwind, shadcn/ui style components, NextAuth credentials auth + email OTP verification (plus optional Google sign-in), Prisma, and Postgres.

## Live Demo

- Production URL: https://punchpilot.online

## Features

- Sign up / sign in / sign out (Credentials + optional Google OAuth)
- 2-step sign-in with email OTP verification
- Forgot-password + reset-password recovery flow
- Protected pages: `/dashboard`, `/entries`, `/settings`
- User-isolated data access (server-side userId enforcement)
- Daily time log: date, punch in/out, breaks, notes
- Automatic break + worked duration calculations
- Validation with Zod + React Hook Form
- Monthly totals + average/day analytics
- CSV export by month
- Fill monthly timesheet PDF templates from saved entries
- Role-based timesheet generation: SA / ISA
- PDF layout modes: `auto`, `standard`, `carry` with advanced alignment options
- PDF preset save/apply workflow and optional preview-before-download
- Per-user regular shift schedule in Settings
- Mobile-responsive UI, dark/light theme support, modern landing page
- SEO baseline: metadata, JSON-LD, robots, sitemap, canonical URLs
- Seed script for demo data

## Tech Stack

| Technology | Where it's used in this project | Why it's used |
| --- | --- | --- |
| Next.js 16 (App Router) | App pages, API routes, server rendering | Full-stack React framework for UI + backend endpoints in one codebase |
| React 19 + TypeScript | UI components and app logic in `src/` | Strong typing, better maintainability, and safer refactoring |
| Tailwind CSS 4 | Styling in `globals.css` and component classes | Fast utility-first styling with responsive design support |
| shadcn/ui + Radix UI + CVA | Reusable UI primitives (`Button`, `Dialog`, `Tabs`, etc.) | Accessible, consistent, and customizable design system |
| NextAuth.js | Credential/Google login and session handling | Secure authentication and protected routes |
| Email OTP (custom flow) + Nodemailer | 2-step sign-in verification via email code | Adds extra account security during login |
| Prisma ORM + `pg` driver | Database schema, queries, migrations | Type-safe DB access and reliable schema evolution |
| PostgreSQL | Persistent storage for users, entries, settings, audit logs | Relational database fit for structured timesheet data |
| Zod + React Hook Form | Form validation and form state handling | Client/server validation with cleaner form UX |
| `date-fns` | Time/date math for totals and validations | Reliable utilities for time calculations |
| `xlsx` | Excel import endpoint (`/api/import/excel`) | Bulk import entries from spreadsheet files |
| `pdf-lib` + `pdfjs-dist` | PDF fill/export endpoint (`/api/entries/fill-pdf`) | Generate filled monthly timesheet PDFs |
| Playwright | E2E smoke tests in `tests/e2e` | Automated browser testing for key user journeys |
| ESLint | Static analysis/linting | Keeps code quality and consistency high |

## Data Model Choice

This app uses **one entry per user per day** with Prisma constraint:

- `@@unique([userId, date])`

This prevents accidental duplicates and matches monthly timesheet workflows.

## Timezone Strategy

- `date` stored as local `YYYY-MM-DD` string
- `punchIn`, `punchOut`, breaks stored as local `HH:mm` strings
- Generated PDF signature date uses client-local date input to avoid server timezone drift

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

4. Configure authentication + OTP email variables in `.env.local`:

```bash
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

OTP_SECRET="replace-with-another-random-secret"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-sender@gmail.com"
SMTP_PASS="your-gmail-app-password"
SMTP_FROM="PunchPilot <your-sender@gmail.com>"
```

5. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev

# or in deployed/prod database:
# npx prisma migrate deploy
```

6. (Optional) Seed demo data:

```bash
npm run seed
```

7. Run app:

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
   - `NEXTAUTH_URL` (set to your production URL, e.g. `https://punchpilot.online`)
   - `NEXT_PUBLIC_SITE_URL` (set to your production URL, e.g. `https://punchpilot.online`)
   - `GOOGLE_CLIENT_ID` (optional, enables Google sign-in)
   - `GOOGLE_CLIENT_SECRET` (optional, enables Google sign-in)
   - `OTP_SECRET`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
4. Deploy.
5. Run production migration once:

```bash
npx prisma migrate deploy
```

6. For Google OAuth in production, configure Google Cloud OAuth app with:
   - Authorized JavaScript origins:
     - `https://punchpilot.online`
   - Authorized redirect URI:
     - `https://punchpilot.online/api/auth/callback/google`

## API Routes

- `POST /api/auth/signup`
- `POST /api/auth/request-otp`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/entries?month=YYYY-MM`
- `POST /api/entries`
- `GET /api/entries/:id`
- `PATCH /api/entries/:id`
- `DELETE /api/entries/:id`
- `GET /api/entries/export?month=YYYY-MM`
- `POST /api/entries/fill-pdf`
- `POST /api/import/excel`
- `GET /api/profile`
- `PATCH /api/profile`

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

## Performance & Analysis

### Bundle analyzer

Generate webpack bundle reports:

```bash
npm run analyze
```

This enables Next.js bundle analyzer via `ANALYZE=true` and opens bundle report output.

### Lighthouse CI

Run Lighthouse against key public pages:

```bash
npm run perf:lighthouse
```

Configuration file: `.lighthouserc.json`  
Reports are saved to `.lighthouseci/`.

### API latency benchmark

Run API response-time benchmark summary:

```bash
npm run perf:api
```

Optional environment variables:

- `BENCH_BASE_URL` (default: `http://127.0.0.1:3000`)
- `BENCH_MONTH` (default: current `YYYY-MM`)
- `BENCH_RUNS` (default: `8`)
- `BENCH_SESSION_COOKIE` (required for authenticated API timings)
- `BENCH_PDF_TEMPLATE_PATH` (optional; include to benchmark `/api/entries/fill-pdf`)
- `BENCH_TIMESHEET_ROLE` (default: `student_assistant`)
- `BENCH_LAYOUT_MODE` (default: `auto`)

Example with authenticated endpoints:

```bash
BENCH_BASE_URL=http://127.0.0.1:3000 \
BENCH_SESSION_COOKIE='next-auth.session-token=...' \
BENCH_PDF_TEMPLATE_PATH=./exports/blank-timesheet.pdf \
npm run perf:api
```
