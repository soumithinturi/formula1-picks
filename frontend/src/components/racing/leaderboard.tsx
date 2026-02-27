import * as React from "react";
import { DriverInfo } from "@/components/racing/driver-info";
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
      <table className="w-full text-xs sm:text-sm">
        <thead className="text-[10px] sm:text-xs text-muted-foreground uppercase border-b border-border/30">
          <tr>
            <th className="px-2 sm:px-3 py-2 font-medium text-left">Rank</th>
            <th className="px-2 sm:px-3 py-2 font-medium text-left">
              <span className="hidden sm:inline">Racer</span>
            </th>
            <th className="px-2 sm:px-3 py-2 font-medium text-center">Accuracy</th>
            <th className="px-2 sm:px-3 py-2 font-medium text-right">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {entries.map((entry) => {
            const rankChange = entry.previousRank - entry.rank;
            const accuracy =
              entry.totalPredictions > 0 ? Math.round((entry.predictionsCorrect / entry.totalPredictions) * 100) : 0;

            return (
              <tr key={entry.id} className={cn("transition-colors", entry.isCurrentUser && "bg-primary/5")}>
                <td className="px-2 sm:px-3 py-2.5 sm:py-3 font-medium whitespace-nowrap">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-sm sm:text-base font-semibold w-6 sm:w-8">{entry.rank}</span>
                    {rankChange > 0 ? (
                      <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-500" />
                    ) : rankChange < 0 ? (
                      <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500" />
                    ) : (
                      <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </td>
                <td className="px-2 sm:px-3 py-2.5 sm:py-3">
                  <DriverInfo name={entry.name} team={entry.team} avatarUrl={entry.avatarUrl} />
                </td>
                <td className="px-2 sm:px-3 py-2.5 sm:py-3 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold text-sm sm:text-base">{accuracy}%</span>
                    <span className="text-[10px] text-muted-foreground">
                      {entry.predictionsCorrect}/{entry.totalPredictions}
                    </span>
                  </div>
                </td>
                <td className="px-2 sm:px-3 py-2.5 sm:py-3 text-right font-semibold text-sm sm:text-base">
                  {entry.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
