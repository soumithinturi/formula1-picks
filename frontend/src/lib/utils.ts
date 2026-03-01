import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CONSTRUCTOR_COLORS = {
  RED_BULL: "#3671C6",
  FERRARI: "#E80020",
  MCLAREN: "#FF8000",
  MERCEDES: "#27F4D2",
  ASTON_MARTIN: "#229971",
  ALPINE: "#FF87BC",
  WILLIAMS: "#64C4FF",
  RB: "#6692FF",
  SAUBER: "#F9004B",
  HAAS: "#B6BABD",
  CADILLAC: "#FEAA00",
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
