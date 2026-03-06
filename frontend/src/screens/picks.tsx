import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/ui/countdown";
import { StatusPill } from "@/components/ui/status-pill";
import { DriverSelector } from "@/components/racing/driver-selector";
import { Progress } from "@/components/ui/progress";
import { Timer, AlertTriangle, Car, Save, Loader2, Plus, Lock, Copy } from "lucide-react";
import { api, type Driver, type Race, type League } from "@/lib/api";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useSearchParams } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTeamColor } from "@/components/racing/driver-info";
import { usePreferences } from "@/context/preferences-context";
import { races2026 } from "@/data/races-2026";
import { Label } from "@/components/ui/label";

export function PicksScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { timezoneDisplay } = usePreferences();
  const initialLeagueId = searchParams.get("leagueId");

  // Data
  const [leagues, setLeagues] = useState<League[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [nextRace, setNextRace] = useState<Race | null>(null);

  type DriverSelection = { id: string; name: string; team: string; rank: number; avatarUrl?: string } | null;

  // Render variables mapped from drivers array for selectors
  const mapDriverToSelector = (d: Driver) => ({
    id: d.driverId,
    name: `${d.givenName} ${d.familyName}`,
    team: d.constructorName || "Unknown constructor",
    rank: d.rank || 999,
    driverNumber: parseInt(d.permanentNumber || "0") || 0,
  });
  const availableDrivers = useMemo(() => drivers.map(mapDriverToSelector), [drivers]);

  // Predictions State
  const [sprintPredictions, setSprintPredictions] = useState<{
    sprintP1: DriverSelection;
    sprintP2: DriverSelection;
    sprintP3: DriverSelection;
    sprintFastestLap: DriverSelection;
    sprintQualifyingP1: DriverSelection;
  }>({
    sprintP1: null,
    sprintP2: null,
    sprintP3: null,
    sprintFastestLap: null,
    sprintQualifyingP1: null,
  });

  const [racePredictions, setRacePredictions] = useState<{
    raceP1: DriverSelection;
    raceP2: DriverSelection;
    raceP3: DriverSelection;
    fastestLap: DriverSelection;
    raceQualifyingP1: DriverSelection;
    firstDnf: DriverSelection;
  }>({
    raceP1: null,
    raceP2: null,
    raceP3: null,
    fastestLap: null,
    raceQualifyingP1: null,
    firstDnf: null,
  });

  // Fetch Initial Data
  useEffect(() => {
    async function init() {
      try {
        const [racesData, driversData, leaguesData] = await Promise.all([
          api.races.list(),
          api.drivers.list(),
          api.leagues.list(),
        ]);

        setRaces(racesData);
        setDrivers(driversData);
        setLeagues(leaguesData);

        // Find next race
        const next = racesData.find((r) => r.status === "UPCOMING" || r.status === "OPEN");
        setNextRace(next || null);

        // Pre-select the league from the URL param, falling back to the first league
        const targetLeague = initialLeagueId ? leaguesData.find((l) => l.id === initialLeagueId) : undefined;
        const firstLeague = targetLeague || leaguesData[0];
        if (firstLeague) {
          setSelectedLeagueId(firstLeague.id);
        } else {
          toast.info("Join or create a league to make picks!", { id: "no-leagues-toast" });
          navigate("/leagues");
        }
      } catch (error) {
        console.error("Failed to load picks data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [navigate]);

  // Fetch Existing Picks for Selected League & Race
  useEffect(() => {
    if (!selectedLeagueId || !nextRace?.id) return;

    async function fetchPicks() {
      try {
        const data = await api.picks.get(nextRace!.id, selectedLeagueId);
        if (data) {
          // Map backend driver IDs to driver selector objects
          const findDriver = (id: string | null) => availableDrivers.find((d) => d.id === id) || null;

          setSprintPredictions({
            sprintQualifyingP1: findDriver(data.sprint_qualifying_p1),
            sprintP1: findDriver(data.sprint_p1),
            sprintP2: findDriver(data.sprint_p2),
            sprintP3: findDriver(data.sprint_p3),
            sprintFastestLap: findDriver(data.sprint_fastest_lap),
          });

          setRacePredictions({
            raceQualifyingP1: findDriver(data.race_qualifying_p1),
            raceP1: findDriver(data.race_p1),
            raceP2: findDriver(data.race_p2),
            raceP3: findDriver(data.race_p3),
            fastestLap: findDriver(data.fastest_lap),
            firstDnf: findDriver(data.first_dnf),
          });
        }
      } catch (error) {
        // likely 404 if no picks yet, which is fine
        // reset state if empty
        setSprintPredictions({
          sprintP1: null,
          sprintP2: null,
          sprintP3: null,
          sprintFastestLap: null,
          sprintQualifyingP1: null,
        });
        setRacePredictions({
          raceP1: null,
          raceP2: null,
          raceP3: null,
          fastestLap: null,
          raceQualifyingP1: null,
          firstDnf: null,
        });
      }
    }
    fetchPicks();
  }, [selectedLeagueId, nextRace, availableDrivers]);

  // Compute current league scoring config
  const selectedLeague = leagues.find((l) => l.id === selectedLeagueId);
  const scoringConfig = selectedLeague?.scoring_config;

  const staticRaceData = useMemo(() => {
    if (!nextRace) return null;
    return races2026.find(
      (r) =>
        nextRace.name.includes(r.circuitId) ||
        nextRace.name.toLowerCase().includes(r.name.split(" ")[0]?.toLowerCase() ?? "") ||
        r.name.includes(nextRace.name),
    );
  }, [nextRace]);

  const formatSessionTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const timezone = staticRaceData?.timezone;
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

  const handleSprintSelect = (key: keyof typeof sprintPredictions, driver: any) => {
    setSprintPredictions((prev) => {
      // Only clear if selecting a podium slot, and only clear other podium slots
      const podiumKeys = ["sprintP1", "sprintP2", "sprintP3"];
      if (!podiumKeys.includes(key as string)) {
        return { ...prev, [key]: driver };
      }

      const cleared = Object.fromEntries(
        Object.entries(prev).map(([k, v]) =>
          podiumKeys.includes(k) && k !== key && v?.id === driver?.id ? [k, null] : [k, v],
        ),
      ) as typeof prev;
      return { ...cleared, [key]: driver };
    });
  };

  const handleRaceSelect = (key: keyof typeof racePredictions, driver: any) => {
    setRacePredictions((prev) => {
      // Only clear if selecting a podium slot, and only clear other podium slots
      const podiumKeys = ["raceP1", "raceP2", "raceP3"];
      if (!podiumKeys.includes(key as string)) {
        return { ...prev, [key]: driver };
      }

      const cleared = Object.fromEntries(
        Object.entries(prev).map(([k, v]) =>
          podiumKeys.includes(k) && k !== key && v?.id === driver?.id ? [k, null] : [k, v],
        ),
      ) as typeof prev;
      return { ...cleared, [key]: driver };
    });
  };

  const handleSave = async () => {
    if (!selectedLeagueId || !nextRace) return;
    setSaving(true);

    // Construct payload
    // We need to map driver objects back to just names or IDs?
    // Backend likely expects names or IDs.
    // Check backend/src/routes/picks.ts: Zod schema expects strings for driver logic? Or IDs?
    // Actually backend stores JSONB. Logic is inside scoring service.

    // Quick save implementation
    const payload = {
      raceId: nextRace.id,
      leagueId: selectedLeagueId,
      selections: {
        sprintQualifyingP1: sprintPredictions.sprintQualifyingP1?.id || null,
        sprintP1: sprintPredictions.sprintP1?.id || null,
        sprintP2: sprintPredictions.sprintP2?.id || null,
        sprintP3: sprintPredictions.sprintP3?.id || null,
        sprintFastestLap: sprintPredictions.sprintFastestLap?.id || null,
        raceQualifyingP1: racePredictions.raceQualifyingP1?.id || null,
        raceP1: racePredictions.raceP1?.id || null,
        raceP2: racePredictions.raceP2?.id || null,
        raceP3: racePredictions.raceP3?.id || null,
        fastestLap: racePredictions.fastestLap?.id || null,
        firstDnf: racePredictions.firstDnf?.id || null,
      },
    };

    try {
      await api.picks.submit(payload);
      toast.success("Picks saved!");
    } catch (e) {
      toast.error("Failed to save picks");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPicks = async (sourceLeagueId: string) => {
    if (!nextRace?.id) return;

    try {
      const data = await api.picks.get(nextRace.id, sourceLeagueId);
      if (data) {
        const findDriver = (id: string | null) => availableDrivers.find((d) => d.id === id) || null;

        setSprintPredictions({
          sprintQualifyingP1: findDriver(data.sprint_qualifying_p1),
          sprintP1: findDriver(data.sprint_p1),
          sprintP2: findDriver(data.sprint_p2),
          sprintP3: findDriver(data.sprint_p3),
          sprintFastestLap: findDriver(data.sprint_fastest_lap),
        });

        setRacePredictions({
          raceQualifyingP1: findDriver(data.race_qualifying_p1),
          raceP1: findDriver(data.race_p1),
          raceP2: findDriver(data.race_p2),
          raceP3: findDriver(data.race_p3),
          fastestLap: findDriver(data.fastest_lap),
          firstDnf: findDriver(data.first_dnf),
        });

        toast.success(`Copied picks from ${leagues.find((l) => l.id === sourceLeagueId)?.name}`);
      }
    } catch (error) {
      toast.error("No picks found in that league to copy");
    }
  };

  const progress = useMemo(() => {
    let requiredPicks = 0;
    let completedPicks = 0;

    if (!scoringConfig) return 0;

    // Helper to check if a pick is made
    const checkPick = (val: DriverSelection) => {
      requiredPicks++;
      if (val !== null && val !== undefined) completedPicks++;
    };

    // Race Picks
    if (scoringConfig.quali?.enabled) checkPick(racePredictions.raceQualifyingP1);
    if (scoringConfig.p1?.enabled) checkPick(racePredictions.raceP1);
    if (scoringConfig.p2?.enabled) checkPick(racePredictions.raceP2);
    if (scoringConfig.p3?.enabled) checkPick(racePredictions.raceP3);
    if (scoringConfig.fastestLap?.enabled) checkPick(racePredictions.fastestLap);
    if (scoringConfig.firstDNF?.enabled) checkPick(racePredictions.firstDnf);

    // Sprint Picks (Only if race has sprint)
    if (nextRace?.has_sprint) {
      if (scoringConfig.quali?.enabled) checkPick(sprintPredictions.sprintQualifyingP1);
      if (scoringConfig.p1?.enabled) checkPick(sprintPredictions.sprintP1);
      if (scoringConfig.p2?.enabled) checkPick(sprintPredictions.sprintP2);
      if (scoringConfig.p3?.enabled) checkPick(sprintPredictions.sprintP3);
      if (scoringConfig.sprintFastestLap?.enabled) checkPick(sprintPredictions.sprintFastestLap);
    }

    if (requiredPicks === 0) return 0;
    return (completedPicks / requiredPicks) * 100;
  }, [sprintPredictions, racePredictions, scoringConfig, nextRace?.has_sprint]);

  const renderPodiumGroup = (type: "sprint" | "race") => {
    const predictions = type === "sprint" ? sprintPredictions : racePredictions;

    const renderStep = (pos: 1 | 2 | 3, heightCls: string, bgCls: string) => {
      const pKey = type === "sprint" ? `sprintP${pos}` : `raceP${pos}`;
      const selectedDriver = predictions[pKey as keyof typeof predictions] as DriverSelection;

      const isEnabled = scoringConfig?.[`p${pos}` as keyof typeof scoringConfig]?.enabled;
      if (!isEnabled) return null;

      return (
        <DriverSelector
          position={pos}
          drivers={availableDrivers}
          selectedDriver={selectedDriver as any}
          onSelect={(d) => (type === "sprint" ? handleSprintSelect(pKey as any, d) : handleRaceSelect(pKey as any, d))}>
          <div
            className={`flex flex-col items-center justify-end ${heightCls} w-1/3 p-2 rounded-t-xl bg-card border-x border-t relative overflow-visible cursor-pointer hover:bg-muted/50 transition-colors`}>
            <div className={`absolute inset-0 opacity-10 rounded-t-xl ${bgCls}`} />
            <span className="absolute -top-3 bg-background border px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm z-20">
              P{pos}
            </span>
            {selectedDriver ? (
              <div className="flex flex-col items-center text-center gap-1.5 z-10 w-full">
                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                  <AvatarImage src={selectedDriver.avatarUrl} alt={selectedDriver.name} />
                  <AvatarFallback
                    style={{ backgroundColor: getTeamColor(selectedDriver.team), color: "#fff" }}
                    className="text-xs">
                    {selectedDriver.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-bold text-[11px] truncate w-full px-1">
                  {selectedDriver.name.split(" ").pop()}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-1.5 z-10 opacity-50 w-full mb-1">
                <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-[10px] text-muted-foreground italic truncate w-full">Select Pick</span>
              </div>
            )}
          </div>
        </DriverSelector>
      );
    };

    return (
      <div className="flex items-end justify-center gap-1.5 h-36 mb-6 mt-4 w-full px-2 max-w-[320px] mx-auto pt-4 relative isolate">
        {renderStep(2, "h-24", "bg-zinc-400")}
        {renderStep(1, "h-32 shadow-md z-10", "bg-amber-400")}
        {renderStep(3, "h-20", "bg-amber-700")}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-32 md:pb-8 relative">
      {/* Header */}
      <div className="flex flex-col items-center justify-center space-y-4 pt-4">
        <StatusPill variant={nextRace?.status === "OPEN" ? "success" : "neutral"} className="uppercase tracking-wider">
          {nextRace?.status === "OPEN" ? "Picks Open" : "Next Race"}
        </StatusPill>
        <h1 className="text-3xl font-black text-center uppercase italic">{nextRace?.name || "No Upcoming Race"}</h1>
        {nextRace && (
          <div className="flex items-center text-muted-foreground text-sm gap-2">
            <span>{format(new Date(nextRace.date), "MMM d, yyyy")}</span>
          </div>
        )}
        {nextRace && <Countdown targetDate={new Date(nextRace.date)} />}

        {/* League Selector */}
        {leagues.length > 0 && (
          <div
            id="league-select-container"
            className="w-full max-w-[340px] mx-auto mt-4 space-y-1.5 flex flex-col items-start">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">League</Label>
            <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId}>
              <SelectTrigger className="w-full">
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

        {/* Copy Picks Utility */}
        {leagues.length > 1 && (
          <div className="w-full max-w-[340px] mx-auto flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] uppercase tracking-widest font-bold text-primary hover:text-primary/80 gap-1.5 h-auto py-1 px-2">
                  <Copy className="h-3 w-3" />
                  Copy from...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {leagues
                  .filter((l) => l.id !== selectedLeagueId)
                  .map((l) => (
                    <DropdownMenuItem key={l.id} onClick={() => handleCopyPicks(l.id)} className="cursor-pointer">
                      {l.name}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full max-w-md space-y-2 pt-2">
          <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Prediction Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="hidden md:flex w-full max-w-md mx-auto justify-center pt-4">
          <Button
            id="save-picks-btn"
            size="lg"
            className="shadow-lg text-lg font-bold bg-primary text-primary-foreground w-full"
            onClick={handleSave}
            disabled={saving || !nextRace}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Save Picks
          </Button>
        </div>
      </div>

      {!nextRace ? (
        <div className="text-center py-10 opacity-50">No upcoming races found.</div>
      ) : (
        <Tabs defaultValue="race" className="w-full">
          {nextRace.has_sprint && (
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="sprint">Sprint</TabsTrigger>
              <TabsTrigger value="race">Race</TabsTrigger>
            </TabsList>
          )}

          {/* SPRINT TAB */}
          {nextRace.has_sprint && (
            <TabsContent value="sprint" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Sprint Qualifying */}
              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-primary rounded-full" />
                    <h2 className="text-lg font-bold uppercase">Sprint Qualifying</h2>
                  </div>
                  {nextRace.sprint_quali_date && (
                    <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded-md">
                      {formatSessionTime(nextRace.sprint_quali_date)}
                    </span>
                  )}
                </div>
                <Card className="bg-card/50 border-white/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      Sprint Pole Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DriverSelector
                      position={1}
                      drivers={availableDrivers}
                      selectedDriver={sprintPredictions.sprintQualifyingP1}
                      showPosition={false}
                      onSelect={(d) => handleSprintSelect("sprintQualifyingP1", d)}
                    />
                  </CardContent>
                </Card>
              </section>

              {/* Sprint Podium */}
              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-primary rounded-full" />
                    <h2 className="text-lg font-bold uppercase">Sprint Podium</h2>
                  </div>
                  {nextRace.sprint_date && (
                    <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded-md">
                      {formatSessionTime(nextRace.sprint_date)}
                    </span>
                  )}
                </div>
                {renderPodiumGroup("sprint")}
              </section>

              {/* Sprint Fastest Lap - Conditionally Rendered */}
              {scoringConfig?.sprintFastestLap?.enabled && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-4 w-1 bg-primary rounded-full" />
                    <h2 className="text-lg font-bold uppercase">Fastest Lap</h2>
                  </div>
                  <Card className="bg-card/50 border-white/5">
                    <CardContent className="pt-6">
                      <DriverSelector
                        position={0}
                        drivers={availableDrivers}
                        selectedDriver={sprintPredictions.sprintFastestLap}
                        showPosition={false}
                        onSelect={(d) => handleSprintSelect("sprintFastestLap", d)}
                      />
                    </CardContent>
                  </Card>
                </section>
              )}
            </TabsContent>
          )}

          {/* RACE TAB */}
          <TabsContent value="race" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Qualifying */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-primary rounded-full" />
                  <h2 className="text-lg font-bold uppercase">Qualifying</h2>
                </div>
                {nextRace.race_quali_date && (
                  <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded-md">
                    {formatSessionTime(nextRace.race_quali_date)}
                  </span>
                )}
              </div>
              <Card className="bg-card/50 border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Pole Position
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DriverSelector
                    position={1}
                    drivers={availableDrivers}
                    selectedDriver={racePredictions.raceQualifyingP1}
                    showPosition={false}
                    onSelect={(d) => handleRaceSelect("raceQualifyingP1", d)}
                  />
                </CardContent>
              </Card>
            </section>

            {/* The Podium - Only render enabled positions */}
            {(scoringConfig?.p1?.enabled || scoringConfig?.p2?.enabled || scoringConfig?.p3?.enabled) && (
              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-primary rounded-full" />
                    <h2 className="text-lg font-bold uppercase">The Podium</h2>
                  </div>
                  {nextRace.date && (
                    <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded-md">
                      {formatSessionTime(nextRace.date)}
                    </span>
                  )}
                </div>
                {renderPodiumGroup("race")}
              </section>
            )}

            {/* Fastest Lap - Conditionally rendered */}
            {scoringConfig?.fastestLap?.enabled && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-4 w-1 bg-primary rounded-full" />
                  <h2 className="text-lg font-bold uppercase">Fastest Lap</h2>
                </div>
                <Card className="bg-card/50 border-white/5">
                  <CardContent className="pt-6">
                    <DriverSelector
                      position={0}
                      drivers={availableDrivers}
                      selectedDriver={racePredictions.fastestLap}
                      showPosition={false}
                      onSelect={(d) => handleRaceSelect("fastestLap", d)}
                    />
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Reliability & Chaos / First DNF - Conditionally rendered */}
            {scoringConfig?.firstDNF?.enabled && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-4 w-1 bg-primary rounded-full" />
                  <h2 className="text-lg font-bold uppercase">Reliability & Chaos</h2>
                </div>

                <div className="grid gap-4">
                  {/* First DNF */}
                  <Card className="bg-card/50 border-white/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        First DNF
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DriverSelector
                        position={0}
                        drivers={availableDrivers}
                        selectedDriver={racePredictions.firstDnf}
                        showPosition={false}
                        onSelect={(d) => handleRaceSelect("firstDnf", d)}
                      />
                    </CardContent>
                  </Card>
                </div>
              </section>
            )}
          </TabsContent>
        </Tabs>
      )}

      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-background border-t p-4 px-4 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
        <Button
          id="save-picks-btn-mobile"
          size="lg"
          className="w-full text-lg font-bold bg-primary text-primary-foreground"
          onClick={handleSave}
          disabled={saving || !nextRace}>
          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          Save Picks
        </Button>
      </div>
    </div>
  );
}
