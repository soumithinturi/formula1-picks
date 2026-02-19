import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { PageContainer } from "@/components/layout/page-container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { api, type LeaderboardEntry } from "@/lib/api";
import { toast } from "sonner";

interface Standing extends LeaderboardEntry {
  rank: number;
  previousRank: number; // For now, we'll just mock this or calculate if we had history
}

export function StandingsScreen() {
  const navigate = useNavigate();
  const { leagueId } = useParams();
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState<Standing[]>([]);

  useEffect(() => {
    if (!leagueId) return;

    async function fetchStandings() {
      try {
        const data = await api.leaderboard.get(leagueId!);

        // Map API data to UI format
        // API returns sorted by points DESC
        const mapped: Standing[] = data.map((entry, index) => ({
          ...entry,
          rank: index + 1,
          previousRank: index + 1, // Placeholder: assume no change for now as we lack history
        }));

        setStandings(mapped);
      } catch (error) {
        console.error("Failed to fetch standings:", error);
        toast.error("Failed to load standings");
      } finally {
        setLoading(false);
      }
    }

    fetchStandings();
  }, [leagueId]);

  if (loading) {
    return (
      <PageContainer title="Standings" subtitle="League Leaderboard">
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

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
          <div className="grid grid-cols-[60px_1fr_80px] md:grid-cols-[100px_1fr_120px] items-center px-4 md:px-6 py-4 bg-white/5 border-b border-white/10 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <div className="text-center md:text-left">Rank</div>
            <div>Driver (User)</div>
            <div className="text-right">Points</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {standings.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No standings data available yet.</div>
            ) : (
              standings.map((user) => {
                const rankDiff = user.previousRank - user.rank; // Positive = gained rank (improved)

                return (
                  <div
                    key={user.userId}
                    className="grid grid-cols-[60px_1fr_80px] md:grid-cols-[100px_1fr_120px] items-center px-4 md:px-6 py-4 hover:bg-white/5 transition-colors group">
                    {/* Rank Column */}
                    <div className="flex items-center gap-2 md:gap-4 justify-center md:justify-start">
                      <span
                        className={`text-lg md:text-xl font-bold font-mono w-6 text-center ${user.rank <= 3 ? "text-primary" : "text-foreground"}`}>
                        {user.rank}
                      </span>
                      {/* Hide trend for now since we don't have history */}
                      {/* 
                        <div className="hidden md:flex items-center justify-center w-6">
                        {rankDiff > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : rankDiff < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                            <Minus className="h-4 w-4 text-muted-foreground/30" />
                        )}
                        </div>
                        */}
                    </div>

                    {/* Driver Column */}
                    <div className="flex items-center gap-3 md:gap-4">
                      <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-white/10">
                        {/* <AvatarImage src={...} /> */}
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs md:text-base">
                          {(user.displayName || "U").substring(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm md:text-base group-hover:text-primary transition-colors truncate max-w-[120px] md:max-w-xs">
                          {user.displayName || "Unknown User"}
                        </span>
                        {/* <span className="text-xs text-muted-foreground">{user.team}</span> */}
                      </div>
                    </div>

                    {/* Points Column */}
                    <div className="text-right">
                      <span className="text-base md:text-lg font-bold font-mono text-foreground">
                        {user.totalPoints}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
