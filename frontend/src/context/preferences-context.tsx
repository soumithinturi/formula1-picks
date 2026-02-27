import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

type TimezonePreference = "local" | "track";

interface PreferencesContextType {
  timezoneDisplay: TimezonePreference;
  setTimezoneDisplay: (val: TimezonePreference) => void;
  /** Called by the app after auth resolves to hydrate preferences from the DB. */
  hydrateFromRemote: (val: TimezonePreference | undefined) => void;
}

const PREFS_KEY = "f1picks_preferences";

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

function resolveTimezone(val: string | null | undefined): TimezonePreference {
  if (val === "local" || val === "track") return val;
  return "local";
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  // Bootstrap from localStorage immediately for a fast initial render.
  const [timezoneDisplay, setTimezoneInternal] = useState<TimezonePreference>(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return resolveTimezone(parsed.timezoneDisplay);
      }
    } catch (e) {
      console.error("Failed to parse preferences from localStorage", e);
    }
    return "local";
  });

  // Keep localStorage in sync for fast bootstrap on next load.
  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ timezoneDisplay }));
  }, [timezoneDisplay]);

  /** Called from the Settings screen — updates state and persists to DB. */
  const setTimezoneDisplay = (val: TimezonePreference) => {
    setTimezoneInternal(val);

    // Fire-and-forget: persist to the user's profile in the DB.
    api.users.updateProfile({ preferences: { timezoneDisplay: val } }).catch((err) => {
      console.error("[PreferencesProvider] Failed to save timezone preference:", err);
    });
  };

  /**
   * Called after the auth layer fetches the user profile from the DB.
   * Overrides the localStorage value with the authoritative server-side setting.
   */
  const hydrateFromRemote = (val: TimezonePreference | undefined) => {
    if (!val) return;
    setTimezoneInternal(val);
  };

  return (
    <PreferencesContext.Provider value={{ timezoneDisplay, setTimezoneDisplay, hydrateFromRemote }}>
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
