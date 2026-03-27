import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface SeasonCardProps {
  year: number;
  winnerName: string;
  winnerPoints: number;
  isCurrent?: boolean;
}

export function SeasonCard({ year, winnerName, winnerPoints, isCurrent }: SeasonCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary">
          Season {year}
        </CardTitle>
        {isCurrent && (
          <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">Active</span>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <h3 className="text-2xl font-bold">{winnerName}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{winnerPoints} Points</p>
      </CardContent>
    </Card>
  );
}
