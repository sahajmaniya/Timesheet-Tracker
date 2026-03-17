import { z } from "zod";

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

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/\d/, "Must include a number"),
});

export const monthQuerySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM");

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
});

export type TimeEntryInput = z.infer<typeof timeEntrySchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
