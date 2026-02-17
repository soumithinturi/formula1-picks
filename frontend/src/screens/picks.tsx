import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/ui/countdown";
import { StatusPill } from "@/components/ui/status-pill";
import { DriverSelector } from "@/components/racing/driver-selector";
import { Progress } from "@/components/ui/progress";
import { Timer, AlertTriangle, Car, Save } from "lucide-react";

// Mock Data
const MOCK_DRIVERS = [
  { id: "ver", name: "Max Verstappen", team: "Red Bull Racing", rank: 1 },
  { id: "per", name: "Sergio Perez", team: "Red Bull Racing", rank: 2 },
  { id: "ham", name: "Lewis Hamilton", team: "Ferrari", rank: 3 },
  { id: "lec", name: "Charles Leclerc", team: "Ferrari", rank: 4 },
  { id: "rus", name: "George Russell", team: "Mercedes", rank: 5 },
  { id: "nor", name: "Lando Norris", team: "McLaren", rank: 6 },
  { id: "pia", name: "Oscar Piastri", team: "McLaren", rank: 7 },
  { id: "alo", name: "Fernando Alonso", team: "Aston Martin", rank: 8 },
  { id: "str", name: "Lance Stroll", team: "Aston Martin", rank: 9 },
  { id: "tsu", name: "Yuki Tsunoda", team: "RB", rank: 10 },
];

const NEXT_RACE_DATE = new Date("2026-05-24T15:00:00"); // Monaco Approx

export function PicksScreen() {
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

  const handleSprintSelect = (key: keyof typeof sprintPredictions, driver: any) => {
    setSprintPredictions((prev) => ({ ...prev, [key]: driver }));
  };

  const handleRaceSelect = (key: keyof typeof racePredictions, driver: any) => {
    setRacePredictions((prev) => ({ ...prev, [key]: driver }));
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
        <Button variant="outline" size="lg" className="text-lg font-bold min-w-[140px]">
          <Save className="w-5 h-5 mr-2" />
          Save Draft
        </Button>
        <Button size="lg" className="shadow-lg text-lg font-bold bg-primary text-primary-foreground min-w-[200px]">
          Lock In Picks
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col items-center justify-center space-y-4 pt-4">
        <StatusPill variant="neutral" className="uppercase tracking-wider">
          Next Race
        </StatusPill>
        <h1 className="text-3xl font-black text-center uppercase italic">Monaco Grand Prix</h1>
        <div className="flex items-center text-muted-foreground text-sm gap-2">
          <span>Monte Carlo, Monaco</span>
          <span>•</span>
          <span>{format(NEXT_RACE_DATE, "MMM d, yyyy")}</span>
        </div>
        <Countdown targetDate={NEXT_RACE_DATE} />

        {/* Progress Bar */}
        <div className="w-full max-w-md space-y-2 pt-2">
          <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Prediction Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <Tabs defaultValue="race" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="sprint">Sprint</TabsTrigger>
          <TabsTrigger value="race">Race</TabsTrigger>
        </TabsList>

        {/* SPRINT TAB */}
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
                  drivers={MOCK_DRIVERS}
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
                      drivers={MOCK_DRIVERS}
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
                  drivers={MOCK_DRIVERS}
                  selectedDriver={sprintPredictions.fastestLap}
                  showPosition={false}
                  onSelect={(d) => handleSprintSelect("fastestLap", d)}
                />
              </CardContent>
            </Card>
          </section>
        </TabsContent>

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
                  drivers={MOCK_DRIVERS}
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
                      drivers={MOCK_DRIVERS}
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
                  drivers={MOCK_DRIVERS}
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
                    drivers={MOCK_DRIVERS}
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

      <div className="fixed bottom-20 left-4 right-4 z-50 md:hidden flex gap-3">
        <Button variant="outline" size="lg" className="flex-1 text-lg font-bold">
          <Save className="w-5 h-5 mr-2" />
          Draft
        </Button>
        <Button size="lg" className="flex-[2] shadow-lg text-lg font-bold bg-primary text-primary-foreground">
          Lock In Picks
        </Button>
      </div>
    </div>
  );
}
