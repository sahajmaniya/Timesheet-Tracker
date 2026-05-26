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
- Gross pay estimate from worked hours (hourly-rate based)
- CSV export by month
- Fill monthly timesheet PDF templates from saved entries
- Role-based timesheet generation: SA / ISA
- PDF layout modes: `auto`, `standard`, `carry` with advanced alignment options
- PDF preset save/apply workflow and optional preview-before-download
- Per-user regular shift schedule in Settings
- Calendar-aligned month heatmap with weekday headers and per-day click-to-open dialog
- Optional monthly recap email (hours + gross estimate) with test-send from Settings
- Mobile-responsive UI, dark/light theme support, modern landing page
- SEO baseline: metadata, JSON-LD, robots, sitemap, canonical URLs
- Themed branding system (light/dark wordmarks, favicon set, web manifest, OG image)
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

Known limitation:
- Split shifts or multiple project entries on the same calendar date are not supported in the current schema.
- Import behavior follows this model (`skip` or `overwrite` for same-date rows).

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
SUPPORT_INBOX="support@yourdomain.com"
CRON_SECRET="replace-with-a-long-random-secret"
SUPPORT_EMAIL_TIMEZONE="UTC"
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
   - `SUPPORT_INBOX`
   - `CRON_SECRET`
   - `SUPPORT_EMAIL_TIMEZONE` (optional, defaults to `UTC`; used in support email submitted timestamp)
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
7. Monthly summary automation:
   - `vercel.json` already includes monthly cron:
     - `POST /api/cron/monthly-summary` on day 1 (UTC)
   - Cron route expects:
     - `Authorization: Bearer ${CRON_SECRET}`

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
- `GET /api/payroll/estimate?month=YYYY-MM`
- `POST /api/monthly-summary/test`
- `POST /api/cron/monthly-summary`

## Notes

- All entry APIs derive `userId` from authenticated session.
- Client-submitted `userId` is never trusted.
- Chronology validation blocks invalid ranges (e.g., punch out before punch in).
- Conservative API rate limits are enabled for OTP, password reset, CSV export, PDF generation, and Excel import.
- Clicking PunchPilot logo in navbar/topbar/footer routes to home (`/`).

## Rate Limits

Current API limits are in-memory per server instance and keyed by user/IP context.

| Endpoint/Flow | Limit | Window |
| --- | --- | --- |
| Signup (`/api/auth/signup`) | 6 requests | 10 minutes |
| OTP request (`/api/auth/request-otp`) | 8 requests | 10 minutes |
| Forgot password (`/api/auth/forgot-password`) | 6 requests | 10 minutes |
| Reset password (`/api/auth/reset-password`) | 8 requests | 10 minutes |
| CSV export (`/api/entries/export`) | 25 requests | 10 minutes |
| PDF generation (`/api/entries/fill-pdf`) | 12 requests | 10 minutes |
| Excel import (`/api/import/excel`) | 8 requests | 10 minutes |
| Support form (`/api/support`) | 4 requests | 1 minute |

## Monthly Summary Emails

- Users can enable/disable monthly recap emails in **Settings**.
- Recap includes:
  - month
  - total worked hours
  - hourly rate
  - estimated gross pay
- Recaps are deduplicated per user/month using `MonthlySummaryEmailLog` so duplicate sends are prevented.
- Test send endpoint:
  - `POST /api/monthly-summary/test`
- Automated endpoint (cron):
  - `POST /api/cron/monthly-summary`
  - Requires header `Authorization: Bearer ${CRON_SECRET}`

### CRON_SECRET requirements

- Use a high-entropy value (recommended: at least 32 random bytes, base64/hex encoded).
- Never commit it to git or expose it in client-side code.
- Rotate it immediately if leaked and update your deployment environment before the next cron run.

Example generation:

```bash
openssl rand -base64 32
```

## Auth Audit Logs

Authentication and recovery flows write to `AuthAuditLog` (`event`, `success`, `reason`, `email`, `userId`, `ip`, `userAgent`, `createdAt`) for security troubleshooting.

Current behavior:
- Event catalog currently includes:
| Area | Events |
| --- | --- |
| Sign-in | `signin_attempt`, `signin_invalid_input`, `signin_failed`, `signin_success`, `google_signin_success` |
| Signup | `signup_invalid_input`, `signup_rate_limited`, `signup_conflict`, `signup_success`, `signup_error` |
| OTP request | `otp_request_invalid_input`, `otp_request_rate_limited`, `otp_request_auth_failed`, `otp_request_sent`, `otp_request_error` |
| Forgot password | `password_reset_request_invalid_input`, `password_reset_request_rate_limited`, `password_reset_request_unknown_email`, `password_reset_request_sent`, `password_reset_request_error` |
| Reset password | `password_reset_invalid_input`, `password_reset_rate_limited`, `password_reset_token_invalid`, `password_reset_success`, `password_reset_error` |
- Logs are stored in PostgreSQL and are not currently exposed in an end-user UI.
- Retention is currently database-managed (no automated purge job in this repo yet).

## PDF Template Requirement

- PDF generation expects a **blank monthly timesheet PDF template** uploaded by the user at generation time.
- The template can be organization-specific; PunchPilot maps tracked entries into that uploaded template.
- For benchmarking/dev examples, an optional template path can be provided via `BENCH_PDF_TEMPLATE_PATH`.
- Filled PDF time format:
  - `student_assistant`: 12-hour time with `AM/PM`
  - `instructional_student_assistant`: compact 12-hour time (no `AM/PM`) to preserve template spacing
- PDF renderer applies column-aware text fitting for tight templates.

## Password Policy

Signup/reset password currently requires:
- Minimum 12 characters
- Maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No spaces

## Backups (Recommended)

Create a PostgreSQL backup dump:

```bash
DATABASE_URL="your_database_url" npm run backup:db
```

Optional custom backup folder:

```bash
DATABASE_URL="your_database_url" BACKUP_DIR=./backups npm run backup:db
```

Restore example:

```bash
pg_restore --clean --if-exists --no-owner --no-privileges -d "your_database_url" ./backups/<dump-file>.dump
```

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
