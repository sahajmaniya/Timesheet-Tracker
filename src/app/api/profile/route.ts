import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { payrollProfileSchema, profileUpdateSchema, workScheduleSchema } from "@/lib/validators";
import { DEFAULT_WORK_SCHEDULE } from "@/lib/work-schedule";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      signature: true,
      workScheduleJson: true,
      calculationSource: true,
      hourlyRate: true,
      federalStatus: true,
      stateStatus: true,
      federalTaxPercent: true,
      stateTaxPercent: true,
      otherDeductionMonthly: true,
      monthlySummaryEmailEnabled: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const parsedSchedule = workScheduleSchema.safeParse(user.workScheduleJson);

  return NextResponse.json({
    profile: {
      name: user.name,
      email: user.email,
      image: user.image,
      signature: user.signature,
      workSchedule: parsedSchedule.success ? parsedSchedule.data : DEFAULT_WORK_SCHEDULE,
      payrollProfile: {
        hourlyRate: user.hourlyRate ?? 0,
        federalStatus: user.federalStatus ?? "S",
        stateStatus: user.stateStatus ?? "S-00",
        federalTaxPercent: user.federalTaxPercent ?? 0,
        stateTaxPercent: user.stateTaxPercent ?? 0,
        otherDeductionMonthly: user.otherDeductionMonthly ?? 0,
      },
      monthlySummaryEmailEnabled: user.monthlySummaryEmailEnabled ?? true,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid profile input" },
        { status: 400 },
      );
    }

    const hasImageField =
      typeof body === "object" &&
      body !== null &&
      Object.prototype.hasOwnProperty.call(body, "image");
    const hasSignatureField =
      typeof body === "object" &&
      body !== null &&
      Object.prototype.hasOwnProperty.call(body, "signature");

    const updateData: Prisma.UserUpdateInput = {
      name: parsed.data.name,
    };

    if (hasImageField) {
      updateData.image = parsed.data.image || null;
    }
    if (hasSignatureField) {
      updateData.signature = parsed.data.signature || null;
    }

    if (parsed.data.workSchedule) {
      updateData.workScheduleJson = parsed.data.workSchedule as Prisma.InputJsonValue;
    }
    if (parsed.data.payrollProfile) {
      const safePayroll = payrollProfileSchema.parse(parsed.data.payrollProfile);
      updateData.hourlyRate = safePayroll.hourlyRate;
      updateData.federalStatus = safePayroll.federalStatus;
      updateData.stateStatus = safePayroll.stateStatus;
      updateData.federalTaxPercent = safePayroll.federalTaxPercent;
      updateData.stateTaxPercent = safePayroll.stateTaxPercent;
      updateData.otherDeductionMonthly = safePayroll.otherDeductionMonthly;
    }
    if (typeof parsed.data.monthlySummaryEmailEnabled === "boolean") {
      updateData.monthlySummaryEmailEnabled = parsed.data.monthlySummaryEmailEnabled;
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        name: true,
        email: true,
        image: true,
        signature: true,
        workScheduleJson: true,
        calculationSource: true,
        hourlyRate: true,
        federalStatus: true,
        stateStatus: true,
        federalTaxPercent: true,
        stateTaxPercent: true,
        otherDeductionMonthly: true,
        monthlySummaryEmailEnabled: true,
      },
    });

    const parsedSchedule = workScheduleSchema.safeParse(updated.workScheduleJson);

    return NextResponse.json({
      profile: {
        name: updated.name,
        email: updated.email,
        image: updated.image,
        signature: updated.signature,
        workSchedule: parsedSchedule.success ? parsedSchedule.data : DEFAULT_WORK_SCHEDULE,
        payrollProfile: {
          hourlyRate: updated.hourlyRate ?? 0,
          federalStatus: updated.federalStatus ?? "S",
          stateStatus: updated.stateStatus ?? "S-00",
          federalTaxPercent: updated.federalTaxPercent ?? 0,
          stateTaxPercent: updated.stateTaxPercent ?? 0,
          otherDeductionMonthly: updated.otherDeductionMonthly ?? 0,
        },
        monthlySummaryEmailEnabled: updated.monthlySummaryEmailEnabled ?? true,
      },
    });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
