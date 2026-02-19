import { Routes, Route, Outlet, useLocation } from "react-router";
import { ThemeProvider } from "@/context/theme-context";
import { SideNav } from "@/components/nav/side-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import { HeaderNav } from "@/components/nav/header-nav";
import { Toaster } from "@/components/ui/sonner";
import { HomeScreen } from "./screens/home";
import { LeaguesScreen } from "./screens/leagues";
import RaceSchedule from "./screens/race-schedule";
import { MoreScreen } from "./screens/more";
import { PicksScreen } from "./screens/picks";
import { RaceWinnersHistoryScreen } from "@/screens/race-winners-history";
import { LeaguesHistoryScreen } from "@/screens/leagues-history";
import { CreateLeagueWizard } from "@/screens/create-league/wizard";
import { StandingsScreen } from "./screens/standings";

import { LoginScreen } from "./screens/login";
import { ProtectedRoute } from "@/components/layout/protected-route";

/** Shell layout — wraps all routes with the nav chrome */
function AppLayout() {
  const location = useLocation();
  const isCreateLeague = location.pathname === "/leagues/create";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
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
    <Routes>
      <Route path="/login" element={<LoginScreen />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeScreen />} />
          <Route path="leagues" element={<LeaguesScreen />} />
          <Route path="leagues/create" element={<CreateLeagueWizard />} />
          <Route path="leagues/:leagueId/standings" element={<StandingsScreen />} />
          <Route path="picks" element={<PicksScreen />} />
          <Route path="schedule" element={<RaceSchedule />} />
          <Route path="more" element={<MoreScreen />} />
          <Route path="more/race-winners-history" element={<RaceWinnersHistoryScreen />} />
          <Route path="more/leagues-history" element={<LeaguesHistoryScreen />} />
          {/* Fallback */}
          <Route path="*" element={<HomeScreen />} />
        </Route>
      </Route>
    </Routes>
  );
}
