import * as React from "react";
import { cn } from "@/lib/utils";
import { Home, Trophy, Users, Calendar, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Screen } from "@/App";

interface MobileNavProps extends React.HTMLAttributes<HTMLDivElement> {
  activeItem?: Screen;
  onNavigate?: (screen: Screen) => void;
}

export function MobileNav({ activeItem = "Home", onNavigate, className, ...props }: MobileNavProps) {
  const navItems = [
    { name: "Home", icon: Home },
    { name: "Leagues", icon: Trophy },
    { name: "Picks", icon: Users },
    { name: "Schedule", icon: Calendar },
    { name: "More", icon: Menu },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50 md:hidden",
        className,
      )}
      {...props}>
      {navItems.map((item) => (
        <Button
          key={item.name}
          variant="ghost"
          size="icon"
          onClick={() => onNavigate?.(item.name as Screen)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full w-full rounded-none",
            activeItem === item.name ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}>
          <item.icon className={cn("h-5 w-5", activeItem === item.name && "fill-current")} />
          <span className="text-[10px] font-medium">{item.name}</span>
        </Button>
      ))}
    </div>
  );
}
