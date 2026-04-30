export const siteConfig = {
  name: "PunchPilot",
  description:
    "Timesheet tracker for SA and ISA workflows with punch in/out tracking, monthly CSV export, and PDF-ready output.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  keywords: [
    "PunchPilot",
    "timesheet tracker",
    "student assistant timesheet",
    "instructional student assistant timesheet",
    "work hours tracker",
    "punch in punch out app",
    "monthly timesheet export",
    "timesheet pdf generator",
  ],
} as const;
