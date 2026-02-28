import * as React from "react";
import { DriverInfo } from "@/components/racing/driver-info";
import { cn } from "@/lib/utils";

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
            <th className="px-1 sm:px-3 py-2 font-medium text-left">Rnk</th>
            <th className="px-1 sm:px-3 py-2 font-medium text-left">
              <span className="hidden sm:inline">Racer</span>
            </th>
            <th className="px-1 sm:px-3 py-2 font-medium text-center">Acc.</th>
            <th className="px-1 sm:px-3 py-2 font-medium text-right">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {entries.map((entry) => {
            const rankChange = entry.previousRank - entry.rank;
            const accuracy =
              entry.totalPredictions > 0 ? Math.round((entry.predictionsCorrect / entry.totalPredictions) * 100) : 0;

            return (
              <tr key={entry.id} className={cn("transition-colors", entry.isCurrentUser && "bg-primary/5")}>
                <td className="px-1 sm:px-3 py-2.5 sm:py-3 font-medium whitespace-nowrap text-muted-foreground w-6">
                  <span className="text-xs sm:text-base font-semibold">{entry.rank}</span>
                </td>
                <td className="px-1 sm:px-3 py-2.5 sm:py-3">
                  <DriverInfo
                    name={entry.name}
                    team={entry.team}
                    avatarUrl={entry.avatarUrl}
                    isCurrentUser={entry.isCurrentUser}
                  />
                </td>
                <td className="px-1 sm:px-3 py-2.5 sm:py-3 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold text-xs sm:text-base">{accuracy}%</span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                      {entry.predictionsCorrect}/{entry.totalPredictions}
                    </span>
                  </div>
                </td>
                <td className="px-1 sm:px-3 py-2.5 sm:py-3 text-right font-semibold text-xs sm:text-base">
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
