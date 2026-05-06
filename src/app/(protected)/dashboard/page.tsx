import { DashboardClient } from "@/components/entries/dashboard-client";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          hourlyRate: true,
          federalStatus: true,
          stateStatus: true,
          federalTaxPercent: true,
          stateTaxPercent: true,
          otherDeductionMonthly: true,
        },
      })
    : null;

  return (
    <DashboardClient
      initialProfileName={user?.name ?? null}
      initialPayrollProfile={
        user
          ? {
              hourlyRate: user.hourlyRate ?? 0,
              federalStatus: user.federalStatus ?? "S",
              stateStatus: user.stateStatus ?? "S-00",
              federalTaxPercent: user.federalTaxPercent ?? 0,
              stateTaxPercent: user.stateTaxPercent ?? 0,
              otherDeductionMonthly: user.otherDeductionMonthly ?? 0,
            }
          : null
      }
    />
  );
}
