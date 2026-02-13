import * as React from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface PredictionSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  position: number;
  isEmpty?: boolean;
  children?: React.ReactNode;
}

export function PredictionSlot({ position, isEmpty = true, children, className, ...props }: PredictionSlotProps) {
  return (
    <div className={cn("flex items-center gap-4", className)} {...props}>
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-bold text-sm">
        {position}
      </div>

      {isEmpty ? (
        <div className="flex-1 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group">
          <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground">
            <Plus className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Drop Driver Here</span>
          </div>
        </div>
      ) : (
        <div className="flex-1">{children}</div>
      )}
    </div>
  );
}
