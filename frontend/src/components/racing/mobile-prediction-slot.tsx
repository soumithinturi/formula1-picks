import * as React from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MobilePredictionSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  position: number;
  isEmpty?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function MobilePredictionSlot({
  position,
  isEmpty = true,
  onClick,
  children,
  className,
  ...props
}: MobilePredictionSlotProps) {
  return (
    <div className={cn("relative", className)} {...props}>
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-muted-foreground border border-border">
        {position}
      </div>

      {isEmpty ? (
        <Card
          onClick={onClick}
          className="h-16 flex items-center justify-center border-dashed border-2 border-muted-foreground/20 bg-muted/5 active:scale-95 transition-transform cursor-pointer">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Select Driver</span>
          </div>
        </Card>
      ) : (
        <div onClick={onClick} className="active:scale-95 transition-transform cursor-pointer">
          {children}
        </div>
      )}
    </div>
  );
}
