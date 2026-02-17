import * as React from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PredictionSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  position: number;
  isEmpty?: boolean;
  showPosition?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const PredictionSlot = React.forwardRef<HTMLDivElement, PredictionSlotProps>(
  ({ position, isEmpty = true, showPosition = true, onClick, children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        {showPosition && (
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-muted-foreground border border-border">
            {position}
          </div>
        )}

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
  },
);

PredictionSlot.displayName = "PredictionSlot";
