import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import type { Break } from "@prisma/client";
import { calcWorkedMinutes, minutesToTenthsDecimal } from "@/lib/time";
import { getTimesheetTemplate, type TimesheetRole } from "@/lib/timesheet-templates";

type EntryForPdf = {
  date: string;
  punchIn: string;
  punchOut: string;
  breaks: Break[];
};

export type TimesheetLayoutMode = "auto" | "standard" | "carry";
export type TimesheetCalibration = {
  shiftX: number;
  shiftY: number;
  totalsShiftX: number;
  totalsShiftY: number;
  signatureShiftX: number;
  signatureShiftY: number;
  dateShiftX: number;
  dateShiftY: number;
};

export const DEFAULT_TIMESHEET_CALIBRATION: TimesheetCalibration = {
  shiftX: 0,
  shiftY: 0,
  totalsShiftX: 0,
  totalsShiftY: 0,
  signatureShiftX: 0,
  signatureShiftY: 0,
  dateShiftX: 0,
  dateShiftY: 0,
};

type TemplateDateCell = {
  date: string;
  x: number;
  y: number;
  week: number;
  weekday: number;
};


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

function buildMonthGridCells({
  month,
  layoutMode,
  gridXByWeekday,
  firstWeekY,
  weekYStep,
}: {
  month: string;
  layoutMode: TimesheetLayoutMode;
  gridXByWeekday: [number, number, number, number, number, number, number];
  firstWeekY: number;
  weekYStep: number;
}): TemplateDateCell[] {
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
    const x = gridXByWeekday[weekday] ?? gridXByWeekday[0];
    const y = firstWeekY - week * weekYStep;

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
  role,
  calibration,
}: {
  templateBytes: Uint8Array;
  month: string;
  entries: EntryForPdf[];
  employeeName: string;
  signatureDataUrl?: string | null;
  generatedDate: string;
  layoutMode: TimesheetLayoutMode;
  role: TimesheetRole;
  calibration?: Partial<TimesheetCalibration> | null;
}) {
  const activeCalibration: TimesheetCalibration = {
    ...DEFAULT_TIMESHEET_CALIBRATION,
    ...(calibration ?? {}),
  };
  const template = getTimesheetTemplate(role);
  const isIsaRole = role === "instructional_student_assistant";
  const useBreakSplitRows = template.hoursRenderMode === "split_by_break";
  const showInOutTimes = useBreakSplitRows;
  const showWeeklyTotals = useBreakSplitRows;
  const useFixedDaySlots = Boolean(template.layout.fixedDaySlotMapping?.enabled);
  const cells = buildMonthGridCells({
    month,
    layoutMode,
    gridXByWeekday: template.layout.gridXByWeekday,
    firstWeekY: template.layout.firstWeekY,
    weekYStep: template.layout.weekYStep,
  });

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

  const getFixedDaySlot = (date: string) => {
    const fixed = template.layout.fixedDaySlotMapping;
    if (!fixed?.enabled) return null;
    const day = Number(date.slice(-2));
    if (!Number.isFinite(day) || day < 1 || day > 31) return null;

    let columnIndex = 0;
    let rowIndex = 0;
    if (day <= 10) {
      columnIndex = 0;
      rowIndex = day;
    } else if (day <= 21) {
      columnIndex = 1;
      rowIndex = day - 11;
    } else {
      columnIndex = 2;
      rowIndex = day - 22;
    }

    const baseX = fixed.columnBaseX[columnIndex];
    const textY = fixed.firstRowTextY - rowIndex * fixed.rowStepY;
    return { baseX, textY };
  };

  for (const entry of entries) {
    const fixedSlot = useFixedDaySlots ? getFixedDaySlot(entry.date) : null;
    const cell = fixedSlot ? { x: fixedSlot.baseX, y: fixedSlot.textY - template.layout.topRowOffsetY, week: 0 } : cells.find((item) => item.date === entry.date);
    if (!cell) continue;

    const safeBreaks = entry.breaks.filter((item) => isHHmm(item.start) && isHHmm(item.end));
    const workedMinutesTotal = calcWorkedMinutes({
      punchIn: entry.punchIn,
      punchOut: entry.punchOut,
      breaks: safeBreaks,
    });
    const lunch = useBreakSplitRows ? pickLunchBreak(safeBreaks) : undefined;

    const topIn = entry.punchIn;
    const topOut = lunch?.start ?? entry.punchOut;
    const topWorked = lunch ? minutesBetweenHHmm(entry.punchIn, lunch.start) : workedMinutesTotal;

    const bottomIn = lunch?.end ?? "";
    const bottomOut = lunch ? entry.punchOut : "";
    const dayTenths = minutesToTenthsDecimal(workedMinutesTotal);
    const topTenths = lunch ? minutesToTenthsDecimal(topWorked) : dayTenths;
    const bottomTenths = lunch ? Math.max(0, Number((dayTenths - topTenths).toFixed(1))) : 0;
    if (!useFixedDaySlots) {
      weeklyTenthsByWeek.set(cell.week, (weeklyTenthsByWeek.get(cell.week) ?? 0) + dayTenths);
    }
    monthlyTenths += dayTenths;

    // Template row layout:
    // - date/day row in the middle
    // - first (top) work segment above that row
    // - second (bottom) work segment below that row
    const topY = fixedSlot
      ? fixedSlot.textY + activeCalibration.shiftY
      : (cell.y + template.layout.topRowOffsetY) * yScale + activeCalibration.shiftY;
    const bottomY = (cell.y + template.layout.bottomRowOffsetY) * yScale + activeCalibration.shiftY;
    const textSize = fixedSlot
      ? 10.1
      : (role === "instructional_student_assistant" ? 10.1 : 7.8) * yScale;
    const inCenterX = fixedSlot
      ? cell.x + template.layout.inOffsetX + activeCalibration.shiftX
      : (cell.x + template.layout.inOffsetX) * xScale + activeCalibration.shiftX;
    const outCenterX = fixedSlot
      ? cell.x + template.layout.outOffsetX + activeCalibration.shiftX
      : (cell.x + template.layout.outOffsetX) * xScale + activeCalibration.shiftX;
    const hoursCenterX = fixedSlot
      ? cell.x + template.layout.hoursOffsetX + activeCalibration.shiftX
      : (cell.x + template.layout.hoursOffsetX) * xScale + activeCalibration.shiftX;
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

    if (showInOutTimes) {
      drawCenteredAt({ text: to12hNoMeridiem(topIn), centerX: inCenterX, y: topY });
      drawCenteredAt({ text: to12hNoMeridiem(topOut), centerX: outCenterX, y: topY });
    }
    drawCenteredAt({ text: topTenths.toFixed(1), centerX: hoursCenterX, y: topY, textFont: bold });

    if (showInOutTimes && useBreakSplitRows && bottomIn && bottomOut) {
      drawCenteredAt({ text: to12hNoMeridiem(bottomIn), centerX: inCenterX, y: bottomY });
      drawCenteredAt({ text: to12hNoMeridiem(bottomOut), centerX: outCenterX, y: bottomY });
      drawCenteredAt({ text: bottomTenths.toFixed(1), centerX: hoursCenterX, y: bottomY, textFont: bold });
    }
  }

  // Weekly totals column (right side).
  const weeklyX = template.layout.weeklyTotalX * xScale + activeCalibration.shiftX + activeCalibration.totalsShiftX;
  if (showWeeklyTotals) {
    for (const [week, weeklyTenths] of weeklyTenthsByWeek.entries()) {
      const weeklyY =
        (template.layout.firstWeekY - week * template.layout.weekYStep + template.layout.weeklyTotalOffsetY) * yScale +
        activeCalibration.shiftY +
        activeCalibration.totalsShiftY;
      drawText({
        text: weeklyTenths.toFixed(1),
        x: weeklyX,
        y: weeklyY,
        size: 9.2 * yScale,
        drawFont: bold,
        drawColor: color,
      });
    }
  }

  const monthlyText = monthlyTenths.toFixed(1);
  if (isIsaRole) {
    // ISA sheets typically expose two total fields:
    // 1) TOTAL REGULAR HOURS WORKED (upper total box)
    // 2) TOTAL HOURS WORKED (bottom blue total box)
    // We render the same monthly total into both fixed coordinates.
    const isaTotalCenters = [
      { x: 540.52, y: 231.96 },
      { x: 540.52, y: 93.24 },
    ];
    for (const target of isaTotalCenters) {
      const w = bold.widthOfTextAtSize(monthlyText, 10);
      drawText({
        text: monthlyText,
        x: target.x - w / 2 + activeCalibration.shiftX + activeCalibration.totalsShiftX,
        y: target.y + activeCalibration.shiftY + activeCalibration.totalsShiftY,
        size: 10,
        drawFont: bold,
        drawColor: color,
      });
    }
  } else {
    // Monthly total inside the "TOTAL HOURS" value box.
    const monthlyTotalCenterX = weeklyX;
    const monthlyTotalY = template.layout.monthlyTotalY * yScale;
    const monthlyTextWidth = bold.widthOfTextAtSize(monthlyText, 10 * yScale);
    drawText({
      text: monthlyText,
      x: monthlyTotalCenterX - monthlyTextWidth / 2,
      y: monthlyTotalY + activeCalibration.shiftY + activeCalibration.totalsShiftY,
      size: 10 * yScale,
      drawFont: bold,
      drawColor: color,
    });
  }

  // Signature + date row in footer.
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
      const boxX = isIsaRole ? 100 : template.layout.signatureBox.x * xScale;
      const boxY = isIsaRole ? 101 : template.layout.signatureBox.y * yScale;
      const boxWidth = isIsaRole ? 120 : template.layout.signatureBox.width * xScale;
      const boxHeight = isIsaRole ? 25 : template.layout.signatureBox.height * yScale;
      const scale = Math.min(boxWidth / embedded.width, boxHeight / embedded.height);
      const drawWidth = embedded.width * scale;
      const drawHeight = embedded.height * scale;
      const drawX = boxX + (boxWidth - drawWidth) / 2;
      const drawY = boxY + (boxHeight - drawHeight) / 2;

      page.drawImage(embedded, {
        x: drawX + activeCalibration.signatureShiftX,
        y: drawY + activeCalibration.signatureShiftY,
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
      x: (isIsaRole ? 120 : template.layout.typedSignature.x * xScale) + activeCalibration.signatureShiftX,
      y: (isIsaRole ? 116.4 : template.layout.typedSignature.y * yScale) + activeCalibration.signatureShiftY,
      size: isIsaRole ? 11 : 11 * yScale,
      drawFont: signatureFont,
      drawColor: rgb(0.03, 0.09, 0.24),
      extraRotateDeg: template.layout.typedSignature.rotateDeg,
    });
  }

  if (isIsaRole) {
    const dateSize = 10.18;
    const dateCenter = 277.06;
    const dateY = 115.44;
    const dateWidth = bold.widthOfTextAtSize(generatedDate, dateSize);
    drawText({
      text: generatedDate,
      x: dateCenter - dateWidth / 2 + activeCalibration.dateShiftX,
      y: dateY + activeCalibration.dateShiftY,
      size: dateSize,
      drawFont: bold,
      drawColor: color,
    });
  } else {
    for (const dateCenter of template.layout.generatedDateCenters) {
      const dateSize = 9.2 * yScale;
      const dateY = template.layout.generatedDateY * yScale;
      const dateWidth = bold.widthOfTextAtSize(generatedDate, dateSize);
      drawText({
        text: generatedDate,
        x: dateCenter * xScale - dateWidth / 2 + activeCalibration.dateShiftX,
        y: dateY + activeCalibration.dateShiftY,
        size: dateSize,
        drawFont: bold,
        drawColor: color,
      });
    }
  }

  return pdfDoc.save();
}
