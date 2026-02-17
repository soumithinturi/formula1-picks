import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Trophy, BarChart2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/page-container";
import { races2026 } from "@/data/races-2026";

export default function RaceSchedule() {
  const currentSeason = 2026;

  return (
    <PageContainer title="Schedule" subtitle={`${currentSeason} Season`}>
      <div className="space-y-4 pb-6">
        {/* Race List */}
        <div className="space-y-4">
          {races2026.map((race) => {
            return (
              <Card
                key={race.round}
                className={cn(
                  "overflow-hidden transition-all relative",
                  race.status === "Next Race"
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "hover:border-primary/50",
                )}>
                {/* Status Banner for Next Race */}
                {race.status === "Next Race" && (
                  <div className="bg-primary px-3 py-1 text-primary-foreground text-[10px] font-black uppercase tracking-widest w-fit rounded-br-lg">
                    Next Race
                  </div>
                )}

                {/* Reminder Bell */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-20 h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                  onClick={() => {
                    // Placeholder for reminder logic
                    console.log(`Reminder set for ${race.name}`);
                  }}>
                  <Bell className="h-4 w-4" />
                </Button>

                <div className="relative p-4">
                  <div className="flex justify-between items-start z-10 relative">
                    <div className="space-y-1 max-w-[60%]">
                      <span className="text-[10px] font-bold tracking-tighter uppercase text-muted-foreground">
                        Race {race.round.toString().padStart(2, "0")}
                      </span>
                      <h3 className="text-lg font-bold leading-tight">{race.name}</h3>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{race.location}</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-medium mt-2 uppercase">
                        <Calendar className="h-3 w-3 text-primary" />
                        <span>{race.date}</span>
                      </div>

                      {/* Actions / Status Chips */}
                      <div className="mt-4 flex items-center gap-2">
                        {race.status === "Completed" && (
                          <>
                            <Badge variant="secondary" className="text-[10px] uppercase">
                              Completed
                            </Badge>
                          </>
                        )}

                        {race.status === "Next Race" && (
                          <Button size="sm" className="h-8 text-xs font-bold gap-2">
                            <BarChart2 className="h-3 w-3" />
                            PREDICT NOW
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Track Map */}
                    <div className="absolute right-0 top-0 w-24 h-24 sm:w-28 sm:h-28 object-contain transition-opacity">
                      {/* Dark Mode Image (White Lines) */}
                      <img
                        src={race.trackMap.white}
                        alt={`${race.name} Circuit`}
                        className="w-full h-full object-contain hidden dark:block"
                      />
                      {/* Light Mode Image (Black Lines) */}
                      <img
                        src={race.trackMap.black}
                        alt={`${race.name} Circuit`}
                        className="w-full h-full object-contain block dark:hidden"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
