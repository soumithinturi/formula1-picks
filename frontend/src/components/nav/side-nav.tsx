import * as React from "react";
import { NavLink } from "react-router";
import { cn } from "@/lib/utils";
import { Home, Trophy, Users, Calendar, Settings, LogOut, Flag, Archive } from "lucide-react";
import { auth } from "@/lib/auth";

interface SideNavProps extends React.HTMLAttributes<HTMLDivElement> {}

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/leagues", label: "Leagues", icon: Trophy },
  { to: "/picks", label: "Picks", icon: Users },
  { to: "/schedule", label: "Schedule", icon: Calendar },
  // { to: "/more/race-winners-history", label: "Race History", icon: Flag },
  // { to: "/more/leagues-history", label: "League History", icon: Archive },
];

export function SideNav({ className, ...props }: SideNavProps) {
  return (
    <div className={cn("flex flex-col h-full w-64 bg-card border-r border-border p-4", className)} {...props}>
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">F1</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Picks</span>
        </div>
        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1 mt-1">
          BETA
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }>
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-border space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )
          }>
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </NavLink>
        <button
          onClick={() => auth.logout()}
          className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="mr-3 h-5 w-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
