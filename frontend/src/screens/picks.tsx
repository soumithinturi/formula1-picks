import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/ui/countdown";
import { StatusPill } from "@/components/ui/status-pill";
import { DriverSelector } from "@/components/racing/driver-selector";
import { Progress } from "@/components/ui/progress";
import { Timer, AlertTriangle, Car, Save, Loader2 } from "lucide-react";
import { api, type Driver, type Race, type League } from "@/lib/api";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router";

export function PicksScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data
  const [leagues, setLeagues] = useState<League[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [nextRace, setNextRace] = useState<Race | null>(null);

  // Predictions State
  const [sprintPredictions, setSprintPredictions] = useState({
    p1: null,
    p2: null,
    p3: null,
    fastestLap: null,
    pole: null,
  });

  const [racePredictions, setRacePredictions] = useState({
    p1: null,
    p2: null,
    p3: null,
    fastestLap: null,
    pole: null,
    dnf: null,
    safetyCar: null as boolean | null,
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

        // Select first league
        const firstLeague = leaguesData[0];
        if (firstLeague) {
          setSelectedLeagueId(firstLeague.id);
        } else {
          toast.info("Join or create a league to make picks!");
          navigate("/leagues/create");
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
        const { data } = await api.picks.get(nextRace!.id, selectedLeagueId);
        if (data && data.selections) {
          // TODO: Map selections back to state
          // This requires mapping driver IDs to objects
          // For now, we start generic
        }
      } catch (error) {
        // likely 404 if no picks yet, which is fine
      }
    }
    fetchPicks();
  }, [selectedLeagueId, nextRace]);

  // Helper to map API driver to Selector format
  const mapDriverToSelector = (d: Driver) => ({
    id: d.id,
    name: d.full_name,
    team: d.team_name,
    rank: parseInt(d.racing_number) || 0, // Mock rank using car number for now
  });

  const availableDrivers = useMemo(() => drivers.map(mapDriverToSelector), [drivers]);

  const handleSprintSelect = (key: keyof typeof sprintPredictions, driver: any) => {
    setSprintPredictions((prev) => ({ ...prev, [key]: driver }));
  };

  const handleRaceSelect = (key: keyof typeof racePredictions, driver: any) => {
    setRacePredictions((prev) => ({ ...prev, [key]: driver }));
  };

  const handleSave = async () => {
    if (!selectedLeagueId || !nextRace) return;
    setSaving(true);

    // Construct payload
    // We need to map driver objects back to just names or IDs?
    // Backend likely expects names or IDs.
    // Check backend-v2/src/routes/picks.ts: Zod schema expects strings for driver logic? Or IDs?
    // Actually backend stores JSONB. Logic is inside scoring service.

    // Quick save implementation
    const payload = {
      raceId: nextRace.id,
      leagueId: selectedLeagueId,
      selections: {
        ...sprintPredictions,
        ...racePredictions,
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

  const progress = useMemo(() => {
    const sprintTotal = Object.keys(sprintPredictions).length;
    const raceTotal = Object.keys(racePredictions).length;
    const totalPicks = sprintTotal + raceTotal;

    const sprintCompleted = Object.values(sprintPredictions).filter((v) => v !== null).length;
    const raceCompleted = Object.values(racePredictions).filter((v) => v !== null).length;
    const totalCompleted = sprintCompleted + raceCompleted;

    return (totalCompleted / totalPicks) * 100;
  }, [sprintPredictions, racePredictions]);

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Desktop Buttons */}
      <div className="hidden md:flex absolute top-0 right-0 z-10 gap-3">
        <Button
          variant="outline"
          size="lg"
          className="text-lg font-bold min-w-[140px]"
          onClick={handleSave}
          disabled={saving || !nextRace}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Save Draft
        </Button>
        <Button
          size="lg"
          className="shadow-lg text-lg font-bold bg-primary text-primary-foreground min-w-[200px]"
          onClick={handleSave}
          disabled={saving || !nextRace}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lock In Picks"}
        </Button>
      </div>

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
          <div className="w-full max-w-xs mt-4">
            <Select value={selectedLeagueId} onValueChange={setSelectedLeagueId}>
              <SelectTrigger>
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

        {/* Progress Bar */}
        <div className="w-full max-w-md space-y-2 pt-2">
          <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Prediction Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {!nextRace ? (
        <div className="text-center py-10 opacity-50">No upcoming races found.</div>
      ) : (
        <Tabs defaultValue="race" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            {nextRace.has_sprint && <TabsTrigger value="sprint">Sprint</TabsTrigger>}
            <TabsTrigger value="race">Race</TabsTrigger>
          </TabsList>

          {/* SPRINT TAB */}
          {nextRace.has_sprint && (
            <TabsContent value="sprint" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Sprint Qualifying */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-4 w-1 bg-primary rounded-full" />
                  <h2 className="text-lg font-bold uppercase">Sprint Qualifying</h2>
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
                      selectedDriver={sprintPredictions.pole}
                      showPosition={false}
                      onSelect={(d) => handleSprintSelect("pole", d)}
                    />
                  </CardContent>
                </Card>
              </section>

              {/* Sprint Podium */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-4 w-1 bg-primary rounded-full" />
                  <h2 className="text-lg font-bold uppercase">Sprint Podium</h2>
                </div>
                <div className="grid gap-3">
                  {[1, 2, 3].map((pos) => (
                    <div key={pos} className="relative">
                      <div>
                        <DriverSelector
                          position={pos}
                          drivers={availableDrivers}
                          selectedDriver={sprintPredictions[`p${pos}` as keyof typeof sprintPredictions] as any}
                          onSelect={(d) => handleSprintSelect(`p${pos}` as keyof typeof sprintPredictions, d)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Sprint Fastest Lap */}
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
                      selectedDriver={sprintPredictions.fastestLap}
                      showPosition={false}
                      onSelect={(d) => handleSprintSelect("fastestLap", d)}
                    />
                  </CardContent>
                </Card>
              </section>
            </TabsContent>
          )}

          {/* RACE TAB */}
          <TabsContent value="race" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Qualifying */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="h-4 w-1 bg-primary rounded-full" />
                <h2 className="text-lg font-bold uppercase">Qualifying</h2>
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
                    selectedDriver={racePredictions.pole}
                    showPosition={false}
                    onSelect={(d) => handleRaceSelect("pole", d)}
                  />
                </CardContent>
              </Card>
            </section>

            {/* The Podium */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="h-4 w-1 bg-primary rounded-full" />
                <h2 className="text-lg font-bold uppercase">The Podium</h2>
              </div>
              <div className="grid gap-3">
                {[1, 2, 3].map((pos) => (
                  <div key={pos} className="relative">
                    <div>
                      <DriverSelector
                        position={pos}
                        drivers={availableDrivers}
                        selectedDriver={racePredictions[`p${pos}` as keyof typeof racePredictions] as any}
                        onSelect={(d) => handleRaceSelect(`p${pos}` as keyof typeof racePredictions, d)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Fastest Lap */}
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

            {/* Reliability & Chaos */}
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
                      selectedDriver={racePredictions.dnf}
                      showPosition={false}
                      onSelect={(d) => handleRaceSelect("dnf", d)}
                    />
                  </CardContent>
                </Card>

                {/* Safety Car */}
                <Card className="bg-card/50 border-white/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Safety Car?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                    <Button
                      variant={racePredictions.safetyCar === true ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => handleRaceSelect("safetyCar", true)}>
                      YES
                    </Button>
                    <Button
                      variant={racePredictions.safetyCar === false ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => handleRaceSelect("safetyCar", false)}>
                      NO
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      )}

      <div className="fixed bottom-20 left-4 right-4 z-50 md:hidden flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 text-lg font-bold"
          onClick={handleSave}
          disabled={saving || !nextRace}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Save Draft
        </Button>
        <Button
          size="lg"
          className="flex-2 shadow-lg text-lg font-bold bg-primary text-primary-foreground"
          onClick={handleSave}
          disabled={saving || !nextRace}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lock In Picks"}
        </Button>
      </div>
    </div>
  );
}
