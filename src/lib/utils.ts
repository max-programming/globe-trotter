import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toUtcDate = (value: Date) => {
  // Interpret provided Date's local calendar date as the intended date
  const y = value.getFullYear();
  const m = value.getMonth();
  const d = value.getDate();
  return new Date(Date.UTC(y, m, d));
};

export const formatYmd = (dt: Date) => dt.toISOString().slice(0, 10);
