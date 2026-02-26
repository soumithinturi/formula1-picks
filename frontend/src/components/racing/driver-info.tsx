import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, CONSTRUCTOR_COLORS } from "@/lib/utils";

interface DriverInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  team?: string;
  avatarUrl?: string;
  rank?: number;
}

export function getTeamColor(teamName?: string): string | undefined {
  if (!teamName) return undefined;
  const tn = teamName.toLowerCase();
  if (tn.includes("red bull")) return CONSTRUCTOR_COLORS.RED_BULL;
  if (tn.includes("ferrari")) return CONSTRUCTOR_COLORS.FERRARI;
  if (tn.includes("mclaren")) return CONSTRUCTOR_COLORS.MCLAREN;
  if (tn.includes("mercedes")) return CONSTRUCTOR_COLORS.MERCEDES;
  if (tn.includes("aston martin")) return CONSTRUCTOR_COLORS.ASTON_MARTIN;
  if (tn.includes("alpine")) return CONSTRUCTOR_COLORS.ALPINE; // Pink/Blue, using pink
  if (tn.includes("williams")) return CONSTRUCTOR_COLORS.WILLIAMS; // Now typically dark blue/light blue
  if (tn.includes("rb f1") || tn.includes("racing bulls")) return CONSTRUCTOR_COLORS.RB;
  if (tn.includes("sauber") || tn.includes("audi")) return CONSTRUCTOR_COLORS.SAUBER; // Stake green (#52E252), but transitioning to Audi Red
  if (tn.includes("haas")) return CONSTRUCTOR_COLORS.HAAS;
  if (tn.includes("cadillac")) return CONSTRUCTOR_COLORS.CADILLAC; // Signature Yellow/Gold
  return undefined;
}

export function DriverInfo({ name, team, avatarUrl, rank, className, ...props }: DriverInfoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      {typeof rank === "number" && (
        <span className="w-8 text-center text-sm font-bold text-muted-foreground mr-1">#{rank}</span>
      )}
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback style={{ backgroundColor: getTeamColor(team), color: "#fff" }}>{name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col text-left">
        <span className="text-sm font-medium leading-none">{name}</span>
        {team && <span className="text-xs text-muted-foreground">{team}</span>}
      </div>
    </div>
  );
}
