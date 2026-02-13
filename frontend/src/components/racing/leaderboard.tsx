import * as React from "react";
import { DriverInfo } from "@/components/racing/driver-info";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  rank: number;
  previousRank: number;
  name: string;
  team: string;
  avatarUrl?: string;
  predictionsCorrect: number;
  totalPredictions: number;
  points: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps extends React.HTMLAttributes<HTMLDivElement> {
  entries: LeaderboardEntry[];
}

export function Leaderboard({ entries, className, ...props }: LeaderboardProps) {
  return (
    <div className={cn("w-full overflow-x-auto", className)} {...props}>
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
          <tr>
            <th className="px-6 py-3 font-medium">Rank</th>
            <th className="px-6 py-3 font-medium">Driver (User)</th>
            <th className="px-6 py-3 font-medium hidden md:table-cell text-center">Predictions</th>
            <th className="px-3 md:px-6 py-3 font-medium text-right">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {entries.map((entry) => {
            const rankChange = entry.previousRank - entry.rank;
            return (
              <tr
                key={entry.id}
                className={cn(
                  "hover:bg-muted/30 transition-colors",
                  entry.isCurrentUser && "bg-primary/5 hover:bg-primary/10",
                )}>
                <td className="px-3 md:px-6 py-4 font-medium whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-lg w-6 text-center">{entry.rank}</span>
                    {rankChange > 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : rankChange < 0 ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </td>
                <td className="px-3 md:px-6 py-4">
                  <DriverInfo name={entry.name} team={entry.team} avatarUrl={entry.avatarUrl} />
                </td>
                <td className="px-6 py-4 text-center hidden md:table-cell">
                  <StatusPill variant={entry.predictionsCorrect === entry.totalPredictions ? "success" : "neutral"}>
                    {entry.predictionsCorrect}/{entry.totalPredictions} Correct
                  </StatusPill>
                </td>
                <td className="px-3 md:px-6 py-4 text-right font-bold text-lg">{entry.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
