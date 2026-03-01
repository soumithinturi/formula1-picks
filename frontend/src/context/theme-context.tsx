import React, { createContext, useContext, useEffect, useState } from "react";
import { CONSTRUCTOR_COLORS, safeStorage } from "@/lib/utils";
import { api } from "@/lib/api";

export type Team = {
  id: string;
  name: string;
  themeName: string;
  primaryColor: string; // Hex or OKLCH
  primaryForeground: string; // Hex or OKLCH
};

export const TEAMS: Team[] = [
  {
    id: "default",
    name: "Independent",
    themeName: "F1 (Default)",
    primaryColor: "oklch(0.58 0.23 28)",
    primaryForeground: "oklch(0.985 0 0)",
  },
  {
    id: "redbull",
    themeName: "Red Bull Blue",
    name: "Red Bull",
    primaryColor: CONSTRUCTOR_COLORS.RED_BULL,
    primaryForeground: "#ffffff",
  },
  {
    id: "ferrari",
    themeName: "Ferrari Red",
    name: "Ferrari",
    primaryColor: CONSTRUCTOR_COLORS.FERRARI,
    primaryForeground: "#ffffff",
  },
  {
    id: "mclaren",
    themeName: "McLaren Papaya",
    name: "McLaren",
    primaryColor: CONSTRUCTOR_COLORS.MCLAREN,
    primaryForeground: "#000000",
  },
  {
    id: "mercedes",
    themeName: "Mercedes Teal",
    name: "Mercedes",
    primaryColor: CONSTRUCTOR_COLORS.MERCEDES,
    primaryForeground: "#000000",
  },
  {
    id: "astonmartin",
    themeName: "Aston Martin Green",
    name: "Aston Martin",
    primaryColor: CONSTRUCTOR_COLORS.ASTON_MARTIN,
    primaryForeground: "#ffffff",
  },
  {
    id: "alpine",
    themeName: "Alpine Pink",
    name: "Alpine",
    primaryColor: CONSTRUCTOR_COLORS.ALPINE,
    primaryForeground: "#000000",
  },
  {
    id: "williams",
    themeName: "Williams Blue",
    name: "Williams",
    primaryColor: CONSTRUCTOR_COLORS.WILLIAMS,
    primaryForeground: "#000000",
  },
  { id: "rb", themeName: "RB Blue", name: "RB", primaryColor: CONSTRUCTOR_COLORS.RB, primaryForeground: "#000000" },
  {
    id: "audi",
    themeName: "Audi Red",
    name: "Audi",
    primaryColor: CONSTRUCTOR_COLORS.SAUBER,
    primaryForeground: "#ffffff",
  },
  {
    id: "haas",
    themeName: "Haas Grey",
    name: "Haas",
    primaryColor: CONSTRUCTOR_COLORS.HAAS,
    primaryForeground: "#000000",
  },
  {
    id: "cadillac",
    themeName: "Cadillac Gold",
    name: "Cadillac",
    primaryColor: CONSTRUCTOR_COLORS.CADILLAC,
    primaryForeground: "#000000",
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
