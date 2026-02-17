import * as React from "react";
import { cn } from "@/lib/utils";
import { Home, Trophy, Users, Calendar, Settings, LogOut, Flag, Archive } from "lucide-react";

import type { Screen } from "@/App";

interface SideNavProps extends React.HTMLAttributes<HTMLDivElement> {
  activeItem?: Screen;
  onNavigate?: (screen: Screen) => void;
}

export function SideNav({ activeItem = "Home", onNavigate, className, ...props }: SideNavProps) {
  const navItems = [
    { name: "Home", label: "Home", icon: Home },
    { name: "Leagues", label: "Leagues", icon: Trophy },
    { name: "Picks", label: "Picks", icon: Users },
    { name: "Schedule", label: "Schedule", icon: Calendar },
    { name: "RaceWinnersHistory", label: "Race History", icon: Flag },
    { name: "LeaguesHistory", label: "League History", icon: Archive },
  ];

  return (
    <div className={cn("flex flex-col h-full w-64 bg-card border-r border-border p-4", className)} {...props}>
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">F1</span>
        </div>
        <span className="text-xl font-bold tracking-tight">Picks</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => onNavigate?.(item.name as Screen)}
            className={cn(
              "flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
              activeItem === item.name
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}>
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-border space-y-1">
        <button className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </button>
        <button className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="mr-3 h-5 w-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
