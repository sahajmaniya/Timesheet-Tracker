import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { payrollPeriodSchema } from "@/lib/validators";

function missingTableResponse(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
    return NextResponse.json(
      { error: "Payroll periods are not installed in this database yet. Apply the payroll-period migration first." },
      { status: 503 },
    );
  }
  return null;
}

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const periods = await prisma.payrollPeriod.findMany({
      where: { userId: session.user.id },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ periods });
  } catch (error) {
    console.error("Could not load payroll periods:", error);
    return missingTableResponse(error) ?? NextResponse.json({ error: "Could not load payroll periods" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = payrollPeriodSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payroll period" }, { status: 400 });
    }
    const period = await prisma.payrollPeriod.upsert({
      where: { userId_startDate_endDate: { userId: session.user.id, startDate: parsed.data.startDate, endDate: parsed.data.endDate } },
      create: { userId: session.user.id, ...parsed.data },
      update: { label: parsed.data.label },
    });
    return NextResponse.json({ period }, { status: 201 });
  } catch (error) {
    console.error("Could not save payroll period:", error);
    return missingTableResponse(error) ?? NextResponse.json({ error: "Could not save payroll period" }, { status: 500 });
  }
}
