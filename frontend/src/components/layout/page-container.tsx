import React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ title, subtitle, action, children, className }: PageContainerProps) {
  return (
    <div className={cn("h-full w-full overflow-y-auto bg-background relative", className)}>
      <div className="min-h-full pb-24 md:pb-8">
        <div className="px-2 pt-2 pb-6">
          {/* Header */}
          <div className="flex items-end justify-between mb-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
              {subtitle && <p className="text-muted-foreground font-medium text-sm">{subtitle}</p>}
            </div>
            {action && <div className="pb-1">{action}</div>}
          </div>

          {/* Main Content */}
          <div className="space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
