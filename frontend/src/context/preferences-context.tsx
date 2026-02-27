import React, { createContext, useContext, useEffect, useState } from "react";

type TimezonePreference = "local" | "track";

interface PreferencesContextType {
  timezoneDisplay: TimezonePreference;
  setTimezoneDisplay: (val: TimezonePreference) => void;
}

const PREFS_KEY = "f1picks_preferences";

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [timezoneDisplay, setTimezoneDisplay] = useState<TimezonePreference>(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.timezoneDisplay === "local" || parsed.timezoneDisplay === "track") {
          return parsed.timezoneDisplay;
        }
      }
    } catch (e) {
      console.error("Failed to parse preferences from localStorage", e);
    }
    return "local"; // Default to local time
  });

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ timezoneDisplay }));
  }, [timezoneDisplay]);

  return (
    <PreferencesContext.Provider value={{ timezoneDisplay, setTimezoneDisplay }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
