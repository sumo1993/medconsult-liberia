import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Client-side fetch failures: log in development only so production Lighthouse is not penalized for `console.error`. */
export function devLogError(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.error(...args)
  }
}
