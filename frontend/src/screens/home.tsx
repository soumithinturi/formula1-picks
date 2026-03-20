import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/ui/countdown";
import { ChevronRight, ChevronLeft, Trophy, Loader2, AlertCircle, Target } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Race, Driver as ApiDriver, League, PickRow, ScoringConfig } from "@/lib/api";
import { races2026 } from "@/data/races-2026";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTeamColor } from "@/components/racing/driver-info";

interface Driver {
  id: string;
  name: string;
  team: string;
  tla?: string;
  avatarUrl?: string;
  rank?: number;
}

interface LeagueRanking {
  id: string;
  name: string;
  rank: number;
  total: number;
  points: number;
  trend: "up" | "down" | "same";
}

export function HomeScreen() {
  const navigate = useNavigate();

  const user = auth.getUser();
  const displayName = user?.display_name || user?.contact || "User";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nextRace, setNextRace] = useState<Race | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [rankings, setRankings] = useState<LeagueRanking[]>([]);

  // Pick Pagination State
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [userPickRow, setUserPickRow] = useState<PickRow | null>(null);
  const [currentPickPage, setCurrentPickPage] = useState(0);

  // Global Stats
  const [globalStats, setGlobalStats] = useState<{ correct: number; total: number } | null>(null);

  // Track metadata from local data
  const localRaceData = nextRace
    ? races2026.find((r) => r.name === nextRace.name || r.name.includes(nextRace.name.split(" ")[0] || ""))
    : null;

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch races, drivers, and user's leagues in parallel
        const [racesRes, driversRes, leaguesRes] = await Promise.all([
          api.races.list(),
          api.drivers.list(),
          api.leagues.list(),
          api.users.getMe(),
        ]);

        if (!mounted) return;

        // Process races
        const upcomingRace = racesRes.find((r) => r.status === "UPCOMING");
        if (upcomingRace) {
          setNextRace(upcomingRace);
        }

        // Process drivers for the selector
        const mappedDrivers = driversRes.map((d: ApiDriver) => ({
          id: d.driverId,
          name: `${d.givenName} ${d.familyName}`,
          team: d.constructorName || "Unknown constructor", // Now pulls from DB
          tla: d.code || d.familyName.substring(0, 3).toUpperCase(),
        }));
        setDrivers(mappedDrivers);

        // Process leagues to get user rankings
        const leagueRankings: LeagueRanking[] = [];

        // Fetch leaderboards for each league
        const leaderboards = await Promise.all(leaguesRes.map((l) => api.leaderboard.get(l.id || "").catch(() => [])));

        if (!mounted) return;

        setLeagues(leaguesRes);
        if (leaguesRes.length > 0) {
          const firstLeague = leaguesRes[0];
          if (firstLeague?.id) setSelectedLeagueId(firstLeague.id);
        }

        leaguesRes.forEach((league, index) => {
          const board = leaderboards[index];
          if (!board || board.length === 0) return;

          const userEntryIndex = board.findIndex((e) => e.userId === user?.id);
          if (userEntryIndex !== -1) {
            const userEntry = board[userEntryIndex];
            leagueRankings.push({
              id: league.id || "",
              name: league.name || "",
              rank: userEntryIndex + 1,
              total: board.length,
              points: userEntry?.totalPoints || 0,
              trend: "same", // Defaulting to same for now, as we don't have historical rank
            });
          }
        });

        // Sort rankings by points
        leagueRankings.sort((a, b) => b.points - a.points);
        setRankings(leagueRankings);

        // Fetch global stats from users/me response
        const meRes = await api.users.getMe();
        if (mounted && meRes.stats) {
          setGlobalStats({
            correct: meRes.stats.globalCorrectPredictions || 0,
            total: meRes.stats.globalTotalPredictions || 0,
          });
        }
      } catch (err: any) {
        console.error("Failed to load home data:", err);
        if (mounted) {
          setError(err.message || "Failed to load dashboard data");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!nextRace?.id || !selectedLeagueId) return;

    let mounted = true;
    async function fetchPicks() {
      try {
        const pick = await api.picks.get(nextRace!.id, selectedLeagueId);
        if (mounted && pick) {
          setUserPickRow(pick);
        } else if (mounted) {
          setUserPickRow(null);
        }
      } catch (e) {
        if (mounted) setUserPickRow(null);
      }
    }
    fetchPicks();
    return () => {
      mounted = false;
    };
  }, [nextRace?.id, selectedLeagueId]);

  const selectedLeague = leagues.find((l) => l.id === selectedLeagueId);
  const scoring =
    typeof selectedLeague?.scoring_config === "string"
      ? (JSON.parse(selectedLeague.scoring_config) as ScoringConfig)
      : (selectedLeague?.scoring_config as ScoringConfig | undefined);

  // Build prediction pages mapping
  const predictionPages: { title: string; items: { label: string; value?: string | null }[] }[] = [];

  if (scoring) {
    if (nextRace?.has_sprint) {
      if (scoring.quali?.enabled) {
        predictionPages.push({
          title: "Sprint Qualifying",
          items: [{ label: "Pole Position", value: userPickRow?.sprint_qualifying_p1 }],
        });
      }
      if (scoring.p1?.enabled || scoring.p2?.enabled || scoring.p3?.enabled || scoring.sprintFastestLap?.enabled) {
        const items = [];
        if (scoring.p1?.enabled) items.push({ label: "P1", value: userPickRow?.sprint_p1 });
        if (scoring.p2?.enabled) items.push({ label: "P2", value: userPickRow?.sprint_p2 });
        if (scoring.p3?.enabled) items.push({ label: "P3", value: userPickRow?.sprint_p3 });

        if (scoring.sprintFastestLap?.enabled) {
          items.push({ label: "Fastest Lap", value: userPickRow?.sprint_fastest_lap });
        }
        predictionPages.push({ title: "Sprint Results", items });
      }
    }

    if (scoring.quali?.enabled) {
      predictionPages.push({
        title: "Race Qualifying",
        items: [{ label: "Pole Position", value: userPickRow?.race_qualifying_p1 }],
      });
    }

    if (
      scoring.p1?.enabled ||
      scoring.p2?.enabled ||
      scoring.p3?.enabled ||
      scoring.fastestLap?.enabled ||
      scoring.firstDNF?.enabled
    ) {
      const items = [];
      if (scoring.p1?.enabled) items.push({ label: "P1", value: userPickRow?.race_p1 });
      if (scoring.p2?.enabled) items.push({ label: "P2", value: userPickRow?.race_p2 });
      if (scoring.p3?.enabled) items.push({ label: "P3", value: userPickRow?.race_p3 });

      if (scoring.fastestLap?.enabled) {
        items.push({ label: "Fastest Lap", value: userPickRow?.fastest_lap });
      }
      if (scoring.firstDNF?.enabled) {
        items.push({ label: "First DNF", value: userPickRow?.first_dnf });
      }
      predictionPages.push({ title: "The Race", items });
    }
  }

  useEffect(() => {
    if (currentPickPage >= predictionPages.length && predictionPages.length > 0) {
      setCurrentPickPage(0);
    }
  }, [predictionPages.length, currentPickPage]);

  const activePage = predictionPages[currentPickPage];

  const renderReadonlyPick = (label: string, driverId: string | undefined | null) => {
    const driver = drivers.find((d) => d.id === driverId);
    const bgColor = driver ? getTeamColor(driver.team) : undefined;

    return (
      <div className="flex flex-col gap-1 mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
        <div
          className="flex items-center justify-between p-3 border rounded-md relative overflow-hidden"
          style={{
            borderColor: bgColor ? `${bgColor}40` : undefined, // 25% opacity border
          }}>
          {bgColor && <div className="absolute inset-0 opacity-10" style={{ backgroundColor: bgColor }} />}
          {bgColor && <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: bgColor }} />}

          <div className="relative z-10 w-full">
            {driver ? (
              <div className="flex flex-col">
                <span className="font-bold">{driver.name}</span>
                <span className="text-xs text-muted-foreground">{driver.team}</span>
              </div>
            ) : (
              <span className="text-muted-foreground italic">No Pick</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPodium = (podiumItems: { label: string; value?: string | null }[]) => {
    const p1Item = podiumItems.find((i) => i.label === "P1");
    const p2Item = podiumItems.find((i) => i.label === "P2");
    const p3Item = podiumItems.find((i) => i.label === "P3");

    const getDriver = (id: string | null | undefined) => drivers.find((d) => d.id === id);

    const p1 = getDriver(p1Item?.value);
    const p2 = getDriver(p2Item?.value);
    const p3 = getDriver(p3Item?.value);

    const renderSlot = (driver: Driver | undefined, pos: number, heightCls: string, bgCls: string) => (
      <div
        className={`flex flex-col items-center justify-end ${heightCls} w-1/3 p-2 rounded-t-xl bg-card border-x border-t relative overflow-visible`}>
        <div className={`absolute inset-0 opacity-10 rounded-t-xl ${bgCls}`} />
        <span className="absolute -top-3 bg-background border px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm z-20">
          P{pos}
        </span>
        {driver ? (
          <div className="flex flex-col items-center text-center gap-1.5 z-10 w-full">
            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
              <AvatarImage src={driver.avatarUrl} alt={driver.name} />
              <AvatarFallback style={{ backgroundColor: getTeamColor(driver.team), color: "#fff" }} className="text-xs">
                {driver.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="font-bold text-[11px] truncate w-full px-1">
              {driver.tla || driver.name.split(" ").pop()}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-1.5 z-10 opacity-50 w-full mb-1">
            <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20" />
            <span className="text-[10px] text-muted-foreground italic truncate w-full">No Pick</span>
          </div>
        )}
      </div>
    );

    return (
      <div className="flex items-end justify-center gap-1.5 h-36 mb-6 mt-4 px-2 w-full max-w-[320px] mx-auto pt-4 relative isolate">
        {p2Item && renderSlot(p2, 2, "h-24", "bg-zinc-400")}
        {p1Item && renderSlot(p1, 1, "h-32 shadow-md z-10", "bg-amber-400")}
        {p3Item && renderSlot(p3, 3, "h-20", "bg-amber-700")}
      </div>
    );
  };

  if (isLoading) {
    return (
      <PageContainer title="Home" subtitle={`Welcome back, ${displayName}`}>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Home" subtitle={`Welcome back, ${displayName}`}>
        <div className="flex flex-col h-64 items-center justify-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">Failed to load</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Home" subtitle={`Welcome back, ${displayName}`}>
      <div className="space-y-6">
        {/* Race Header with Countdown */}
        {nextRace ? (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold tracking-tight">{nextRace.name}</CardTitle>
                {localRaceData && (
                  <span className="text-xs font-medium text-muted-foreground bg-accent px-2 py-1 rounded whitespace-nowrap shrink-0 ml-2">
                    Round {localRaceData.round}
                  </span>
                )}
              </div>
              {(() => {
                const now = new Date();
                
                const events = [
                  { label: "Free Practice 1", date: nextRace.fp1_date },
                  { label: "Free Practice 2", date: nextRace.fp2_date },
                  { label: "Free Practice 3", date: nextRace.fp3_date },
                  { label: "Sprint Qualifying", date: nextRace.sprint_quali_date },
                  { label: "Sprint", date: nextRace.sprint_date },
                  { label: "Qualifying", date: nextRace.race_quali_date },
                  { label: "Race", date: nextRace.date },
                ].filter(e => e.date) as { label: string; date: string }[];

                // Find the first event that is in the future
                let targetEvent = events.find(e => now < new Date(e.date));

                // If all events are in the past (edge case just before status=COMPLETED), point to the Race
                if (!targetEvent) targetEvent = events[events.length - 1] || { label: "Race", date: nextRace.date };

                const targetDate = new Date(targetEvent.date);

                return (
                  <>
                    <p className="text-sm text-muted-foreground">{targetEvent.label} Starts In</p>
                  </>
                );
              })()}
            </CardHeader>
            <CardContent>
              {(() => {
                const now = new Date();
                
                const events = [
                  { label: "Free Practice 1", date: nextRace.fp1_date },
                  { label: "Free Practice 2", date: nextRace.fp2_date },
                  { label: "Free Practice 3", date: nextRace.fp3_date },
                  { label: "Sprint Qualifying", date: nextRace.sprint_quali_date },
                  { label: "Sprint", date: nextRace.sprint_date },
                  { label: "Qualifying", date: nextRace.race_quali_date },
                  { label: "Race", date: nextRace.date },
                ].filter(e => e.date) as { label: string; date: string }[];

                let targetEvent = events.find(e => now < new Date(e.date));
                if (!targetEvent) targetEvent = events[events.length - 1] || { label: "Race", date: nextRace.date };

                const targetDate = new Date(targetEvent.date);

                return <Countdown targetDate={targetDate} />;
              })()}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold tracking-tight">No Upcoming Races</CardTitle>
              <p className="text-sm text-muted-foreground">The season might be over or schedule is pending.</p>
            </CardHeader>
          </Card>
        )}

        {/* My Prediction Status */}
        {nextRace && (
          <Card>
            <CardHeader className="pb-3 border-b border-border/10 mb-2">
              <div className="flex justify-between items-center mb-2">
                <CardTitle className="text-lg font-semibold shrink-0">My Prediction</CardTitle>
                {leagues.length > 0 && (
                  <div className="w-[140px] sm:w-[200px] flex justify-end">
                    <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId}>
                      <SelectTrigger className="h-8 text-xs w-full truncate">
                        <SelectValue placeholder="Select League" />
                      </SelectTrigger>
                      <SelectContent>
                        {leagues.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {leagues.length > 0 && predictionPages.length > 1 && (
                <div className="flex items-center justify-between mt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={currentPickPage === 0}
                    onClick={() => setCurrentPickPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-primary uppercase tracking-wider">{activePage?.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={currentPickPage === predictionPages.length - 1}
                    onClick={() => setCurrentPickPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-3 overflow-hidden">
              {activePage ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPickPage}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset }) => {
                      const swipe = offset.x;
                      if (swipe < -50 && currentPickPage < predictionPages.length - 1) {
                        setCurrentPickPage((p) => p + 1);
                      } else if (swipe > 50 && currentPickPage > 0) {
                        setCurrentPickPage((p) => p - 1);
                      }
                    }}
                    className="space-y-1">
                    {activePage.items.some((i) => ["P1", "P2", "P3"].includes(i.label)) &&
                      renderPodium(activePage.items.filter((i) => ["P1", "P2", "P3"].includes(i.label)))}

                    {activePage.items
                      .filter((i) => !["P1", "P2", "P3"].includes(i.label))
                      .map((item, i) => (
                        <div key={i}>{renderReadonlyPick(item.label, item.value)}</div>
                      ))}

                    <Button
                      variant="default"
                      className="w-full mt-2"
                      size="lg"
                      onClick={() => navigate(`/picks${selectedLeagueId ? `?leagueId=${selectedLeagueId}` : ``}`)}>
                      {userPickRow ? "Edit Prediction" : "Make Your Prediction"}
                    </Button>
                  </motion.div>
                </AnimatePresence>
              ) : leagues.length === 0 ? (
                <div className="text-center py-6 flex flex-col items-center justify-center space-y-3">
                  <p className="text-muted-foreground text-sm">Join or create a league to start making predictions!</p>
                  <Button variant="outline" onClick={() => navigate("/leagues")}>
                    Go to Leagues
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">Loading prediction rules...</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Global Accuracy Stats */}
        {globalStats && globalStats.total > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Global Accuracy</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl bg-card border">
                <div className="space-y-1">
                  <p className="font-semibold">Career Accuracy</p>
                  <p className="text-sm text-muted-foreground">
                    {globalStats.correct} out of {globalStats.total} predictions correct
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-black text-primary">
                    {Math.round((globalStats.correct / globalStats.total) * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Global League Preview */}
        {rankings.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">My Rankings</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  {rankings.map((league) => (
                    <div
                      key={league.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/leagues?leagueId=${league.id}`)}>
                      <div className="grid grid-cols-[3rem_1fr] items-center gap-x-2 gap-y-1">
                        <span className="text-xl font-bold font-mono leading-none text-center">{league.rank}</span>
                        <span className="font-semibold leading-none truncate">{league.name}</span>

                        <span className="text-[10px] text-muted-foreground uppercase leading-none text-center">
                          of {league.total}
                        </span>
                        <span className="text-xs text-muted-foreground leading-none">{league.points} pts</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
