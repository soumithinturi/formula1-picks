import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Trophy, BarChart2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/page-container";
import { races2026 } from "@/data/races-2026";
import { api, type Race } from "@/lib/api";

export default function RaceSchedule() {
  const currentSeason = 2025;
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRaces() {
      try {
        const data = await api.races.list();
        setRaces(data);
      } catch (error) {
        console.error("Failed to fetch races:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRaces();
  }, []);

  // Helper to find static assets (track map, location) by fuzzy name match
  const getStaticData = (apiRaceName: string) => {
    return races2026.find(
      (r) =>
        apiRaceName.includes(r.circuitId) ||
        apiRaceName.toLowerCase().includes(r.name.split(" ")[0]?.toLowerCase() ?? "") ||
        r.name.includes(apiRaceName),
    );
  };

  if (loading) {
    return (
      <PageContainer title="Schedule" subtitle={`${currentSeason} Season`}>
        <div className="flex justify-center py-10">Loading schedule...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Schedule" subtitle={`${currentSeason} Season`}>
      <div className="space-y-4 pb-6">
        {/* Race List */}
        <div className="space-y-4">
          {races.map((race, index) => {
            const staticData = getStaticData(race.name);
            const raceDate = new Date(race.date);
            const formattedDate = raceDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            // Derive simpler status for UI
            const isNext = index === 0 && race.status === "UPCOMING"; // Naive "next" check for demo

            return (
              <Card
                key={race.id}
                className={cn(
                  "overflow-hidden transition-all relative",
                  isNext ? "border-primary shadow-lg shadow-primary/10" : "hover:border-primary/50",
                )}>
                {/* Status Banner for Next Race */}
                {isNext && (
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
                    console.log(`Reminder set for ${race.name}`);
                  }}>
                  <Bell className="h-4 w-4" />
                </Button>

                <div className="relative p-4">
                  <div className="flex justify-between items-start z-10 relative">
                    <div className="space-y-1 max-w-[60%]">
                      <span className="text-[10px] font-bold tracking-tighter uppercase text-muted-foreground">
                        Race {(index + 1).toString().padStart(2, "0")}
                      </span>
                      <h3 className="text-lg font-bold leading-tight">{race.name}</h3>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{staticData?.location || "TBA"}</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-medium mt-2 uppercase">
                        <Calendar className="h-3 w-3 text-primary" />
                        <span>{formattedDate}</span>
                      </div>

                      {/* Actions / Status Chips */}
                      <div className="mt-4 flex items-center gap-2">
                        {race.status === "COMPLETED" && (
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            Completed
                          </Badge>
                        )}

                        {race.has_sprint && (
                          <Badge variant="outline" className="text-[10px] border-primary/50 text-foreground">
                            Sprint
                          </Badge>
                        )}

                        {isNext && (
                          <Button size="sm" className="h-8 text-xs font-bold gap-2">
                            <BarChart2 className="h-3 w-3" />
                            PREDICT NOW
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Track Map */}
                    {staticData?.trackMap && (
                      <div className="absolute right-0 top-0 w-24 h-24 sm:w-28 sm:h-28 object-contain transition-opacity">
                        <img
                          src={staticData.trackMap.white}
                          alt={`${race.name} Circuit`}
                          className="w-full h-full object-contain hidden dark:block"
                        />
                        <img
                          src={staticData.trackMap.black}
                          alt={`${race.name} Circuit`}
                          className="w-full h-full object-contain block dark:hidden"
                        />
                      </div>
                    )}
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
