import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy } from "lucide-react";

export interface LeagueCardProps {
  id: string;
  name: string;
  memberCount: number;
  yourRank: number;
  onClick?: () => void;
}

export function LeagueCard({ name, memberCount, yourRank, onClick }: LeagueCardProps) {
  return (
    <Card
      className="cursor-pointer hover:border-primary/40 transition-all duration-200 hover:shadow-lg"
      onClick={onClick}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* League Name */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">{name}</h3>
            <Trophy className="h-5 w-5 text-primary shrink-0" />
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Your Rank:</span>
              <span className="font-bold text-primary">#{yourRank}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
