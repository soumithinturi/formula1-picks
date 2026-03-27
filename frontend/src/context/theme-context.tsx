import React, { createContext, useContext, useEffect, useState } from "react";
import { CONSTRUCTOR_COLORS, safeStorage } from "@/lib/utils";
import { api } from "@/lib/api";

export type Team = {
  id: string;
  name: string;
  themeName: string;
  primaryColor: string; // Hex Fallback
  primaryForeground: string; // Hex Fallback
  oklch: { l: string; c: string; h: string }; // New Generative Oklch tokens
};

export const TEAMS: Team[] = [
  {
    id: "default",
    name: "Independent",
    themeName: "F1 (Default)",
    primaryColor: "#e10600",
    primaryForeground: "#ffffff",
    oklch: { l: "0.573", c: "0.233", h: "29.5" },
  },
  {
    id: "redbull",
    themeName: "Red Bull Blue",
    name: "Red Bull",
    primaryColor: CONSTRUCTOR_COLORS.RED_BULL,
    primaryForeground: "#ffffff",
    oklch: { l: "0.553", c: "0.146", h: "257.9" },
  },
  {
    id: "ferrari",
    themeName: "Ferrari Red",
    name: "Ferrari",
    primaryColor: CONSTRUCTOR_COLORS.FERRARI,
    primaryForeground: "#ffffff",
    oklch: { l: "0.375", c: "0.139", h: "29.1" },
  },
  {
    id: "mclaren",
    themeName: "McLaren Papaya",
    name: "McLaren",
    primaryColor: CONSTRUCTOR_COLORS.MCLAREN,
    primaryForeground: "#000000",
    oklch: { l: "0.732", c: "0.186", h: "53.0" },
  },
  {
    id: "mercedes",
    themeName: "Mercedes Teal",
    name: "Mercedes",
    primaryColor: CONSTRUCTOR_COLORS.MERCEDES,
    primaryForeground: "#000000",
    oklch: { l: "0.867", c: "0.155", h: "177.3" },
  },
  {
    id: "astonmartin",
    themeName: "Aston Martin Green",
    name: "Aston Martin",
    primaryColor: CONSTRUCTOR_COLORS.ASTON_MARTIN,
    primaryForeground: "#ffffff",
    oklch: { l: "0.610", c: "0.119", h: "165.0" },
  },
  {
    id: "alpine",
    themeName: "Alpine Pink",
    name: "Alpine",
    primaryColor: CONSTRUCTOR_COLORS.ALPINE,
    primaryForeground: "#000000",
    oklch: { l: "0.771", c: "0.156", h: "353.5" },
  },
  {
    id: "williams",
    themeName: "Williams Blue",
    name: "Williams",
    primaryColor: CONSTRUCTOR_COLORS.WILLIAMS,
    primaryForeground: "#ffffff",
    oklch: { l: "0.541", c: "0.191", h: "259.0" },
  },
  {
    id: "rb",
    themeName: "RB Blue",
    name: "Racing Bulls",
    primaryColor: CONSTRUCTOR_COLORS.RB,
    primaryForeground: "#000000",
    oklch: { l: "0.680", c: "0.168", h: "265.6" },
  },
  {
    id: "audi",
    themeName: "Audi Orange",
    name: "Audi",
    primaryColor: CONSTRUCTOR_COLORS.AUDI,
    primaryForeground: "#ffffff",
    oklch: { l: "0.643", c: "0.244", h: "31.9" },
  },
  {
    id: "haas",
    themeName: "Haas Grey",
    name: "Haas",
    primaryColor: CONSTRUCTOR_COLORS.HAAS,
    primaryForeground: "#000000",
    oklch: { l: "0.541", c: "0.015", h: "221.6" },
  },
  {
    id: "cadillac",
    themeName: "Cadillac Gold",
    name: "Cadillac",
    primaryColor: CONSTRUCTOR_COLORS.CADILLAC,
    primaryForeground: "#000000",
    oklch: { l: "0.800", c: "0.170", h: "73.6" },
  },
];

type ThemeContextType = {
  currentTeam: Team;
  setTeam: (teamId: string) => void;
  /** Called by the app after auth resolves to hydrate the theme from the DB. */
  hydrateFromRemote: (teamId: string | undefined) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function resolveTeam(teamId: string | null | undefined): Team {
  if (teamId) {
    const found = TEAMS.find((t) => t.id === teamId);
    if (found) return found;
  }
  return TEAMS[0]!;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Bootstrap from localStorage immediately so there's no flash-of-default-theme.
  const [currentTeam, setCurrentTeam] = useState<Team>(() => resolveTeam(safeStorage.getItem("f1-theme-team-id")));

  // Apply theme CSS variables whenever the team changes.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--theme-l", currentTeam.oklch.l);
    root.style.setProperty("--theme-c", currentTeam.oklch.c);
    root.style.setProperty("--theme-h", currentTeam.oklch.h);
    
    root.style.setProperty("--primary", currentTeam.primaryColor);
    root.style.setProperty("--primary-foreground", currentTeam.primaryForeground);
    root.style.setProperty("--ring", currentTeam.primaryColor);

    // Keep localStorage in sync as a fast bootstrap for next load.
    safeStorage.setItem("f1-theme-team-id", currentTeam.id);
  }, [currentTeam]);

  /** Called from the Settings screen — updates state and persists to DB. */
  const setTeam = (teamId: string) => {
    const team = resolveTeam(teamId);
    setCurrentTeam(team);

    // Fire-and-forget: persist to the user's profile in the DB.
    api.users.updateProfile({ preferences: { themeId: teamId } }).catch((err) => {
      console.error("[ThemeProvider] Failed to save theme preference:", err);
    });
  };

  /**
   * Called after the auth layer fetches the user profile from the DB.
   * Overrides the localStorage value with the authoritative server-side setting.
   * Uses a silent update (no DB write) so we don't create a pointless round-trip.
   */
  const hydrateFromRemote = (teamId: string | undefined) => {
    const team = resolveTeam(teamId);
    setCurrentTeam(team);
  };

  return <ThemeContext.Provider value={{ currentTeam, setTeam, hydrateFromRemote }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
