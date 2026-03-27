import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { DriverSelector } from "@/components/racing/driver-selector";
import { Timer, AlertTriangle, Save, Loader2, Plus, Info, CheckCircle2, Bell } from "lucide-react";
import { api, type Driver, type Race } from "@/lib/api";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AdminResultsScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [races, setRaces] = useState<Race[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string>("");

  // Map drivers for selector
  const availableDrivers = useMemo(
    () =>
      drivers.map((d) => ({
        id: d.driverId,
        name: `${d.givenName} ${d.familyName}`,
        team: d.constructorName || "Unknown",
        rank: d.rank || 999,
        driverNumber: parseInt(d.permanentNumber || "0") || 0,
      })),
    [drivers],
  );

  type DriverSelection = { id: string; name: string; team: string; rank: number } | null;

  // Results State
  const [results, setResults] = useState<{
    sprintQualifyingP1: DriverSelection;
    sprintP1: DriverSelection;
    sprintP2: DriverSelection;
    sprintP3: DriverSelection;
    sprintFastestLap: DriverSelection;
    raceQualifyingP1: DriverSelection;
    raceP1: DriverSelection;
    raceP2: DriverSelection;
    raceP3: DriverSelection;
    fastestLap: DriverSelection;
    firstDnf: DriverSelection;
  }>({
    sprintQualifyingP1: null,
    sprintP1: null,
    sprintP2: null,
    sprintP3: null,
    sprintFastestLap: null,
    raceQualifyingP1: null,
    raceP1: null,
    raceP2: null,
    raceP3: null,
    fastestLap: null,
    firstDnf: null,
  });

  // Init Data
  useEffect(() => {
    async function init() {
      try {
        const [racesData, driversData] = await Promise.all([api.races.list(), api.drivers.list()]);
        setRaces(racesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setDrivers(driversData);

        // Default to the most recent upcoming or recent completed race
        const latest = racesData.find((r) => r.status === "UPCOMING") || racesData[0];
        if (latest) setSelectedRaceId(latest.id.toString());
      } catch (e: any) {
        toast.error("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const selectedRace = useMemo(() => races.find((r) => r.id.toString() === selectedRaceId), [races, selectedRaceId]);

  const handleSelect = (key: keyof typeof results, driver: any) => {
    setResults((prev) => ({ ...prev, [key]: driver }));
  };

  const handleSubmit = async () => {
    if (!selectedRace) return;
    setSubmitting(true);

    const payload = {
      raceId: parseInt(selectedRaceId),
      results: {
        sprintQualifyingP1: results.sprintQualifyingP1?.id || null,
        sprintP1: results.sprintP1?.id || null,
        sprintP2: results.sprintP2?.id || null,
        sprintP3: results.sprintP3?.id || null,
        sprintFastestLap: results.sprintFastestLap?.id || null,
        raceQualifyingP1: results.raceQualifyingP1?.id || null,
        raceP1: results.raceP1?.id || null,
        raceP2: results.raceP2?.id || null,
        raceP3: results.raceP3?.id || null,
        fastestLap: results.fastestLap?.id || null,
        firstDnf: results.firstDnf?.id || null,
      },
    };

    try {
      await api.admin.submitResults(payload);
      toast.success("Results submitted successfully! Scoring triggered.");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit results");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading Admin Tools...</p>
      </div>
    );
  }

  const renderSectionHeader = (title: string, icon: React.ReactNode) => (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-6 w-1 bg-primary rounded-full" />
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-black uppercase tracking-tight">{title}</h2>
      </div>
    </div>
  );

  const renderSelectorCard = (label: string, field: keyof typeof results, icon: React.ReactNode) => (
    <Card className="bg-card/50 border-white/5 hover:bg-card/80 transition-colors">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <DriverSelector
          position={0}
          drivers={availableDrivers}
          selectedDriver={results[field] as any}
          showPosition={false}
          onSelect={(d) => handleSelect(field, d)}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <StatusPill variant="neutral" className="bg-primary/10 text-primary border-primary/20">
                Admin Portal
              </StatusPill>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black uppercase italic tracking-tighter">Submit Results</h1>
              <Link to="/admin/notifications">
                <Button variant="outline" size="sm" className="h-8 gap-2 border-primary/20 hover:bg-primary/5">
                  <Bell className="w-3.5 h-3.5" />
                  Trigger Notifications
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-muted-foreground text-sm max-w-md">
            Input official session outcomes. Submitting will immediately trigger global points calculation for all
            leagues.
          </p>
        </div>

        <div className="w-full md:w-64 space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1">
            Target Race
          </Label>
          <Select value={selectedRaceId} onValueChange={setSelectedRaceId}>
            <SelectTrigger className="bg-card/50 border-white/10">
              <SelectValue placeholder="Select Race" />
            </SelectTrigger>
            <SelectContent>
              {races.map((r) => (
                <SelectItem key={r.id} value={r.id.toString()}>
                  {r.name} ({format(new Date(r.date), "MMM d")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedRace && (
        <div className="grid gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Sprint Section */}
          {selectedRace.has_sprint && (
            <section className="space-y-4">
              {renderSectionHeader("Sprint Weekend", <Card className="w-5 h-5" />)}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderSelectorCard("Sprint Pole", "sprintQualifyingP1", <Timer className="w-3.5 h-3.5" />)}
                {renderSelectorCard("Sprint P1", "sprintP1", <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />)}
                {renderSelectorCard("Sprint P2", "sprintP2", <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />)}
                {renderSelectorCard("Sprint P3", "sprintP3", <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />)}
                {renderSelectorCard("Sprint Fastest Lap", "sprintFastestLap", <Timer className="w-3.5 h-3.5" />)}
              </div>
            </section>
          )}

          {/* Main Race Section */}
          <section className="space-y-4">
            {renderSectionHeader("Grand Prix", <Timer className="w-5 h-5" />)}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderSelectorCard("Qualifying Pole", "raceQualifyingP1", <Timer className="w-3.5 h-3.5" />)}
              {renderSelectorCard("Race P1", "raceP1", <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />)}
              {renderSelectorCard("Race P2", "raceP2", <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />)}
              {renderSelectorCard("Race P3", "raceP3", <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />)}
              {renderSelectorCard("Fastest Lap", "fastestLap", <Timer className="w-3.5 h-3.5" />)}
              {renderSelectorCard("First DNF", "firstDnf", <AlertTriangle className="w-3.5 h-3.5 text-destructive" />)}
            </div>
          </section>

          {/* Action Area */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 bg-muted/20 p-6 rounded-2xl border">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                <Info className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold">Final Review Required</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Ensure all selections match the official FIA classifications. Accuracy is critical for league
                  integrity.
                </p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg font-black uppercase italic shadow-2xl shadow-primary/20 w-full md:w-auto">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                  Finalize & Score
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-2 border-primary/20">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black uppercase italic">
                    Submit Official Results?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will lock the race, update the global leaderboard, and notify all users. This cannot be
                    easily undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-bold">Wait, Go Back</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSubmit}
                    className="bg-primary text-primary-foreground font-black uppercase italic">
                    Yes, Finalize Results
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
