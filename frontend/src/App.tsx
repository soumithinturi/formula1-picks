import { useEffect } from "react";
import { Routes, Route, Outlet, useLocation } from "react-router";
import { NotificationProvider } from "@/context/notification-context";
import { SideNav } from "@/components/nav/side-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import { HeaderNav } from "@/components/nav/header-nav";
import { Toaster } from "@/components/ui/sonner";
import { HomeScreen } from "./screens/home";
import { LeaguesScreen } from "./screens/leagues";
import RaceSchedule from "./screens/race-schedule";
import { PicksScreen } from "./screens/picks";
import { RaceWinnersHistoryScreen } from "@/screens/race-winners-history";
import { LeaguesHistoryScreen } from "@/screens/leagues-history";
import { CreateLeagueWizard } from "@/screens/create-league/wizard";
import { InviteScreen } from "./screens/invite";
import { SettingsScreen } from "@/screens/settings";
import { ProfileScreen } from "@/screens/profile";

import { LoginScreen } from "./screens/login";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { api } from "@/lib/api";
import { useTheme } from "@/context/theme-context";
import { usePreferences } from "@/context/preferences-context";

/**
 * Mounts inside AppLayout (behind ProtectedRoute), so it's always post-auth.
 * Fetches the user's DB profile and hydrates the theme + timezone contexts
 * with the authoritative server-side values, overriding any localStorage state.
 */
function PreferencesHydrator() {
  const { hydrateFromRemote: hydrateTheme } = useTheme();
  const { hydrateFromRemote: hydrateTimezone } = usePreferences();

  useEffect(() => {
    api.users
      .getMe()
      .then(({ user }) => {
        const prefs = user.preferences ?? {};
        hydrateTheme(prefs.themeId);
        hydrateTimezone(prefs.timezoneDisplay);
      })
      .catch((err) => {
        // Non-fatal: user continues with localStorage values.
        console.error("[PreferencesHydrator] Failed to load user preferences:", err);
      });
    // Intentionally run once on mount per authenticated session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/** Shell layout — wraps all routes with the nav chrome */
function AppLayout() {
  const location = useLocation();
  const isCreateLeague = location.pathname === "/leagues/create";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Hydrates theme + timezone from DB once the user is authenticated. */}
      <PreferencesHydrator />

      {/* Desktop Sidebar - Hidden on mobile */}
      <SideNav className="hidden md:flex shrink-0" />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <HeaderNav />

        <main className={`flex-1 overflow-y-auto ${isCreateLeague ? "" : "p-4 md:p-8"}`}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
      <Toaster />
    </div>
  );
}

export function App() {
  return (
    <NotificationProvider>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomeScreen />} />
            <Route path="leagues" element={<LeaguesScreen />} />
            <Route path="leagues/create" element={<CreateLeagueWizard />} />
            <Route path="invite/:code" element={<InviteScreen />} />
            <Route path="picks" element={<PicksScreen />} />
            <Route path="profile" element={<ProfileScreen />} />
            <Route path="schedule" element={<RaceSchedule />} />
            <Route path="settings" element={<SettingsScreen />} />
            {/* <Route path="more/race-winners-history" element={<RaceWinnersHistoryScreen />} /> */}
            {/* <Route path="more/leagues-history" element={<LeaguesHistoryScreen />} /> */}
            {/* Fallback */}
            <Route path="*" element={<HomeScreen />} />
          </Route>
        </Route>
      </Routes>
    </NotificationProvider>
  );
}
