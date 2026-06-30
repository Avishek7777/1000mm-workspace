import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert a number to its ordinal string: 1 → "1st", 2 → "2nd", 29 → "29th" */
export function ordinal(n: number): string {
  const abs = Math.abs(n);
  const mod100 = abs % 100;
  const mod10 = abs % 10;
  let suffix: string;
  if (mod100 >= 11 && mod100 <= 13) {
    suffix = "th";
  } else if (mod10 === 1) {
    suffix = "st";
  } else if (mod10 === 2) {
    suffix = "nd";
  } else if (mod10 === 3) {
    suffix = "rd";
  } else {
    suffix = "th";
  }
  return `${n}${suffix}`;
}
