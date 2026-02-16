import { useState } from "react";
import { ThemeProvider } from "@/context/theme-context";
import { SideNav } from "@/components/nav/side-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import { HeaderNav } from "@/components/nav/header-nav";
import { Toaster } from "@/components/ui/sonner";
import { HomeScreen } from "./screens/home";
import { LeaguesScreen } from "./screens/leagues";
import { MoreScreen } from "./screens/more";

export type Screen = "Home" | "Leagues" | "Picks" | "Schedule" | "More";

export function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("Home");

  const renderScreen = () => {
    switch (activeScreen) {
      case "Home":
        return <HomeScreen />;
      case "Leagues":
        return <LeaguesScreen />;
      case "More":
        return <MoreScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-background text-foreground font-sans">
        {/* Desktop Sidebar - Hidden on mobile */}
        <SideNav className="hidden md:flex shrink-0" />

        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <HeaderNav />

          <main className="flex-1 overflow-y-auto p-4 md:p-8">{renderScreen()}</main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNav activeItem={activeScreen} onNavigate={setActiveScreen} />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
