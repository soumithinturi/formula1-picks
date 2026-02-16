import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Medal } from "lucide-react";
import { useState } from "react";

interface LeagueEntry {
  name: string;
  type: "global" | "private";
  season: string;
  finalRank: number | string;
  totalPoints: number;
}

interface UserStats {
  totalLeagues: number;
  podiumFinishes: number;
  bestRank: number;
}

export function LeaguesHistoryScreen() {
  const [selectedSeason, setSelectedSeason] = useState("2023");

  // Mock data - will be replaced with real API data
  const userStats: UserStats = {
    totalLeagues: 14,
    podiumFinishes: 3,
    bestRank: 2,
  };

  const leagues: LeagueEntry[] = [
    {
      name: "Global F1 Championship",
      type: "global",
      season: "2023",
      finalRank: 2,
      totalPoints: 842,
    },
    {
      name: "Office Racers '23",
      type: "private",
      season: "2023",
      finalRank: 5,
      totalPoints: 450,
    },
    {
      name: "Winter Testing Cup",
      type: "global",
      season: "2023",
      finalRank: 12,
      totalPoints: 120,
    },
    {
      name: "Uni Friends League",
      type: "private",
      season: "2023",
      finalRank: 8,
      totalPoints: 210,
    },
    {
      name: "Global F1 Championship",
      type: "global",
      season: "2022",
      finalRank: "1.2k",
      totalPoints: 185,
    },
  ];

  const seasons = [...new Set(leagues.map((l) => l.season))].sort().reverse();
  const filteredLeagues = leagues.filter((l) => l.season === selectedSeason);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Season Archive</h1>
        <p className="text-muted-foreground leading-relaxed">
          Your chronological hall of fame and past competition records.
        </p>
      </div>

      {/* Statistics Panel */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="flex justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userStats.totalLeagues}</p>
                <p className="text-xs text-muted-foreground">Total Leagues</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <Medal className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userStats.podiumFinishes}</p>
                <p className="text-xs text-muted-foreground">Podium Finishes</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userStats.bestRank}nd</p>
                <p className="text-xs text-muted-foreground">Best Rank</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Season Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {seasons.map((season) => (
          <Button
            key={season}
            variant={selectedSeason === season ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSeason(season)}
            className="shrink-0">
            {season} • {leagues.find((l) => l.season === season)?.type === "global" ? "Global League" : "Mixed"}
          </Button>
        ))}
      </div>

      {/* League Cards */}
      <div className="space-y-3">
        {filteredLeagues.map((league, index) => (
          <Card key={`${league.name}-${index}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        league.type === "global" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                      {league.type === "global" ? "Global League" : "Private League"}
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-tight">{league.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Final Rank</p>
                  <p className="text-2xl font-bold">
                    {typeof league.finalRank === "number"
                      ? `${league.finalRank}${getOrdinal(league.finalRank)}`
                      : league.finalRank}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Points</p>
                  <p className="text-2xl font-bold">{league.totalPoints}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA Card */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6 pb-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Join New League</h3>
          <p className="text-sm text-muted-foreground mb-4">The 2025 season is starting soon. Don't miss out!</p>
          <Button>Browse Leagues</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function getOrdinal(n: number): string | undefined {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
