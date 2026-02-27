import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, ChevronDown, Clock, ShieldAlert } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";
import type { Race } from "@/lib/api";

interface RaceCardProps {
  race: Race;
  winner?: string;
}

export function RaceCard({ race, winner }: RaceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isUpcoming = race.status === "UPCOMING";
  const isLive = race.status === "OPEN";

  return (
    <Card
      className={cn(
        "hover:border-primary/50 transition-all cursor-pointer overflow-hidden",
        isExpanded && "ring-1 ring-primary/20",
      )}
      onClick={() => setIsExpanded(!isExpanded)}>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-lg leading-tight">{race.name}</h3>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <MapPin className="h-3 w-3" />
              <span>{race.name.split(" ")[0]}</span>
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
            <span>{new Date(race.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>

          <div className="flex items-center gap-2">
            {winner && (
              <div className="text-xs">
                <span className="text-muted-foreground">Winner: </span>
                <span className="font-semibold">{winner}</span>
              </div>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          </div>
        </div>

        {isExpanded && (
          <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-border/50 animate-in fade-in slide-in-from-top-1">
            {/* Sprint Info (if applicable) */}
            {race.has_sprint && (
              <div className="bg-muted/30 rounded-md p-3 text-sm flex flex-col gap-2">
                <div className="font-semibold flex items-center justify-between">
                  Sprint Weekend
                  {race.sprint_deadline && (
                    <span className="text-xs text-brand font-medium flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      Picks Due:{" "}
                      {new Date(race.sprint_deadline).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>

                {race.sprint_quali_date && (
                  <div className="flex justify-between items-center text-muted-foreground text-xs">
                    <span>Sprint Qualifying</span>
                    <span>
                      {new Date(race.sprint_quali_date).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}

                {race.sprint_date && (
                  <div className="flex justify-between items-center text-foreground text-xs font-medium">
                    <span>Sprint Race</span>
                    <span>
                      {new Date(race.sprint_date).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Race Info */}
            <div className="bg-muted/30 rounded-md p-3 text-sm flex flex-col gap-2">
              <div className="font-semibold flex items-center justify-between">
                Main Event
                {race.race_deadline && (
                  <span className="text-xs text-brand font-medium flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    Picks Due:{" "}
                    {new Date(race.race_deadline).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>

              {race.race_quali_date && (
                <div className="flex justify-between items-center text-muted-foreground text-xs">
                  <span>Race Qualifying</span>
                  <span>
                    {new Date(race.race_quali_date).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}

              {race.date && (
                <div className="flex justify-between items-center text-foreground text-xs font-medium">
                  <span>Grand Prix</span>
                  <span>
                    {new Date(race.date).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
