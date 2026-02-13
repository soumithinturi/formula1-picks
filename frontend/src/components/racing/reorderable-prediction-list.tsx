import * as React from "react";
import { Reorder } from "framer-motion";
import { GripVertical } from "lucide-react";
import { DriverInfo } from "./driver-info";
import { Card } from "@/components/ui/card";

interface Driver {
  id: string;
  name: string;
  team: string;
  rank: number;
}

interface ReorderablePredictionListProps {
  items: Driver[];
  onReorder: (newOrder: Driver[]) => void;
}

export function ReorderablePredictionList({ items, onReorder }: ReorderablePredictionListProps) {
  return (
    <Reorder.Group axis="y" values={items} onReorder={onReorder} className="space-y-3">
      {items.map((item, index) => (
        <Reorder.Item key={item.id} value={item}>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-bold text-sm shrink-0">
              {/* Visual Rank is index + 1 */}P{index + 1}
            </div>

            <Card className="flex-1 p-3 bg-card border-primary/20 flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors">
              <GripVertical className="h-5 w-5 text-muted-foreground/50" />
              <div className="flex-1">
                <DriverInfo name={item.name} team={item.team} rank={item.rank} />
              </div>
            </Card>
          </div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
