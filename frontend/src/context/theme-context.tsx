import React, { createContext, useContext, useEffect, useState } from "react";

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
  }, // Red
  { id: "ferrari", name: "Ferrari", primaryColor: "#ED1C24", primaryForeground: "#ffffff" },
  { id: "mclaren", name: "McLaren", primaryColor: "#F58020", primaryForeground: "#000000" },
  { id: "mercedes", name: "Mercedes", primaryColor: "#6CD3BF", primaryForeground: "#000000" },
  { id: "redbull", name: "Red Bull Racing", primaryColor: "#1E5BC6", primaryForeground: "#ffffff" },
  { id: "astonmartin", name: "Aston Martin", primaryColor: "#2D826D", primaryForeground: "#ffffff" },
  { id: "alpine", name: "Alpine", primaryColor: "#2293D1", primaryForeground: "#ffffff" },
  { id: "williams", name: "Williams", primaryColor: "#37BEDD", primaryForeground: "#000000" },
  { id: "rb", name: "Racing Bulls", primaryColor: "#4E7C9B", primaryForeground: "#ffffff" },
  { id: "haas", name: "Haas", primaryColor: "#000000", primaryForeground: "#ffffff" },
  { id: "audi", name: "Audi", primaryColor: "#B6BABD", primaryForeground: "#000000" },
  { id: "cadillac", name: "Cadillac", primaryColor: "#000000", primaryForeground: "#ffffff" }, // TODO: Special handling for dark mode
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
