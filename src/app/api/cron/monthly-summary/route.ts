import { NextResponse } from "next/server";
import { sendMonthlySummaryEmail } from "@/lib/email";
import { buildMonthlySummaryForUser, getPreviousMonthKey } from "@/lib/monthly-summary";
import { prisma } from "@/lib/prisma";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization") || "";
  return authHeader === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
    }

    const month = getPreviousMonthKey();
    const users = await prisma.user.findMany({
      where: {
        monthlySummaryEmailEnabled: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      const existingLog = await prisma.monthlySummaryEmailLog.findUnique({
        where: {
          userId_month: {
            userId: user.id,
            month,
          },
        },
        select: { id: true },
      });

      if (existingLog) {
        skipped += 1;
        continue;
      }

      try {
        const summary = await buildMonthlySummaryForUser({
          userId: user.id,
          month,
        });

        await sendMonthlySummaryEmail({
          to: user.email,
          name: user.name,
          month: summary.month,
          totalWorkedHoursDecimal: summary.totalWorkedHoursDecimal,
          hourlyRate: summary.hourlyRate,
          grossPayEstimate: summary.grossPayEstimate,
        });

        await prisma.monthlySummaryEmailLog.create({
          data: {
            userId: user.id,
            month,
          },
        });

        sent += 1;
      } catch (error) {
        failed += 1;
        console.error(`Monthly summary cron failed for user ${user.id}:`, error);
      }
    }

    return NextResponse.json({
      ok: true,
      month,
      totalUsers: users.length,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    console.error("Monthly summary cron failed:", error);
    return NextResponse.json({ error: "Monthly summary cron failed" }, { status: 500 });
  }
}
