import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Profile photos are linked from the sign-in provider only; anything else (old uploaded data URLs) is ignored. */
export function profilePhotoUrl(image?: string | null) {
  return image && /^https?:\/\//.test(image) ? image : null
}
