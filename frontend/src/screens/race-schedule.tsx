import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Trophy, BarChart2, Bell, ChevronDown, ShieldAlert, Globe, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/page-container";
import { races2026 } from "@/data/races-2026";
import { api, type Race } from "@/lib/api";
import { usePreferences } from "@/context/preferences-context";
import { useNavigate } from "react-router";

export default function RaceSchedule() {
  const navigate = useNavigate();
  const currentSeason = new Date().getFullYear();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRaceId, setExpandedRaceId] = useState<string | null>(null);
  const { timezoneDisplay, setTimezoneDisplay } = usePreferences();

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

  const formatSessionTime = (dateStr: string, timezone?: string) => {
    const d = new Date(dateStr);
    const inTrackTime = timezoneDisplay === "track" && timezone;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: inTrackTime ? timezone : undefined,
      timeZoneName: "short",
    });
  };

  const formatSessionDate = (dateStr: string, timezone?: string) => {
    const d = new Date(dateStr);
    const inTrackTime = timezoneDisplay === "track" && timezone;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: inTrackTime ? timezone : undefined,
    });
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
        {/* Timezone Toggle */}
        <div className="flex items-center justify-end px-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground h-8"
            onClick={() => setTimezoneDisplay(timezoneDisplay === "local" ? "track" : "local")}>
            {timezoneDisplay === "local" ? (
              <Clock className="h-3.5 w-3.5 mr-1.5" />
            ) : (
              <Globe className="h-3.5 w-3.5 mr-1.5" />
            )}
            Showing: <strong className="ml-1 uppercase text-foreground">{timezoneDisplay} Time</strong>
          </Button>
        </div>

        {/* Race List */}
        <div className="space-y-4">
          {races.map((race, index) => {
            const staticData = getStaticData(race.name);
            const formattedDate = formatSessionDate(race.date, staticData?.timezone);

            // Derive simpler status for UI
            const isNext = race.status === "UPCOMING" && races.slice(0, index).every((r) => r.status === "COMPLETED");

            const isExpanded = expandedRaceId === race.id;

            return (
              <Card
                key={race.id}
                onClick={() => setExpandedRaceId(isExpanded ? null : race.id)}
                className={cn(
                  "overflow-hidden transition-all relative cursor-pointer",
                  isNext ? "border-primary shadow-lg shadow-primary/10" : "hover:border-primary/50",
                  isExpanded && "ring-1 ring-primary/20",
                )}>
                {/* Status Banner for Next Race */}
                {isNext && (
                  <div className="bg-primary px-3 py-1 text-primary-foreground text-[10px] font-black uppercase tracking-widest w-fit rounded-br-lg">
                    Next Race
                  </div>
                )}

                {/* Reminder Bell */}
                {/* <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-20 h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(`Reminder set for ${race.name}`);
                  }}>
                  <Bell className="h-4 w-4" />
                </Button> */}

                <div className="relative p-4">
                  <div className="flex justify-between items-start z-10 relative">
                    <div className="space-y-1 max-w-[60%]">
                      <span className="text-[10px] font-bold tracking-tighter uppercase text-muted-foreground">
                        Round {(index + 1).toString().padStart(2, "0")}
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
                          <Button
                            size="sm"
                            className="h-8 text-xs font-bold gap-2 relative z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/picks");
                            }}>
                            <BarChart2 className="h-3 w-3" />
                            PREDICT NOW
                          </Button>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "absolute bottom-0 right-0 h-5 w-5 text-muted-foreground transition-transform duration-200 z-10",
                        isExpanded && "rotate-180",
                      )}
                    />

                    {/* Track Map */}
                    {staticData?.trackMap && (
                      <div className="absolute right-3 top-0 w-24 h-24 sm:w-28 sm:h-28 object-contain transition-opacity">
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

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="flex flex-col gap-2 pt-3 border-t border-border/50 animate-in fade-in slide-in-from-top-1">
                      {/* Sprint Info (if applicable) */}
                      {race.has_sprint && (
                        <div className="bg-muted/30 rounded-md p-3 text-sm flex flex-col gap-2 relative z-10">
                          <div className="font-semibold flex items-center justify-between">
                            Sprint Weekend
                            {race.sprint_deadline && (
                              <span className="text-xs text-brand font-medium flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" />
                                Picks Due: {formatSessionTime(race.sprint_deadline, staticData?.timezone)}
                              </span>
                            )}
                          </div>

                          {race.sprint_quali_date && (
                            <div className="flex justify-between items-center text-muted-foreground text-xs">
                              <span>Sprint Qualifying</span>
                              <span>{formatSessionTime(race.sprint_quali_date, staticData?.timezone)}</span>
                            </div>
                          )}

                          {race.sprint_date && (
                            <div className="flex justify-between items-center text-foreground text-xs font-medium">
                              <span>Sprint Race</span>
                              <span>{formatSessionTime(race.sprint_date, staticData?.timezone)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Race Info */}
                      <div className="bg-muted/30 rounded-md p-3 text-sm flex flex-col gap-2 relative z-10">
                        <div className="font-semibold flex items-center justify-between">
                          Main Event
                          {race.race_deadline && (
                            <span className="text-xs text-brand font-medium flex items-center gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              Picks Due: {formatSessionTime(race.race_deadline, staticData?.timezone)}
                            </span>
                          )}
                        </div>

                        {race.race_quali_date && (
                          <div className="flex justify-between items-center text-muted-foreground text-xs">
                            <span>Race Qualifying</span>
                            <span>{formatSessionTime(race.race_quali_date, staticData?.timezone)}</span>
                          </div>
                        )}

                        {race.date && (
                          <div className="flex justify-between items-center text-foreground text-xs font-medium">
                            <span>Grand Prix</span>
                            <span>{formatSessionTime(race.date, staticData?.timezone)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
