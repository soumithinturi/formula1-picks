import React, { createContext, useContext, useEffect, useState } from "react";
import { CONSTRUCTOR_COLORS } from "@/lib/utils";

export type Team = {
  id: string;
  name: string;
  primaryColor: string; // Hex or OKLCH
  primaryForeground: string; // Hex or OKLCH
};

export const TEAMS: Team[] = [
  {
    id: "default",
    name: "F1 Desktop (Default)",
    primaryColor: "oklch(0.58 0.23 28)",
    primaryForeground: "oklch(0.985 0 0)",
  },
  { id: "redbull", name: "Red Bull Blue", primaryColor: CONSTRUCTOR_COLORS.RED_BULL, primaryForeground: "#ffffff" },
  { id: "ferrari", name: "Ferrari Red", primaryColor: CONSTRUCTOR_COLORS.FERRARI, primaryForeground: "#ffffff" },
  { id: "mclaren", name: "McLaren Papaya", primaryColor: CONSTRUCTOR_COLORS.MCLAREN, primaryForeground: "#000000" },
  { id: "mercedes", name: "Mercedes Teal", primaryColor: CONSTRUCTOR_COLORS.MERCEDES, primaryForeground: "#000000" },
  {
    id: "astonmartin",
    name: "Aston Martin Green",
    primaryColor: CONSTRUCTOR_COLORS.ASTON_MARTIN,
    primaryForeground: "#ffffff",
  },
  { id: "alpine", name: "Alpine Pink", primaryColor: CONSTRUCTOR_COLORS.ALPINE, primaryForeground: "#000000" },
  { id: "williams", name: "Williams Blue", primaryColor: CONSTRUCTOR_COLORS.WILLIAMS, primaryForeground: "#000000" },
  { id: "rb", name: "RB Blue", primaryColor: CONSTRUCTOR_COLORS.RB, primaryForeground: "#000000" },
  { id: "audi", name: "Audi Red", primaryColor: CONSTRUCTOR_COLORS.SAUBER, primaryForeground: "#ffffff" },
  { id: "haas", name: "Haas Grey", primaryColor: CONSTRUCTOR_COLORS.HAAS, primaryForeground: "#000000" },
  { id: "cadillac", name: "Cadillac Gold", primaryColor: CONSTRUCTOR_COLORS.CADILLAC, primaryForeground: "#000000" },
];

type ThemeContextType = {
  currentTeam: Team;
  setTeam: (teamId: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTeam, setCurrentTeam] = useState<Team>(TEAMS[0]!);

  useEffect(() => {
    // Load from local storage
    const savedTeamId = localStorage.getItem("f1-theme-team-id");
    if (savedTeamId) {
      const team = TEAMS.find((t) => t.id === savedTeamId);
      if (team) setCurrentTeam(team);
    }
  }, []);

  useEffect(() => {
    // Apply theme variables
    const root = document.documentElement;

    root.style.setProperty("--primary", currentTeam.primaryColor);
    root.style.setProperty("--primary-foreground", currentTeam.primaryForeground);
    root.style.setProperty("--ring", currentTeam.primaryColor); // sync ring

    localStorage.setItem("f1-theme-team-id", currentTeam.id);
  }, [currentTeam]);

  const setTeam = (teamId: string) => {
    const team = TEAMS.find((t) => t.id === teamId);
    if (team) setCurrentTeam(team);
  };

  return <ThemeContext.Provider value={{ currentTeam, setTeam }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
