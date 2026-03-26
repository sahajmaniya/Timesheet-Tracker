import nodemailer from "nodemailer";

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM,
  );
}

export async function sendOtpEmail({
  to,
  code,
}: {
  to: string;
  code: string;
}) {
  if (!hasSmtpConfig()) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[DEV OTP] ${to} => ${code}`);
      return { devMode: true };
    }
    throw new Error("Email service is not configured. Set SMTP env vars.");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Your PunchPilot verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="margin:0;padding:24px;background:#f4f8ff;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td style="padding:0;">
              <div style="border-radius:16px;overflow:hidden;border:1px solid #dbeafe;background:linear-gradient(135deg,#0b1220 0%,#0f172a 35%,#1d4ed8 100%);padding:18px 20px;">
                <div style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#93c5fd;font-weight:700;">PunchPilot</div>
                <div style="margin-top:8px;font-size:22px;line-height:1.25;color:#e2e8f0;font-weight:700;">Your Sign-In Verification Code</div>
                <div style="margin-top:6px;font-size:14px;color:#cbd5e1;">Use this one-time code to finish signing in.</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:14px;">
              <div style="border:1px solid #dbeafe;border-radius:16px;background:#ffffff;padding:20px;">
                <div style="font-size:13px;color:#334155;margin-bottom:10px;">Verification code</div>
                <div style="font-size:36px;letter-spacing:.2em;font-weight:800;color:#0f172a;padding:12px 14px;border:1px dashed #93c5fd;border-radius:12px;background:#eff6ff;text-align:center;">
                  ${code}
                </div>
                <p style="margin:14px 0 0 0;font-size:14px;color:#334155;">
                  This code expires in <strong>10 minutes</strong>.
                </p>
                <p style="margin:10px 0 0 0;font-size:13px;color:#64748b;">
                  If you did not request this, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px;text-align:center;font-size:12px;color:#64748b;">
              PunchPilot • Secure timesheet workspace
            </td>
          </tr>
        </table>
      </div>
    `,
  });

  return { devMode: false };
}
