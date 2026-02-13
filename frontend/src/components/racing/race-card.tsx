import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";

interface RaceCardProps {
  name: string;
  date: string;
  location: string;
  status: "upcoming" | "completed" | "live";
  winner?: string;
}

export function RaceCard({ name, date, location, status, winner }: RaceCardProps) {
  const isUpcoming = status === "upcoming";
  const isLive = status === "live";

  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-lg leading-tight">{name}</h3>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <MapPin className="h-3 w-3" />
              <span>{location}</span>
            </div>
          </div>
          {isLive ? (
            <StatusPill variant="error">Live</StatusPill>
          ) : isUpcoming ? (
            <StatusPill variant="neutral">Upcoming</StatusPill>
          ) : (
            <StatusPill variant="success">Completed</StatusPill>
          )}
        </div>

        <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{date}</span>
          </div>

          {winner && (
            <div className="text-xs">
              <span className="text-muted-foreground">Winner: </span>
              <span className="font-semibold">{winner}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
