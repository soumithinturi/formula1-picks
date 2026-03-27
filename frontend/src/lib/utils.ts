import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CONSTRUCTOR_COLORS = {
  RED_BULL: "#3671c6",
  FERRARI: "#7a120c",
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

export function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
