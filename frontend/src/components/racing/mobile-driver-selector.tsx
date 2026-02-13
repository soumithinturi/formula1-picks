import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DriverInfo } from "@/components/racing/driver-info";
import { MobilePredictionSlot } from "@/components/racing/mobile-prediction-slot";

interface Driver {
  id: string;
  name: string;
  team: string;
  avatarUrl?: string;
  rank?: number;
}

interface MobileDriverSelectorProps {
  position: number;
  selectedDriver?: Driver | null;
  drivers: Driver[];
  onSelect: (driver: Driver) => void;
}

export function MobileDriverSelector({ position, selectedDriver, drivers, onSelect }: MobileDriverSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (driver: Driver) => {
    onSelect(driver);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <MobilePredictionSlot position={position} isEmpty={!selectedDriver} className="sm:hidden">
          {selectedDriver && (
            <div className="bg-card border border-primary/20 rounded-lg p-3">
              <DriverInfo
                name={selectedDriver.name}
                team={selectedDriver.team}
                avatarUrl={selectedDriver.avatarUrl}
                rank={selectedDriver.rank}
              />
            </div>
          )}
        </MobilePredictionSlot>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Select Driver for P{position}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            {drivers.map((driver) => (
              <Button
                key={driver.id}
                variant="ghost"
                className="w-full justify-start h-auto py-3 px-4 hover:bg-input/50"
                onClick={() => handleSelect(driver)}>
                <DriverInfo name={driver.name} team={driver.team} avatarUrl={driver.avatarUrl} rank={driver.rank} />
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
