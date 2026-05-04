import { NextResponse } from "next/server";
import { z } from "zod";
import { sendSupportRequestEmail } from "@/lib/email";
import { clientIpFromHeaders, enforceRateLimit, rejectIfCrossOrigin } from "@/lib/security";

const supportSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  category: z.enum(["General", "Import", "Export", "Billing", "Bug"]),
  subject: z.string().trim().min(4, "Subject is too short").max(120, "Subject is too long"),
  message: z.string().trim().min(20, "Please add more details").max(2500, "Message is too long"),
});

export async function POST(request: Request) {
  try {
    const blocked = rejectIfCrossOrigin(request);
    if (blocked) return blocked;

    const ip = clientIpFromHeaders(request.headers);
    const body = await request.json();
    const parsed = supportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request body." }, { status: 400 });
    }

    const rateLimit = enforceRateLimit({
      key: `support:${ip}:${parsed.data.email}`,
      limit: 4,
      windowMs: 60_000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many support requests. Please try again in a minute." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    await sendSupportRequestEmail(parsed.data);

    return NextResponse.json({
      ok: true,
      message: "Thanks! Your query has been sent. Our team will get back to you soon.",
    });
  } catch (error) {
    console.error("Support request failed:", error);
    return NextResponse.json({ error: "Could not submit your request. Please try again." }, { status: 500 });
  }
}

