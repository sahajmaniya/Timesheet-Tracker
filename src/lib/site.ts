export const siteConfig = {
  name: "PunchPilot",
  description: "Modern timesheet tracker for punch in/out, break logging, monthly totals, and CSV export.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  keywords: [
    "PunchPilot",
    "timesheet tracker",
    "employee timesheet app",
    "student assistant timesheet",
    "work hours tracker",
    "punch in punch out app",
    "monthly timesheet export",
    "break time tracker",
  ],
} as const;

