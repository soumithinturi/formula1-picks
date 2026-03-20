import * as React from "react";
import { NavLink } from "react-router";
import { cn } from "@/lib/utils";
import { Home, Trophy, Users, Calendar, Settings, LogOut, Megaphone, ShieldCheck, Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { Disclaimer } from "@/components/ui/disclaimer";

interface SideNavProps extends React.HTMLAttributes<HTMLDivElement> {}

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/leagues", label: "Leagues", icon: Trophy },
  { to: "/picks", label: "Picks", icon: Users },
  { to: "/schedule", label: "Schedule", icon: Calendar },
  { to: "/changelog", label: "What's New", icon: Megaphone },
  // { to: "/more/race-winners-history", label: "Race History", icon: Flag },
  // { to: "/more/leagues-history", label: "League History", icon: Archive },
];

export function SideNav({ className, ...props }: SideNavProps) {
  return (
    <div className={cn("flex flex-col h-full w-64 bg-card border-r border-border p-4", className)} {...props}>
      <div className="flex items-center gap-2 mb-8 px-2">
        <img src="/assets/icon-192x192.png" alt="F1 Picks" className="h-8 w-8 shrink-0 object-contain" />
        <span className="text-xl font-black uppercase italic tracking-tighter">Picks</span>
        <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mt-1">
          BETA
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            id={
              item.to === "/leagues"
                ? "nav-leagues"
                : item.to === "/picks"
                  ? "nav-picks"
                  : item.to === "/schedule"
                    ? "nav-schedule"
                    : item.to === "/changelog"
                      ? "nav-changelog"
                      : undefined
            }
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

        {auth.getUser()?.role === "ADMIN" && (
          <div className="pt-4 mt-4 border-t border-border/50">
            <h3 className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
              Admin Tools
            </h3>
            <div className="space-y-1">
              <NavLink
                to="/admin/results"
                className={({ isActive }) =>
                  cn(
                    "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }>
                <ShieldCheck className="mr-3 h-4 w-4" />
                Submit Results
              </NavLink>
              <NavLink
                to="/admin/notifications"
                className={({ isActive }) =>
                  cn(
                    "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }>
                <Bell className="mr-3 h-4 w-4" />
                Notification Test
              </NavLink>
            </div>
          </div>
        )}
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

      <div className="mt-6 px-2">
        <Disclaimer variant="small" />
      </div>
    </div>
  );
}
