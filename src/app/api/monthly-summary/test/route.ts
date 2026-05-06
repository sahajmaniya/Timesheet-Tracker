import { NextResponse } from "next/server";
import { sendMonthlySummaryEmail } from "@/lib/email";
import { getServerAuthSession } from "@/lib/auth";
import { buildMonthlySummaryForUser, getPreviousMonthKey } from "@/lib/monthly-summary";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        monthlySummaryEmailEnabled: true,
      },
    });

    if (!user?.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 404 });
    }

    if (!user.monthlySummaryEmailEnabled) {
      return NextResponse.json(
        { error: "Monthly summary emails are disabled in your settings." },
        { status: 400 },
      );
    }

    const month = getPreviousMonthKey();
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

    return NextResponse.json({
      ok: true,
      month: summary.month,
      workedHours: summary.totalWorkedHoursDecimal,
      grossPayEstimate: summary.grossPayEstimate,
    });
  } catch (error) {
    console.error("Monthly summary test email failed:", error);
    return NextResponse.json({ error: "Could not send test summary email." }, { status: 500 });
  }
}
