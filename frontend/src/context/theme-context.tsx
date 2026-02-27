import React, { createContext, useContext, useEffect, useState } from "react";
import { CONSTRUCTOR_COLORS } from "@/lib/utils";

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
    name: "F1 (Default)",
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
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTeam, setCurrentTeam] = useState<Team>(TEAMS[1]!);

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
