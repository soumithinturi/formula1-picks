import { useNavigate } from "react-router";
import { PageContainer } from "@/components/layout/page-container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Standing {
  id: string;
  rank: number;
  previousRank: number;
  name: string;
  avatarUrl?: string;
  points: number;
  team: string; // e.g. "Red Bull Racing"
}

// Mock data matching the screenshot and existing leaderboard data
const mockStandings: Standing[] = [
  {
    id: "1",
    rank: 1,
    previousRank: 2,
    name: "SpeedDemon",
    team: "Red Bull Racing",
    points: 150,
  },
  {
    id: "2",
    rank: 2,
    previousRank: 1,
    name: "BoxBoxBox",
    team: "Ferrari",
    points: 142,
  },
  {
    id: "3",
    rank: 3,
    previousRank: 4,
    name: "Tifosi4Life",
    team: "Ferrari",
    points: 138,
  },
  {
    id: "4",
    rank: 4,
    previousRank: 3,
    name: "LateBraker",
    team: "Mercedes",
    points: 112,
  },
  {
    id: "5",
    rank: 5,
    previousRank: 5,
    name: "SmoothOperator",
    team: "McLaren",
    points: 98,
  },
  {
    id: "6",
    rank: 6,
    previousRank: 8,
    name: "PapayaRules",
    team: "McLaren",
    points: 95,
  },
  {
    id: "7",
    rank: 7,
    previousRank: 6,
    name: "ChecoFan11",
    team: "Red Bull Racing",
    points: 88,
  },
  {
    id: "8",
    rank: 8,
    previousRank: 9,
    name: "SilverArrow",
    team: "Mercedes",
    points: 82,
  },
  {
    id: "9",
    rank: 9,
    previousRank: 7,
    name: "ElPlan",
    team: "Aston Martin",
    points: 75,
  },
  {
    id: "10",
    rank: 10,
    previousRank: 10,
    name: "GreenMachine",
    team: "Aston Martin",
    points: 60,
  },
];

export function StandingsScreen() {
  const navigate = useNavigate();
  return (
    <PageContainer title="Standings" subtitle="League Leaderboard">
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header Actions */}
        <div className="flex items-center gap-2 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>

        {/* Standings Table Container */}
        <div className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-lg">
          {/* Table Header */}
          <div className="grid grid-cols-[80px_1fr_100px] md:grid-cols-[100px_1fr_120px] items-center px-6 py-4 bg-white/5 border-b border-white/10 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <div className="text-center md:text-left">Rank</div>
            <div>Driver (User)</div>
            <div className="text-right">Points</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {mockStandings.map((user) => {
              const rankDiff = user.previousRank - user.rank; // Positive = gained rank (improved)

              return (
                <div
                  key={user.id}
                  className="grid grid-cols-[80px_1fr_100px] md:grid-cols-[100px_1fr_120px] items-center px-6 py-4 hover:bg-white/5 transition-colors group">
                  {/* Rank Column */}
                  <div className="flex items-center gap-3 md:gap-4">
                    <span
                      className={`text-xl font-bold font-mono w-6 text-center ${user.rank <= 3 ? "text-primary" : "text-foreground"}`}>
                      {user.rank}
                    </span>
                    <div className="flex items-center justify-center w-6">
                      {rankDiff > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : rankDiff < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground/30" />
                      )}
                    </div>
                  </div>

                  {/* Driver Column */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border border-white/10 hidden md:block">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user.name.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-base group-hover:text-primary transition-colors">
                        {user.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{user.team}</span>
                    </div>
                  </div>

                  {/* Points Column */}
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-foreground">{user.points}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer / Pagination Placeholder */}
          <div className="p-4 border-t border-white/10 bg-white/5 text-center">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
              View Full Standings
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
