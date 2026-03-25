type DownloadKind = "timesheet_csv" | "timesheet_filled_pdf";

const DOWNLOAD_KIND_LABELS: Record<DownloadKind, string> = {
  timesheet_csv: "Timesheet_Entries",
  timesheet_filled_pdf: "Timesheet_Filled",
};

function sanitizePart(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "");
}

export function buildDownloadFilename({
  kind,
  month,
  extension,
}: {
  kind: DownloadKind;
  month: string;
  extension: "csv" | "pdf";
}) {
  const safeMonth = sanitizePart(month);
  const safeLabel = sanitizePart(DOWNLOAD_KIND_LABELS[kind]);
  return `PunchPilot_${safeLabel}_${safeMonth}.${extension}`;
}

export function getFilenameFromContentDisposition(headerValue: string | null) {
  if (!headerValue) return null;

  const starMatch = headerValue.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (starMatch?.[1]) {
    try {
      return decodeURIComponent(starMatch[1]).replaceAll('"', "").trim();
    } catch {
      return starMatch[1].replaceAll('"', "").trim();
    }
  }

  const match = headerValue.match(/filename\s*=\s*("?)([^";]+)\1/i);
  return match?.[2]?.trim() || null;
}
