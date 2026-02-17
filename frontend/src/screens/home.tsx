import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/ui/countdown";
import { Leaderboard } from "@/components/racing/leaderboard";
import { DriverSelector } from "@/components/racing/driver-selector";
import { ChevronRight, Trophy, Newspaper } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { useState } from "react";

interface NewsItem {
  id: string;
  title: string;
  timestamp?: string;
}

interface CircuitStat {
  label: string;
  value: string;
}

interface Driver {
  id: string;
  name: string;
  team: string;
  avatarUrl?: string;
  rank?: number;
}

const mockDrivers: Driver[] = [
  { id: "ver", name: "Max Verstappen", team: "Red Bull Racing", rank: 1 },
  { id: "per", name: "Sergio Perez", team: "Red Bull Racing", rank: 2 },
  { id: "lec", name: "Charles Leclerc", team: "Ferrari", rank: 3 },
  { id: "sai", name: "Carlos Sainz", team: "Ferrari", rank: 4 },
  { id: "nor", name: "Lando Norris", team: "McLaren", rank: 5 },
  { id: "pia", name: "Oscar Piastri", team: "McLaren", rank: 6 },
  { id: "rus", name: "George Russell", team: "Mercedes", rank: 7 },
  { id: "ham", name: "Lewis Hamilton", team: "Mercedes", rank: 8 },
  { id: "alo", name: "Fernando Alonso", team: "Aston Martin", rank: 9 },
  { id: "str", name: "Lance Stroll", team: "Aston Martin", rank: 10 },
];

export function HomeScreen() {
  const [selectedDrivers, setSelectedDrivers] = useState<(Driver | null)[]>([null, null, null]);

  // Mock data - will be replaced with real data from backend
  const nextRace = {
    name: "MONACO GP",
    fullName: "Monaco Grand Prix",
    targetDate: new Date(Date.now() + 250000000),
  };

  const currentPrediction = {
    hasPrediction: false,
    dueDate: "Qualifying",
    drivers: [],
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

  const newsItems: NewsItem[] = [
    {
      id: "1",
      title: "Update on Ferrari Upgrade Package for Monaco GP",
    },
    {
      id: "2",
      title: "Track Guide: Where the race will be won and lost",
    },
  ];

  const circuitStats: CircuitStat[] = [
    {
      label: "Circuit Length",
      value: "3.337 km",
    },
    {
      label: "Laps",
      value: "78",
    },
    {
      label: "DRS Zones",
      value: "1",
    },
  ];

  return (
    <PageContainer title="Home" subtitle="Welcome back, Soumith">
      <div className="space-y-6">
        {/* Race Header with Countdown */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold tracking-tight">{nextRace.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Race Starts In</p>
          </CardHeader>
          <CardContent>
            <Countdown targetDate={nextRace.targetDate} />
          </CardContent>
        </Card>

        {/* My Prediction Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">My Prediction</CardTitle>
            <p className="text-sm text-muted-foreground">Due before {currentPrediction.dueDate}</p>
          </CardHeader>
          <CardContent>
            {!currentPrediction.hasPrediction ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  {[0, 1, 2].map((index) => (
                    <DriverSelector
                      key={index}
                      position={index + 1}
                      drivers={mockDrivers}
                      selectedDriver={selectedDrivers[index]}
                      onSelect={(driver) => {
                        const newDrivers = [...selectedDrivers];
                        newDrivers[index] = driver;
                        setSelectedDrivers(newDrivers);
                      }}
                    />
                  ))}
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={selectedDrivers.some((d) => d === null)}
                  onClick={() => {
                    // Handle submission
                    console.log("Submitting prediction:", selectedDrivers);
                  }}>
                  Make Your Prediction
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Will show filled predictions here */}
                {/* TODO: Show read-only view of predictions */}
                <Button variant="outline" className="w-full" size="lg">
                  Edit Prediction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global League Preview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Global League</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                See Full
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Leaderboard entries={leaderboardData.slice(0, 3)} />
          </CardContent>
        </Card>

        {/* Latest News */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Latest News</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {newsItems.map((item) => (
              <button
                key={item.id}
                className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                <h4 className="font-medium text-sm leading-snug">{item.title}</h4>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Circuit Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Circuit Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              {circuitStats.map((stat, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center leading-relaxed">
              Monaco is the shortest and slowest circuit on the calendar, but arguably the most prestigious.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
