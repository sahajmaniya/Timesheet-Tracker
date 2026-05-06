export const siteConfig = {
  name: "PunchPilot",
  description:
    "SA/ISA timesheet tracker with punch in/out, monthly gross pay estimate, CSV export, and PDF-ready output.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  keywords: [
    "PunchPilot",
    "timesheet tracker",
    "gross pay estimate",
    "hourly pay tracker",
    "student assistant timesheet",
    "instructional student assistant timesheet",
    "work hours tracker",
    "punch in punch out app",
    "monthly timesheet export",
    "timesheet pdf generator",
  ],
} as const;
