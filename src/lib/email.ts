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

function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function emailWrapper(content: string) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </head>
      <body style="margin:0;padding:0;background:#f4f8ff;">
        ${content}
      </body>
    </html>
  `;
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
    html: emailWrapper(`
      <div style="margin:0;padding:24px;background:#f4f8ff;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td style="padding:0;">
              <div style="border-radius:16px;overflow:hidden;border:1px solid #1e3a8a;background-color:#0f172a;background-image:linear-gradient(135deg,#0b1220 0%,#0f172a 35%,#1d4ed8 100%);padding:18px 20px;color:#e2e8f0 !important;-webkit-text-fill-color:#e2e8f0 !important;">
                <div style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#93c5fd;-webkit-text-fill-color:#93c5fd;font-weight:700;">PunchPilot</div>
                <div style="margin-top:8px;font-size:22px;line-height:1.25;color:#e2e8f0;-webkit-text-fill-color:#e2e8f0;font-weight:700;">Your Sign-In Verification Code</div>
                <div style="margin-top:6px;font-size:14px;color:#cbd5e1;-webkit-text-fill-color:#cbd5e1;">Use this one-time code to finish signing in.</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:14px;">
              <div style="border:1px solid #dbeafe;border-radius:16px;background:#ffffff;padding:20px;">
                <div style="font-size:13px;color:#334155;-webkit-text-fill-color:#334155;margin-bottom:10px;">Verification code</div>
                <div style="font-size:36px;letter-spacing:.2em;font-weight:800;color:#0f172a;padding:12px 14px;border:1px dashed #93c5fd;border-radius:12px;background:#eff6ff;text-align:center;">
                  ${code}
                </div>
                <p style="margin:14px 0 0 0;font-size:14px;color:#334155;-webkit-text-fill-color:#334155;">
                  This code expires in <strong>10 minutes</strong>.
                </p>
                <p style="margin:10px 0 0 0;font-size:13px;color:#64748b;-webkit-text-fill-color:#64748b;">
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
    `),
  });

  return { devMode: false };
}

export async function sendPasswordResetEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}) {
  const resetUrl = `${getAppBaseUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;

  if (!hasSmtpConfig()) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[DEV RESET] ${to} => ${resetUrl}`);
      return { devMode: true, resetUrl };
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
    subject: "Reset your PunchPilot password",
    text: `Reset your password using this link (expires in 30 minutes): ${resetUrl}`,
    html: emailWrapper(`
      <div style="margin:0;padding:24px;background:#f4f8ff;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td style="padding:0;">
              <div style="border-radius:16px;overflow:hidden;border:1px solid #1e3a8a;background-color:#0f172a;background-image:linear-gradient(135deg,#0b1220 0%,#0f172a 35%,#1d4ed8 100%);padding:18px 20px;color:#e2e8f0 !important;-webkit-text-fill-color:#e2e8f0 !important;">
                <div style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#93c5fd;-webkit-text-fill-color:#93c5fd;font-weight:700;">PunchPilot</div>
                <div style="margin-top:8px;font-size:22px;line-height:1.25;color:#e2e8f0;-webkit-text-fill-color:#e2e8f0;font-weight:700;">Reset Your Password</div>
                <div style="margin-top:6px;font-size:14px;color:#cbd5e1;-webkit-text-fill-color:#cbd5e1;">Use the secure button below to set a new password.</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:14px;">
              <div style="border:1px solid #dbeafe;border-radius:16px;background:#ffffff;padding:20px;">
                <p style="margin:0 0 14px 0;font-size:14px;color:#334155;-webkit-text-fill-color:#334155;">
                  This reset link expires in <strong>30 minutes</strong>.
                </p>
                <a href="${resetUrl}" style="display:inline-block;padding:11px 16px;border-radius:10px;background:#1d4ed8;color:#ffffff;-webkit-text-fill-color:#ffffff;text-decoration:none;font-weight:600;">
                  Reset Password
                </a>
                <p style="margin:14px 0 0 0;font-size:13px;color:#64748b;-webkit-text-fill-color:#64748b;">
                  If you did not request this, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `),
  });

  return { devMode: false, resetUrl };
}

export async function sendPasswordChangedEmail({
  to,
}: {
  to: string;
}) {
  if (!hasSmtpConfig()) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[DEV PASSWORD CHANGED] ${to}`);
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
    subject: "Your PunchPilot password was changed",
    text: "Your password was changed successfully. If this was not you, contact support immediately.",
    html: emailWrapper(`
      <div style="margin:0;padding:24px;background:#f4f8ff;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td style="padding:0;">
              <div style="border-radius:16px;overflow:hidden;border:1px solid #1e3a8a;background-color:#0f172a;background-image:linear-gradient(135deg,#0b1220 0%,#0f172a 35%,#1d4ed8 100%);padding:18px 20px;color:#e2e8f0 !important;-webkit-text-fill-color:#e2e8f0 !important;">
                <div style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#93c5fd;-webkit-text-fill-color:#93c5fd;font-weight:700;">PunchPilot</div>
                <div style="margin-top:8px;font-size:22px;line-height:1.25;color:#e2e8f0;-webkit-text-fill-color:#e2e8f0;font-weight:700;">Password Updated</div>
                <div style="margin-top:6px;font-size:14px;color:#cbd5e1;-webkit-text-fill-color:#cbd5e1;">Your account password was changed successfully.</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:14px;">
              <div style="border:1px solid #dbeafe;border-radius:16px;background:#ffffff;padding:20px;">
                <p style="margin:0;font-size:14px;color:#334155;-webkit-text-fill-color:#334155;">
                  If you did not perform this action, secure your account immediately.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `),
  });

  return { devMode: false };
}

export async function sendSupportRequestEmail({
  name,
  email,
  category,
  subject,
  message,
}: {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}) {
  const safeName = escapeHtml(name.trim());
  const safeEmail = escapeHtml(email.trim().toLowerCase());
  const safeCategory = escapeHtml(category.trim());
  const safeSubject = escapeHtml(subject.trim());
  const safeMessage = escapeHtml(message.trim());

  const supportInbox = process.env.SUPPORT_INBOX || process.env.SMTP_FROM;
  if (!supportInbox) {
    throw new Error("Support inbox is not configured. Set SUPPORT_INBOX or SMTP_FROM.");
  }

  const submittedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (!hasSmtpConfig()) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[DEV SUPPORT] ${submittedAt} | ${safeName} <${safeEmail}> | ${safeCategory} | ${safeSubject}\n${safeMessage}`,
      );
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
    to: supportInbox,
    replyTo: safeEmail,
    subject: `[PunchPilot Support] ${safeCategory} • ${safeSubject}`,
    text: `Support query received\n\nName: ${safeName}\nEmail: ${safeEmail}\nCategory: ${safeCategory}\nSubmitted: ${submittedAt}\n\nMessage:\n${safeMessage}`,
    html: emailWrapper(`
      <div style="margin:0;padding:28px;background:#f4f8ff;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;">
          <tr>
            <td style="padding:0;">
              <div style="border-radius:16px;overflow:hidden;border:1px solid #155e75;background-color:#0f172a;background-image:linear-gradient(135deg,#0b1220 0%,#0f172a 30%,#155e75 68%,#0d9488 100%);padding:18px 20px;color:#ecfeff !important;-webkit-text-fill-color:#ecfeff !important;">
                <div style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#a5f3fc;-webkit-text-fill-color:#a5f3fc;font-weight:800;">PunchPilot</div>
                <div style="margin-top:10px;font-size:22px;line-height:1.2;color:#ecfeff;-webkit-text-fill-color:#ecfeff;font-weight:800;">New Support Query</div>
                <div style="margin-top:6px;font-size:14px;color:#cffafe;-webkit-text-fill-color:#cffafe;">Submitted from the PunchPilot support form.</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:14px;">
              <div style="border:1px solid #dbeafe;border-radius:16px;background:#ffffff;padding:20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
                  <tr>
                    <td style="font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:#64748b;font-weight:700;width:120px;">Name</td>
                    <td style="font-size:15px;color:#0f172a;font-weight:600;">${safeName}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:#64748b;font-weight:700;">Email</td>
                    <td style="font-size:15px;color:#0f172a;font-weight:600;">${safeEmail}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:#64748b;font-weight:700;">Category</td>
                    <td style="font-size:15px;color:#0f172a;font-weight:600;">${safeCategory}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:#64748b;font-weight:700;">Subject</td>
                    <td style="font-size:15px;color:#0f172a;font-weight:600;">${safeSubject}</td>
                  </tr>
                  <tr>
                    <td style="font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:#64748b;font-weight:700;">Submitted</td>
                    <td style="font-size:14px;color:#334155;">${submittedAt}</td>
                  </tr>
                </table>
                <div style="margin-top:14px;border:1px solid #bae6fd;border-radius:12px;background:linear-gradient(180deg,#ecfeff 0%,#f8fafc 100%);padding:14px 16px;">
                  <div style="font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:#0f766e;font-weight:700;">Message</div>
                  <p style="margin:8px 0 0 0;font-size:14px;line-height:1.6;color:#0f172a;-webkit-text-fill-color:#0f172a;white-space:pre-wrap;">${safeMessage}</p>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px;text-align:center;font-size:12px;color:#64748b;">
              Reply directly to this email to respond to the user.
            </td>
          </tr>
        </table>
      </div>
    `),
  });

  return { devMode: false };
}

export async function sendMonthlySummaryEmail({
  to,
  name,
  month,
  totalWorkedHoursDecimal,
  hourlyRate,
  grossPayEstimate,
}: {
  to: string;
  name?: string | null;
  month: string;
  totalWorkedHoursDecimal: number;
  hourlyRate: number;
  grossPayEstimate: number;
}) {
  const safeName = escapeHtml((name || "there").trim());
  const safeMonth = escapeHtml(month);
  const dashboardUrl = `${getAppBaseUrl()}/dashboard`;
  const settingsUrl = `${getAppBaseUrl()}/settings`;

  if (!hasSmtpConfig()) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[DEV MONTHLY SUMMARY] ${to} | ${month} | hours=${totalWorkedHoursDecimal} | rate=${hourlyRate} | gross=${grossPayEstimate}`,
      );
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

  const summaryText = [
    `PunchPilot monthly summary (${month})`,
    "",
    `Total worked hours: ${totalWorkedHoursDecimal.toFixed(2)}`,
    `Hourly rate: $${hourlyRate.toFixed(2)}`,
    `Estimated gross pay: $${grossPayEstimate.toFixed(2)}`,
    "",
    "Note: this is a gross estimate before tax/deduction withholding.",
  ].join("\n");

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `PunchPilot Monthly Summary • ${month}`,
    text: summaryText,
    html: emailWrapper(`
      <div style="margin:0;padding:28px;background:#f4f8ff;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;">
          <tr>
            <td style="padding:0;">
              <div style="border-radius:16px;overflow:hidden;border:1px solid #155e75;background-color:#0f172a;background-image:linear-gradient(135deg,#0b1220 0%,#0f172a 30%,#155e75 68%,#0d9488 100%);padding:18px 20px;color:#ecfeff !important;-webkit-text-fill-color:#ecfeff !important;">
                <div style="display:inline-block;border-radius:10px;background:linear-gradient(120deg,rgba(2,6,23,0.44)_0%,rgba(2,6,23,0.24)_65%,rgba(2,6,23,0.08)_100%);padding:8px 10px;">
                  <div style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#a5f3fc !important;-webkit-text-fill-color:#a5f3fc !important;font-weight:800;">PunchPilot</div>
                  <div style="margin-top:10px;font-size:22px;line-height:1.2;color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;font-weight:900;text-shadow:0 1px 1px rgba(0,0,0,0.35);">Monthly Work + Pay Summary</div>
                  <div style="margin-top:6px;font-size:14px;color:#d1fae5 !important;-webkit-text-fill-color:#d1fae5 !important;font-weight:600;">${safeMonth} • Role-based timesheet snapshot</div>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:14px;">
              <div style="border:1px solid #dbeafe;border-radius:16px;background:#ffffff;padding:20px;">
                <p style="margin:0 0 14px 0;font-size:14px;line-height:1.45;color:#334155;-webkit-text-fill-color:#334155;">Hi ${safeName}, here is your monthly estimate from PunchPilot.</p>
                <div style="border:1px solid #dbeafe;border-radius:12px;background:#f8fafc;padding:12px;">
                  <div style="padding:8px 0;border-bottom:1px solid #e2e8f0;">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:#64748b;font-weight:700;">Total Worked Hours</div>
                    <div style="margin-top:4px;font-size:24px;line-height:1.2;color:#0f172a;font-weight:800;">${totalWorkedHoursDecimal.toFixed(2)} hrs</div>
                  </div>
                  <div style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:#64748b;font-weight:700;">Hourly Rate</div>
                    <div style="margin-top:4px;font-size:20px;line-height:1.2;color:#0f172a;font-weight:700;">$${hourlyRate.toFixed(2)}</div>
                  </div>
                  <div style="padding:10px 0 2px 0;">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:#64748b;font-weight:700;">Estimated Gross Pay</div>
                    <div style="margin-top:4px;font-size:34px;line-height:1.1;color:#065f46;font-weight:900;">$${grossPayEstimate.toFixed(2)}</div>
                  </div>
                </div>
                <div style="margin-top:14px;border:1px solid #bae6fd;border-radius:12px;background:#f8fafc;padding:14px 16px;">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#0f172a;-webkit-text-fill-color:#0f172a;">
                    This is an estimate based on your recorded worked hours and hourly rate.
                    Taxes and payroll deductions are not included in this gross figure.
                  </p>
                </div>
                <div style="margin-top:16px;">
                  <a href="${dashboardUrl}" style="display:block;width:100%;box-sizing:border-box;text-align:center;padding:11px 14px;border-radius:10px;background:#0ea5e9;color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;text-decoration:none;font-weight:700;margin:0 0 8px 0;">
                    Open Dashboard
                  </a>
                  <a href="${settingsUrl}" style="display:block;width:100%;box-sizing:border-box;text-align:center;padding:11px 14px;border-radius:10px;background:#e2e8f0;color:#0f172a !important;-webkit-text-fill-color:#0f172a !important;text-decoration:none;font-weight:700;">
                    Update Hourly Rate
                  </a>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `),
  });

  return { devMode: false };
}
