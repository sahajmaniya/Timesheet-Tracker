import { z } from "zod";
import { weekdayKeys } from "@/lib/work-schedule";

const hhmmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const breakSchema = z.object({
  id: z.string().optional(),
  start: z.string().regex(hhmmRegex, "Time must be HH:mm"),
  end: z.string().regex(hhmmRegex, "Time must be HH:mm"),
});

export const timeEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  punchIn: z.string().regex(hhmmRegex, "Time must be HH:mm"),
  punchOut: z.string().regex(hhmmRegex, "Time must be HH:mm"),
  notes: z.string().max(2000).optional().nullable(),
  breaks: z.array(breakSchema),
});

const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/, "Must include an uppercase letter")
  .regex(/[a-z]/, "Must include a lowercase letter")
  .regex(/\d/, "Must include a number");

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20),
  password: passwordSchema,
});

export const monthQuerySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM");

const calibrationRange = z.number().min(-120).max(120);
export const timesheetCalibrationSchema = z.object({
  shiftX: calibrationRange.default(0),
  shiftY: calibrationRange.default(0),
  totalsShiftX: calibrationRange.default(0),
  totalsShiftY: calibrationRange.default(0),
  signatureShiftX: calibrationRange.default(0),
  signatureShiftY: calibrationRange.default(0),
  dateShiftX: calibrationRange.default(0),
  dateShiftY: calibrationRange.default(0),
});

const dayScheduleSchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(hhmmRegex, "Time must be HH:mm"),
  end: z.string().regex(hhmmRegex, "Time must be HH:mm"),
  breakStart: z.string().regex(hhmmRegex, "Time must be HH:mm"),
  breakEnd: z.string().regex(hhmmRegex, "Time must be HH:mm"),
});

export const workScheduleSchema = z.object({
  sun: dayScheduleSchema,
  mon: dayScheduleSchema,
  tue: dayScheduleSchema,
  wed: dayScheduleSchema,
  thu: dayScheduleSchema,
  fri: dayScheduleSchema,
  sat: dayScheduleSchema,
}).superRefine((value, ctx) => {
  for (const key of weekdayKeys) {
    const day = value[key];
    if (!day.enabled) continue;

    if (day.start >= day.end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key, "end"],
        message: "End time must be after start time",
      });
    }

    if (day.breakStart >= day.breakEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key, "breakEnd"],
        message: "Break end must be after break start",
      });
    }
  }
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  image: z
    .string()
    .trim()
    .refine(
      (value) =>
        value.length === 0 ||
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:image/"),
      "Profile image must be a valid URL or uploaded image data",
    )
    .optional()
    .or(z.literal("")),
  signature: z
    .string()
    .trim()
    .refine(
      (value) =>
        value.length === 0 ||
        value.startsWith("data:image/png;base64,") ||
        value.startsWith("data:image/jpeg;base64,"),
      "Signature must be a valid drawn signature image",
    )
    .optional()
    .or(z.literal("")),
  workSchedule: workScheduleSchema.optional(),
});

export type TimeEntryInput = z.infer<typeof timeEntrySchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type TimesheetCalibrationInput = z.infer<typeof timesheetCalibrationSchema>;
