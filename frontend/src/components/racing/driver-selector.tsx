import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DriverInfo, getTeamColor } from "@/components/racing/driver-info";
import { PredictionSlot } from "@/components/racing/prediction-slot";

export type SortMode = "constructor" | "standings";

interface Driver {
  id: string;
  name: string;
  team: string;
  avatarUrl?: string;
  rank?: number;
  driverNumber?: number;
}

interface DriverSelectorProps {
  position: number;
  selectedDriver?: Driver | null;
  drivers: Driver[];
  showPosition?: boolean;
  onSelect: (driver: Driver) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function DriverSelector({
  position,
  selectedDriver,
  drivers,
  showPosition = true,
  onSelect,
  disabled = false,
  children,
}: DriverSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [sortMode, setSortMode] = React.useState<SortMode>("standings");

  const handleSelect = (driver: Driver) => {
    onSelect(driver);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <DialogTrigger asChild disabled={disabled}>
        {children ? (
          children
        ) : (
          <PredictionSlot position={position} isEmpty={!selectedDriver} showPosition={showPosition}>
            {selectedDriver &&
              (() => {
                const bgColor = getTeamColor(selectedDriver.team);
                return (
                  <div
                    className="bg-card border p-3 rounded-lg relative overflow-hidden flex items-center gap-3"
                    style={{
                      borderColor: bgColor ? `${bgColor}40` : "hsl(var(--primary) / 0.2)",
                    }}>
                    {bgColor && <div className="absolute inset-0 opacity-10" style={{ backgroundColor: bgColor }} />}
                    {bgColor && (
                      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: bgColor }} />
                    )}
                    <div className="relative z-10 w-full">
                      <DriverInfo
                        name={selectedDriver.name}
                        team={selectedDriver.team}
                        avatarUrl={selectedDriver.avatarUrl}
                        driverNumber={selectedDriver.driverNumber}
                      />
                    </div>
                  </div>
                );
              })()}
          </PredictionSlot>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Select Driver for P{position}</DialogTitle>
              <DialogDescription className="text-xs mt-1">Choose a driver for this prediction slot</DialogDescription>
            </div>
            <div className="flex bg-muted/80 p-1 rounded-xl border shadow-inner mr-6">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-4 text-xs rounded-lg font-medium transition-all ${
                  sortMode === "standings"
                    ? "bg-background shadow font-bold text-foreground"
                    : "hover:bg-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setSortMode("standings")}>
                Standings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-4 text-xs rounded-lg font-medium transition-all ${
                  sortMode === "constructor"
                    ? "bg-background shadow font-bold text-foreground"
                    : "hover:bg-transparent text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setSortMode("constructor")}>
                Team
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {sortMode === "constructor" ? (
              Object.entries(
                drivers.reduce(
                  (acc, driver) => {
                    const team = driver.team;
                    if (!acc[team]) acc[team] = [];
                    acc[team].push(driver);
                    return acc;
                  },
                  {} as Record<string, Driver[]>,
                ),
              )
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([team, teamDrivers]) => {
                  const teamColor = getTeamColor(team);
                  return (
                    <div key={team} className="space-y-3 pt-2">
                      <h3
                        className="text-xs font-bold uppercase tracking-widest px-3 border-l-2 flex items-center h-4"
                        style={{
                          borderColor: teamColor || "hsl(var(--primary))",
                          color: teamColor ? `color-mix(in srgb, ${teamColor} 80%, white)` : "inherit",
                        }}>
                        {team}
                      </h3>
                      <div className="space-y-1">
                        {teamDrivers.map((driver) => (
                          <Button
                            key={driver.id}
                            variant="ghost"
                            className="w-full justify-start h-auto py-3 px-4 hover:bg-input/50"
                            onClick={() => handleSelect(driver)}>
                            <DriverInfo
                              name={driver.name}
                              team={driver.team}
                              avatarUrl={driver.avatarUrl}
                              driverNumber={driver.driverNumber}
                            />
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="space-y-1">
                {[...drivers]
                  .sort((a, b) => {
                    // Sort by rank: if rank is missing or 0, push to bottom, otherwise sort ascending
                    const rankA = a.rank && a.rank > 0 ? a.rank : 999;
                    const rankB = b.rank && b.rank > 0 ? b.rank : 999;
                    return rankA - rankB;
                  })
                  .map((driver, index) => (
                    <div key={driver.id} className="flex flex-col">
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-auto py-3 px-4 hover:bg-input/50 relative"
                        onClick={() => handleSelect(driver)}>
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground w-4 text-center">
                          {index + 1}
                        </span>
                        <div className="pl-4 w-full">
                          <DriverInfo
                            name={driver.name}
                            team={driver.team}
                            avatarUrl={driver.avatarUrl}
                            driverNumber={driver.driverNumber}
                          />
                        </div>
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
