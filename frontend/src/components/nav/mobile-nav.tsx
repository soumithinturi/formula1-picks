import * as React from "react";
import { NavLink } from "react-router";
import { cn } from "@/lib/utils";
import { Home, Trophy, Users, Calendar, Settings } from "lucide-react";

interface MobileNavProps extends React.HTMLAttributes<HTMLDivElement> {}

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/leagues", label: "Leagues", icon: Trophy },
  { to: "/picks", label: "Picks", icon: Users },
  { to: "/schedule", label: "Schedule", icon: Calendar },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav({ className, ...props }: MobileNavProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50 md:hidden",
        className,
      )}
      {...props}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-1 h-full w-full rounded-none transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )
          }>
          {({ isActive }) => (
            <>
              <item.icon className={cn("h-5 w-5", isActive && "fill-current")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
