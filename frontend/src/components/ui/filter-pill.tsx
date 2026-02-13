import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FilterPillProps extends React.ComponentProps<typeof Button> {
  active?: boolean;
}

const FilterPill = React.forwardRef<HTMLButtonElement, FilterPillProps>(
  ({ className, active, variant = "outline", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={active ? "default" : "outline"}
        className={cn(
          "rounded-full px-4 h-8 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all",
          active && "hover:bg-primary hover:text-primary-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);
FilterPill.displayName = "FilterPill";

export { FilterPill };
