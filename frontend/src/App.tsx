import { useEffect } from "react";
import { Routes, Route, Outlet, useLocation, Navigate } from "react-router";
import { NotificationProvider } from "@/context/notification-context";
import { TutorialProvider, useTutorial } from "@/context/tutorial-context";
import { TutorialOverlay } from "@/components/ui/tutorial-overlay";
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
import { ChangelogScreen } from "./screens/changelog";
import { DevModeScreen } from "./screens/dev-mode";

import { LoginScreen } from "./screens/login";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AdminRoute } from "@/components/layout/admin-route";
import { AdminResultsScreen } from "./screens/admin/results";
import { auth } from "@/lib/auth";
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
    <div className="flex h-dvh overflow-hidden bg-background text-foreground font-sans">
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
    </div>
  );
}
const OnboardingTrigger = () => {
  const { startTour, isTourCompleted, activeTour } = useTutorial();
  const location = useLocation();
  const user = auth.getUser();

  useEffect(() => {
    // Only trigger if:
    // 1. No tour is active
    // 2. Onboarding haven't been completed
    // 3. User is authenticated (auth.getUser() returns profile)
    // 4. User has a display name (sign-in/up fully complete)
    // 5. Not on an invite or login screen (let them finish those flows)
    const isAuthenticating = location.pathname === "/login" || location.pathname === "/auth/callback";
    const isJoiningLeague = location.pathname.startsWith("/invite/");

    if (!activeTour && !isTourCompleted("onboarding") && user?.display_name && !isAuthenticating && !isJoiningLeague) {
      // Fetch league count to customize the tour
      api.leagues
        .list()
        .then((leagues: any[]) => {
          // Small delay to ensure everything is mounted and animations finished
          const timer = setTimeout(() => startTour("onboarding", leagues.length), 1500);
          return () => clearTimeout(timer);
        })
        .catch((err: Error) => {
          console.error("[OnboardingTrigger] Failed to fetch leagues:", err);
          // Fallback to onboarding with 0 leagues (most strict)
          const timer = setTimeout(() => startTour("onboarding", 0), 1000);
          return () => clearTimeout(timer);
        });
    }
  }, [startTour, isTourCompleted, activeTour, location.pathname, user?.display_name]);

  return null;
};

export function App() {
  return (
    <TutorialProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />

          <Route element={<ProtectedRoute />}>
            <Route
              element={
                <>
                  <OnboardingTrigger />
                  <AppLayout />
                </>
              }>
              <Route index element={<HomeScreen />} />
              <Route path="leagues" element={<LeaguesScreen />} />
              <Route path="leagues/create" element={<CreateLeagueWizard />} />
              <Route path="invite/:code" element={<InviteScreen />} />
              <Route path="picks" element={<PicksScreen />} />
              <Route path="profile" element={<ProfileScreen />} />
              <Route path="schedule" element={<RaceSchedule />} />
              <Route path="settings" element={<SettingsScreen />} />
              <Route path="changelog" element={<ChangelogScreen />} />
              <Route path="dev-mode" element={<DevModeScreen />} />

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="admin/results" element={<AdminResultsScreen />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
        <Toaster />
        <TutorialOverlay />
      </NotificationProvider>
    </TutorialProvider>
  );
}
