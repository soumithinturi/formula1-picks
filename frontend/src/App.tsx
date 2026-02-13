import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { FilterPill } from "@/components/ui/filter-pill";
import { SideNav } from "@/components/nav/side-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import { HeaderNav } from "@/components/nav/header-nav";
import { Leaderboard } from "@/components/racing/leaderboard";
import { SeasonCard } from "@/components/racing/season-card";
import { RaceCard } from "@/components/racing/race-card";
import { Countdown } from "@/components/ui/countdown";
import { PredictionSlot } from "@/components/racing/prediction-slot";
import { DriverInfo } from "@/components/racing/driver-info";
import { MobileDriverSelector } from "@/components/racing/mobile-driver-selector";
import { ReorderablePredictionList } from "@/components/racing/reorderable-prediction-list";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { ThemeProvider } from "@/context/theme-context";

export function App() {
  const [filter, setFilter] = useState("All");

  // Mock data for drivers
  const allDrivers = [
    { id: "1", name: "Max Verstappen", team: "Red Bull Racing", rank: 1 },
    { id: "2", name: "Sergio Perez", team: "Red Bull Racing", rank: 2 },
    { id: "3", name: "Lewis Hamilton", team: "Mercedes", rank: 3 },
    { id: "4", name: "Fernando Alonso", team: "Aston Martin", rank: 4 },
    { id: "5", name: "Charles Leclerc", team: "Ferrari", rank: 5 },
    { id: "6", name: "Lando Norris", team: "McLaren", rank: 6 },
    { id: "7", name: "George Russell", team: "Mercedes", rank: 7 },
    { id: "8", name: "Oscar Piastri", team: "McLaren", rank: 8 },
  ];

  // Initialize with some data for demo - explicit array for reordering
  const [predictions, setPredictions] = useState<any[]>([
    { id: "1", name: "Max Verstappen", team: "Red Bull Racing", rank: 1 },
    { id: "2", name: "Sergio Perez", team: "Red Bull Racing", rank: 2 },
    { id: "5", name: "Charles Leclerc", team: "Ferrari", rank: 5 },
  ]);

  const handleReorder = (newOrder: any[]) => {
    setPredictions(newOrder);
  };

  const leaderboardData = [
    {
      id: "1",
      rank: 1,
      previousRank: 2,
      name: "MaxV_Fan1",
      team: "Red Bull Racing",
      predictionsCorrect: 5,
      totalPredictions: 5,
      points: 125,
      avatarUrl: "",
    },
    {
      id: "2",
      rank: 2,
      previousRank: 2,
      name: "SmoothOperator",
      team: "Ferrari",
      predictionsCorrect: 4,
      totalPredictions: 5,
      points: 110,
    },
    {
      id: "3",
      rank: 24,
      previousRank: 25,
      name: "MyUsername",
      team: "Alpine",
      predictionsCorrect: 3,
      totalPredictions: 5,
      points: 85,
      isCurrentUser: true,
    },
  ];

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-background text-foreground font-sans">
        {/* Desktop Sidebar - Hidden on mobile */}
        <SideNav className="hidden md:flex shrink-0" />

        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <HeaderNav />

          <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold">Interactive Components</h2>
              <div className="flex flex-wrap gap-4 items-center">
                <Button>Primary Action</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
                <Input placeholder="Standard Input" className="w-full md:w-64" />
              </div>

              <div className="flex gap-2 items-center flex-wrap">
                <StatusPill variant="success">Success</StatusPill>
                <StatusPill variant="warning">Warning</StatusPill>
                <StatusPill variant="error">Error</StatusPill>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                {["All", "Upcoming", "Live"].map((f) => (
                  <FilterPill key={f} active={filter === f} onClick={() => setFilter(f)}>
                    {f}
                  </FilterPill>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Next Race</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Countdown targetDate={new Date(Date.now() + 250000000)} />
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-bold">Monaco Grand Prix</h3>
                    <p className="text-muted-foreground">Circuit de Monaco</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Your Predictions</h3>
                  <span className="text-xs text-muted-foreground">Drag to reorder</span>
                </div>

                <ReorderablePredictionList items={predictions} onReorder={handleReorder} />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold">Archive & History</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <RaceCard name="Bahrain GP" date="Mar 2" location="Sakhir" status="completed" winner="Max Verstappen" />
                <RaceCard
                  name="Saudi Arabian GP"
                  date="Mar 9"
                  location="Jeddah"
                  status="completed"
                  winner="Max Verstappen"
                />
                <RaceCard name="Australian GP" date="Mar 24" location="Melbourne" status="live" />
                <SeasonCard year={2025} winnerName="Lewis Hamilton" winnerPoints={420} />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold">League Standings</h2>
              <Card className="overflow-hidden">
                <Leaderboard entries={leaderboardData} />
              </Card>
            </section>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
