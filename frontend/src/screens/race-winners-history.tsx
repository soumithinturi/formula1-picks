import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useState } from "react";

interface Race {
  name: string;
  date: string;
  winner?: string;
  constructor?: string;
}

interface SeasonData {
  season: string;
  races: Race[];
}

export function RaceWinnersHistoryScreen() {
  const [selectedSeason, setSelectedSeason] = useState("2023");

  // Mock data - will be replaced with real API data
  const seasonsData: SeasonData[] = [
    {
      season: "2023",
      races: [
        { name: "Bahrain GP", date: "05 Mar 2023", winner: "Max Verstappen", constructor: "Red Bull Racing" },
        { name: "Saudi Arabian GP", date: "19 Mar 2023", winner: "Sergio Perez", constructor: "Red Bull Racing" },
        { name: "Australian GP", date: "02 Apr 2023", winner: "Max Verstappen", constructor: "Red Bull Racing" },
        { name: "Azerbaijan GP", date: "30 Apr 2023", winner: "Sergio Perez", constructor: "Red Bull Racing" },
        { name: "Miami GP", date: "07 May 2023", winner: "Max Verstappen", constructor: "Red Bull Racing" },
        { name: "Monaco GP", date: "28 May 2023", winner: "Max Verstappen", constructor: "Red Bull Racing" },
        { name: "Spanish GP", date: "04 Jun 2023", winner: "Max Verstappen", constructor: "Red Bull Racing" },
        { name: "Canadian GP", date: "18 Jun 2023", winner: "Max Verstappen", constructor: "Red Bull Racing" },
      ],
    },
    {
      season: "2022",
      races: [
        { name: "Bahrain GP", date: "20 Mar 2022", winner: "Charles Leclerc", constructor: "Ferrari" },
        { name: "Saudi Arabian GP", date: "27 Mar 2022", winner: "Max Verstappen", constructor: "Red Bull Racing" },
        { name: "Australian GP", date: "10 Apr 2022", winner: "Charles Leclerc", constructor: "Ferrari" },
      ],
    },
  ];

  const seasons = seasonsData.map((s) => s.season);
  const currentSeasonData = seasonsData.find((s) => s.season === selectedSeason) || seasonsData[0];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Historical Race Archives</h1>
        <p className="text-muted-foreground leading-relaxed">
          Analyze past podiums, winning constructors, and fastest laps to refine your league predictions for the
          upcoming season.
        </p>
      </div>

      {/* Season Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {seasons.map((season) => (
          <Button
            key={season}
            variant={selectedSeason === season ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSeason(season)}
            className="shrink-0">
            {season} Season
          </Button>
        ))}
      </div>

      {/* Season Header */}
      <div>
        <h2 className="text-xl font-semibold mb-1">{selectedSeason} Season Results</h2>
        <p className="text-sm text-muted-foreground">{currentSeasonData?.races.length} races</p>
      </div>

      {/* Race Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentSeasonData?.races.map((race, index) => (
          <Card
            key={`${race.name}-${index}`}
            className="cursor-pointer transition-all hover:bg-accent/50 active:scale-[0.98]">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base leading-tight mb-1">{race.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{race.date}</p>
                </div>
              </div>
            </CardHeader>
            {race.winner && (
              <CardContent className="pt-0">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Winner</p>
                  <p className="text-sm font-semibold">{race.winner}</p>
                  {race.constructor && <p className="text-xs text-muted-foreground">{race.constructor}</p>}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
