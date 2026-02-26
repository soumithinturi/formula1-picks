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

interface Driver {
  id: string;
  name: string;
  team: string;
  avatarUrl?: string;
  rank?: number;
}

interface DriverSelectorProps {
  position: number;
  selectedDriver?: Driver | null;
  drivers: Driver[];
  showPosition?: boolean;
  onSelect: (driver: Driver) => void;
  children?: React.ReactNode;
}

export function DriverSelector({
  position,
  selectedDriver,
  drivers,
  showPosition = true,
  onSelect,
  children,
}: DriverSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (driver: Driver) => {
    onSelect(driver);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
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
                        rank={selectedDriver.rank}
                      />
                    </div>
                  </div>
                );
              })()}
          </PredictionSlot>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Select Driver for P{position}</DialogTitle>
          <DialogDescription className="sr-only">
            Search and select a driver from the grid for this prediction slot.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {Object.entries(
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
                            rank={driver.rank}
                          />
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
