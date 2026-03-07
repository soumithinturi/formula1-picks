import React from "react";
import { cn } from "@/lib/utils";

interface DisclaimerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "muted" | "small";
}

export function Disclaimer({ className, variant = "default", ...props }: DisclaimerProps) {
  return (
    <div
      className={cn(
        "text-pretty leading-relaxed",
        variant === "default" && "text-sm text-foreground/70",
        variant === "muted" && "text-xs text-muted-foreground/60",
        variant === "small" && "text-[10px] text-muted-foreground/50",
        className,
      )}
      {...props}>
      This is an unofficial fan project and is not affiliated with, or endorsed by, the Formula 1 companies. All
      trademarks and copyrights belong to their respective owners.
    </div>
  );
}
