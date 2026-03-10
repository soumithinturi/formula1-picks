import React, { useState, useEffect } from "react";
import { DriverInfo } from "@/components/racing/driver-info";
import { cn } from "@/lib/utils";
import { api, type PickRow, type Driver } from "@/lib/api";
import { ChevronDown, ChevronUp, Lock, Loader2 } from "lucide-react";
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
  leagueId?: string;
  nextRaceId?: string;
  hasSprint?: boolean;
  scoringConfig?: any;
  disableExpansion?: boolean;
  selectedRaceId?: string;
}

export function Leaderboard({
  entries,
  leagueId,
  nextRaceId,
  hasSprint,
  scoringConfig,
  disableExpansion = false,
  selectedRaceId,
  className,
  ...props
}: LeaderboardProps) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userPicks, setUserPicks] = useState<PickRow | null>(null);
  const [loadingPicks, setLoadingPicks] = useState(false);

  useEffect(() => {
    if (disableExpansion) {
      setExpandedUserId(null);
    }
  }, [disableExpansion]);

  // Reset expanded state when switching races
  useEffect(() => {
    setExpandedUserId(null);
    setUserPicks(null);
  }, [selectedRaceId, nextRaceId]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    if (expandedUserId && drivers.length === 0) {
      api.drivers
        .list()
        .then(setDrivers)
        .catch(() => {});
    }
  }, [expandedUserId, drivers.length]);

  const handleRowClick = async (userId: string) => {
    if (disableExpansion) return;
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);

    const targetRaceId = selectedRaceId || nextRaceId;
    if (!targetRaceId || !leagueId) return;

    setUserPicks(null);
    setLoadingPicks(true);
    try {
      const data = await api.picks.getUser(targetRaceId, userId, leagueId);
      setUserPicks(data);
    } catch (err) {
      // Pick not found or error
    } finally {
      setLoadingPicks(false);
    }
  };

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return null;
    const driver = drivers.find((d) => d.driverId === driverId);
    if (!driver) return "Unknown Driver";
    return `${driver.givenName} ${driver.familyName}`;
  };

  const renderPick = (label: string, driverId: string | null | undefined, resultDriverId?: string | null) => {
    // Both undefined properties (not on object) and strictly null mean no pick/locked
    // We treat null explicitly as locked if the DB returned it (since our backend sets it to null for locks or if they didn't pick).
    if (driverId === null) {
      return (
        <div className="flex flex-col items-center justify-center py-2 px-1 bg-muted/30 rounded-md border border-border/50">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">{label}</span>
          <Lock className="w-4 h-4 text-muted-foreground/50" />
        </div>
      );
    }
    if (driverId === undefined) return null;

    let borderColor = "border-border/50";
    let bgColor = "bg-muted/30";

    if (resultDriverId !== undefined && resultDriverId !== null && resultDriverId !== "") {
      if (driverId === resultDriverId) {
        borderColor = "border-green-500/20";
        bgColor = "bg-green-500/5 text-green-500/90";
      } else {
        borderColor = "border-red-500/20";
        bgColor = "bg-red-500/5 text-red-500/90";
      }
    }

    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-2 px-1 rounded-md border text-center",
          borderColor,
          bgColor,
        )}>
        <span className="text-[10px] opacity-70 uppercase tracking-widest mb-1">{label}</span>
        <span className="text-xs font-semibold truncate w-full px-1">{getDriverName(driverId) || "—"}</span>
      </div>
    );
  };

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
            {!disableExpansion && <th className="w-6"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {entries.map((entry) => {
            const accuracy =
              entry.totalPredictions > 0 ? Math.round((entry.predictionsCorrect / entry.totalPredictions) * 100) : 0;
            const isExpanded = expandedUserId === entry.id;

            return (
              <React.Fragment key={entry.id}>
                <tr
                  className={cn(
                    "transition-colors",
                    !disableExpansion && "cursor-pointer hover:bg-muted/30",
                    entry.isCurrentUser && "bg-primary/5",
                    isExpanded && "bg-muted/50",
                  )}
                  onClick={() => handleRowClick(entry.id)}>
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
                  {!disableExpansion && (
                    <td className="px-1 sm:px-2 py-2.5 sm:py-3 text-center opacity-70">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 inline-block" />
                      ) : (
                        <ChevronDown className="w-4 h-4 inline-block" />
                      )}
                    </td>
                  )}
                </tr>
                {isExpanded && (
                  <tr className="bg-muted/10 border-b border-border/30">
                    <td colSpan={5} className="p-0">
                      <div className="p-4 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                            Target Race Picks
                          </h4>
                          {!nextRaceId && (
                            <span className="text-[10px] text-muted-foreground">
                              Select a league with upcoming races
                            </span>
                          )}
                        </div>
                        {loadingPicks ? (
                          <div className="flex justify-center p-4">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : userPicks && nextRaceId ? (
                          <div className="space-y-3">
                            {/* Sprint Picks (if any exist in the record or if explicitly requested) */}
                            {hasSprint && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] uppercase font-semibold text-primary/80 tracking-widest">
                                  Sprint
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                  {(!scoringConfig || scoringConfig.quali?.enabled) &&
                                    renderPick(
                                      "Sprint Pole",
                                      userPicks.sprint_qualifying_p1,
                                      userPicks.results?.sprint_qualifying_p1,
                                    )}
                                  {(!scoringConfig || scoringConfig.p1?.enabled) &&
                                    renderPick("Sprint P1", userPicks.sprint_p1, userPicks.results?.sprint_p1)}
                                  {(!scoringConfig || scoringConfig.p2?.enabled) &&
                                    renderPick("Sprint P2", userPicks.sprint_p2, userPicks.results?.sprint_p2)}
                                  {(!scoringConfig || scoringConfig.p3?.enabled) &&
                                    renderPick("Sprint P3", userPicks.sprint_p3, userPicks.results?.sprint_p3)}
                                  {(!scoringConfig || scoringConfig.sprintFastestLap?.enabled) &&
                                    renderPick(
                                      "Sprint FL",
                                      userPicks.sprint_fastest_lap,
                                      userPicks.results?.sprint_fastest_lap,
                                    )}
                                </div>
                              </div>
                            )}

                            {/* Race Picks */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] uppercase font-semibold text-primary/80 tracking-widest">
                                Race
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                                {(!scoringConfig || scoringConfig.quali?.enabled) &&
                                  renderPick(
                                    "Pole",
                                    userPicks.race_qualifying_p1,
                                    userPicks.results?.race_qualifying_p1,
                                  )}
                                {(!scoringConfig || scoringConfig.p1?.enabled) &&
                                  renderPick("Race P1", userPicks.race_p1, userPicks.results?.race_p1)}
                                {(!scoringConfig || scoringConfig.p2?.enabled) &&
                                  renderPick("Race P2", userPicks.race_p2, userPicks.results?.race_p2)}
                                {(!scoringConfig || scoringConfig.p3?.enabled) &&
                                  renderPick("Race P3", userPicks.race_p3, userPicks.results?.race_p3)}
                                {(!scoringConfig || scoringConfig.fastestLap?.enabled) &&
                                  renderPick("Fastest Lap", userPicks.fastest_lap, userPicks.results?.fastest_lap)}
                                {(!scoringConfig || scoringConfig.firstDNF?.enabled) &&
                                  renderPick("First DNF", userPicks.first_dnf, userPicks.results?.first_dnf)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4 text-sm text-muted-foreground italic bg-muted/20 rounded-md border border-dashed border-border/50">
                            No picks submitted yet, or not active.
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
