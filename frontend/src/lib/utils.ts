import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CONSTRUCTOR_COLORS = {
  RED_BULL: "#3671C6",
  FERRARI: "#5c0012",
  MCLAREN: "#ff8000",
  MERCEDES: "#27f4d2",
  ASTON_MARTIN: "#229971",
  ALPINE: "#ff87bc",
  WILLIAMS: "#1868db",
  RB: "#6692ff",
  AUDI: "#ff2d00",
  HAAS: "#667175",
  CADILLAC: "#feaa00",
} as const;

export const safeStorage = {
  getItem: (key: string) => {
    try {
      return typeof window !== "undefined" ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== "undefined") localStorage.setItem(key, value);
    } catch { }
  },
  removeItem: (key: string) => {
    try {
      if (typeof window !== "undefined") localStorage.removeItem(key);
    } catch { }
  }
};
