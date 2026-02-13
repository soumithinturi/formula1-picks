import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusPillVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25",
        warning: "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25",
        error: "bg-red-500/15 text-red-500 hover:bg-red-500/25",
        neutral: "bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface StatusPillProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof statusPillVariants> {}

function StatusPill({ className, variant, ...props }: StatusPillProps) {
  return <div className={cn(statusPillVariants({ variant }), className)} {...props} />;
}

export { StatusPill, statusPillVariants };
