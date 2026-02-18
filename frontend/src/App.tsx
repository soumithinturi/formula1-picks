import { useState } from "react";
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

export type Screen =
  | "Home"
  | "Leagues"
  | "Standings"
  | "Picks"
  | "Schedule"
  | "More"
  | "RaceWinnersHistory"
  | "LeaguesHistory"
  | "CreateLeague";

export function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("Home");

  const renderScreen = () => {
    switch (activeScreen) {
      case "Home":
        return <HomeScreen onNavigate={(screen) => setActiveScreen(screen as Screen)} />;
      case "Leagues":
        return <LeaguesScreen onNavigate={(screen) => setActiveScreen(screen as Screen)} />;
      case "Standings":
        return <StandingsScreen onNavigate={(screen) => setActiveScreen(screen as Screen)} />;
      case "Schedule":
        return <RaceSchedule />;
      case "Picks":
        return <PicksScreen />;
      case "More":
        return <MoreScreen onNavigate={setActiveScreen} />;
      case "RaceWinnersHistory":
        return <RaceWinnersHistoryScreen />;
      case "LeaguesHistory":
        return <LeaguesHistoryScreen />;
      case "CreateLeague":
        return (
          <CreateLeagueWizard
            onComplete={() => setActiveScreen("Leagues")}
            onCancel={() => setActiveScreen("Leagues")}
          />
        );
      default:
        return <HomeScreen onNavigate={(screen) => setActiveScreen(screen as Screen)} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
        {/* Desktop Sidebar - Hidden on mobile */}
        <SideNav activeItem={activeScreen} onNavigate={setActiveScreen} className="hidden md:flex shrink-0" />

        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <HeaderNav />

          <main className={`flex-1 overflow-y-auto ${activeScreen === "CreateLeague" ? "" : "p-4 md:p-8"}`}>
            {renderScreen()}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNav activeItem={activeScreen} onNavigate={setActiveScreen} />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
