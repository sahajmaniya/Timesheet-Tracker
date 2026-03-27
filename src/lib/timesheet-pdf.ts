import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import type { Break } from "@prisma/client";
import { calcWorkedMinutes, minutesToTenthsDecimal } from "@/lib/time";

type EntryForPdf = {
  date: string;
  punchIn: string;
  punchOut: string;
  breaks: Break[];
};

export type TimesheetLayoutMode = "auto" | "standard" | "carry";

type TemplateDateCell = {
  date: string;
  x: number;
  y: number;
  week: number;
  weekday: number;
};

const GRID_X_BY_WEEKDAY = [69, 159, 249, 339, 429, 519, 609];
const FIRST_WEEK_Y = 416;
const WEEK_Y_STEP = 55;

function to12hNoMeridiem(timeHHmm: string) {
  const [hhRaw, mmRaw] = timeHHmm.split(":").map(Number);
  const hh = ((hhRaw + 11) % 12) + 1;
  if (mmRaw === 0) return String(hh);
  return `${hh}:${String(mmRaw).padStart(2, "0")}`;
}

function isHHmm(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
}

function minutesBetweenHHmm(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

function pickLunchBreak(breaks: Break[]) {
  return breaks
    .filter((item) => isHHmm(item.start) && isHHmm(item.end))
    .sort((a, b) => a.start.localeCompare(b.start))[0];
}

function getWeekRowOffset({
  firstWeekday,
  daysInMonth,
  layoutMode,
}: {
  firstWeekday: number;
  daysInMonth: number;
  layoutMode: TimesheetLayoutMode;
}) {
  if (layoutMode === "standard") return 0;
  if (layoutMode === "carry") return 1;

  // Auto mode: Some CSULB templates include a leading previous-month partial row
  // (observed on Feb 2026), while others (e.g., Mar 2026) do not.
  return firstWeekday === 0 && daysInMonth === 28 ? 1 : 0;
}

function buildMonthGridCells(month: string, layoutMode: TimesheetLayoutMode): TemplateDateCell[] {
  const [yearRaw, monthRaw] = month.split("-").map(Number);
  const year = yearRaw;
  const monthIndex = monthRaw - 1;
  const daysInMonth = new Date(year, monthRaw, 0).getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay(); // 0=Sunday
  const weekRowOffset = getWeekRowOffset({ firstWeekday, daysInMonth, layoutMode });

  const cells: TemplateDateCell[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const linearIndex = firstWeekday + (day - 1);
    const week = Math.floor(linearIndex / 7) + weekRowOffset;
    const weekday = linearIndex % 7;
    const x = GRID_X_BY_WEEKDAY[weekday] ?? GRID_X_BY_WEEKDAY[0];
    const y = FIRST_WEEK_Y - week * WEEK_Y_STEP;

    cells.push({
      date: `${month}-${String(day).padStart(2, "0")}`,
      x,
      y,
      week,
      weekday,
    });
  }
  return cells;
}

export async function fillTimesheetPdfTemplate({
  templateBytes,
  month,
  entries,
  employeeName,
  signatureDataUrl,
  generatedDate,
  layoutMode,
}: {
  templateBytes: Uint8Array;
  month: string;
  entries: EntryForPdf[];
  employeeName: string;
  signatureDataUrl?: string | null;
  generatedDate: string;
  layoutMode: TimesheetLayoutMode;
}) {
  const cells = buildMonthGridCells(month, layoutMode);

  const entryMap = new Map(entries.map((entry) => [entry.date, entry]));

  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const page = pdfDoc.getPage(0);
  const { width, height } = page.getSize();
  const pageRotation = ((page.getRotation().angle % 360) + 360) % 360;
  const logicalWidth = pageRotation === 90 || pageRotation === 270 ? height : width;
  const logicalHeight = pageRotation === 90 || pageRotation === 270 ? width : height;
  const xScale = logicalWidth / 792;
  const yScale = logicalHeight / 612;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const signatureFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const color = rgb(0.05, 0.11, 0.2);
  const mapPointAndRotation = (x: number, y: number, extraRotateDeg = 0) => {
    switch (pageRotation) {
      case 90:
        return { x: width - y, y: x, rotate: degrees(90 + extraRotateDeg) };
      case 270:
        return { x: y, y: height - x, rotate: degrees(-90 + extraRotateDeg) };
      case 180:
        return { x: width - x, y: height - y, rotate: degrees(180 + extraRotateDeg) };
      default:
        return { x, y, rotate: degrees(extraRotateDeg) };
    }
  };
  const drawText = ({
    text,
    x,
    y,
    size,
    drawFont,
    drawColor,
    extraRotateDeg = 0,
  }: {
    text: string;
    x: number;
    y: number;
    size: number;
    drawFont: typeof font;
    drawColor: ReturnType<typeof rgb>;
    extraRotateDeg?: number;
  }) => {
    const mapped = mapPointAndRotation(x, y, extraRotateDeg);
    page.drawText(text, {
      x: mapped.x,
      y: mapped.y,
      size,
      font: drawFont,
      color: drawColor,
      rotate: mapped.rotate,
    });
  };
  const weeklyTenthsByWeek = new Map<number, number>();
  let monthlyTenths = 0;

  for (const cell of cells) {
    const entry = entryMap.get(cell.date);
    if (!entry) continue;

    const safeBreaks = entry.breaks.filter((item) => isHHmm(item.start) && isHHmm(item.end));
    const workedMinutesTotal = calcWorkedMinutes({
      punchIn: entry.punchIn,
      punchOut: entry.punchOut,
      breaks: safeBreaks,
    });
    const lunch = pickLunchBreak(safeBreaks);

    const topIn = entry.punchIn;
    const topOut = lunch?.start ?? entry.punchOut;
    const topWorked = lunch
      ? minutesBetweenHHmm(entry.punchIn, lunch.start)
      : workedMinutesTotal;

    const bottomIn = lunch?.end ?? "";
    const bottomOut = lunch ? entry.punchOut : "";
    const dayTenths = minutesToTenthsDecimal(workedMinutesTotal);
    const topTenths = lunch ? minutesToTenthsDecimal(topWorked) : dayTenths;
    const bottomTenths = lunch ? Math.max(0, Number((dayTenths - topTenths).toFixed(1))) : 0;
    weeklyTenthsByWeek.set(cell.week, (weeklyTenthsByWeek.get(cell.week) ?? 0) + dayTenths);
    monthlyTenths += dayTenths;

    // Template row layout:
    // - date/day row in the middle
    // - first (top) work segment above that row
    // - second (bottom) work segment below that row
    const topY = (cell.y + 14) * yScale;
    const bottomY = (cell.y - 22) * yScale;
    const textSize = 7.8 * yScale;
    const inCenterX = (cell.x + 12) * xScale;
    const outCenterX = (cell.x + 36) * xScale;
    const hoursCenterX = (cell.x + 63) * xScale;
    const drawCenteredAt = ({
      text,
      centerX,
      y,
      textFont = font,
    }: {
      text: string;
      centerX: number;
      y: number;
      textFont?: typeof font;
    }) => {
      const textWidth = textFont.widthOfTextAtSize(text, textSize);
      const centeredX = centerX - textWidth / 2;
      drawText({
        text,
        x: centeredX,
        y,
        size: textSize,
        drawFont: textFont,
        drawColor: color,
      });
    };

    drawCenteredAt({ text: to12hNoMeridiem(topIn), centerX: inCenterX, y: topY });
    drawCenteredAt({ text: to12hNoMeridiem(topOut), centerX: outCenterX, y: topY });
    drawCenteredAt({ text: topTenths.toFixed(1), centerX: hoursCenterX, y: topY, textFont: bold });

    if (bottomIn && bottomOut) {
      drawCenteredAt({ text: to12hNoMeridiem(bottomIn), centerX: inCenterX, y: bottomY });
      drawCenteredAt({ text: to12hNoMeridiem(bottomOut), centerX: outCenterX, y: bottomY });
      drawCenteredAt({ text: bottomTenths.toFixed(1), centerX: hoursCenterX, y: bottomY, textFont: bold });
    }
  }

  // Weekly totals column (right side).
  const weeklyX = 724 * xScale;
  for (const [week, weeklyTenths] of weeklyTenthsByWeek.entries()) {
    const weeklyY = (FIRST_WEEK_Y - week * WEEK_Y_STEP - 2) * yScale;
    drawText({
      text: weeklyTenths.toFixed(1),
      x: weeklyX,
      y: weeklyY,
      size: 9.2 * yScale,
      drawFont: bold,
      drawColor: color,
    });
  }

  // Monthly total inside the "TOTAL HOURS" value box.
  const monthlyTotalCenterX = weeklyX;
  const monthlyTotalY = 92 * yScale;
  const monthlyText = monthlyTenths.toFixed(1);
  const monthlyTextWidth = bold.widthOfTextAtSize(monthlyText, 10 * yScale);
  drawText({
    text: monthlyText,
    x: monthlyTotalCenterX - monthlyTextWidth / 2,
    y: monthlyTotalY,
    size: 10 * yScale,
    drawFont: bold,
    drawColor: color,
  });

  // Signature + date row in footer.
  const signatureTextY = 49 * yScale;
  const drawSignatureImage = async () => {
    if (!signatureDataUrl?.startsWith("data:image/")) return false;
    const commaIndex = signatureDataUrl.indexOf(",");
    if (commaIndex < 0) return false;
    const meta = signatureDataUrl.slice(0, commaIndex).toLowerCase();
    const base64 = signatureDataUrl.slice(commaIndex + 1);
    if (!base64) return false;

    try {
      const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
      const embedded = meta.includes("image/png")
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);

      // Keep signature image constrained inside the employee-signature area.
      // This makes placement stable regardless of signature length/shape.
      const boxX = -10 * xScale;
      const boxY = 55 * yScale;
      const boxWidth = 220 * xScale;
      const boxHeight = 20 * yScale;
      const scale = Math.min(boxWidth / embedded.width, boxHeight / embedded.height);
      const drawWidth = embedded.width * scale;
      const drawHeight = embedded.height * scale;
      const drawX = boxX + (boxWidth - drawWidth) / 2;
      const drawY = boxY + (boxHeight - drawHeight) / 2;

      page.drawImage(embedded, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
      return true;
    } catch {
      return false;
    }
  };

  const hasDrawnSignature = await drawSignatureImage();
  const signatureText = employeeName.trim();
  if (!hasDrawnSignature && signatureText) {
    drawText({
      text: signatureText,
      x: 28 * xScale,
      y: signatureTextY,
      size: 11 * yScale,
      drawFont: signatureFont,
      drawColor: rgb(0.03, 0.09, 0.24),
      extraRotateDeg: -2,
    });
  }

  const dateCenters = [200];
  for (const dateCenter of dateCenters) {
    const dateSize = 9.2 * yScale;
    const dateY = 65 * yScale;
    const dateWidth = bold.widthOfTextAtSize(generatedDate, dateSize);
    drawText({
      text: generatedDate,
      x: dateCenter * xScale - dateWidth / 2,
      y: dateY,
      size: dateSize,
      drawFont: bold,
      drawColor: color,
    });
  }

  return pdfDoc.save();
}
