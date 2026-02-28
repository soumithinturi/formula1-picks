import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, CONSTRUCTOR_COLORS } from "@/lib/utils";
import { F1HelmetAvatar } from "@/components/user/f1-helmet-avatar";

interface DriverInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  team?: string;
  avatarUrl?: string;
  driverNumber?: number;
  isCurrentUser?: boolean;
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

export function DriverInfo({
  name,
  team,
  avatarUrl,
  driverNumber,
  isCurrentUser,
  className,
  ...props
}: DriverInfoProps) {
  let isHelmet = false;
  let helmetColor, bgColor;

  try {
    if (avatarUrl) {
      const parsed = JSON.parse(avatarUrl);
      if (parsed.helmetColor || parsed.bgColor) {
        isHelmet = true;
        helmetColor = parsed.helmetColor;
        bgColor = parsed.bgColor;
      }
    }
  } catch (e) {
    // Not a JSON string
  }

  return (
    <div className={cn("flex items-center gap-2 sm:gap-3 w-full", className)} {...props}>
      <Avatar className={cn("h-7 w-7 sm:h-8 sm:w-8 shrink-0", isHelmet ? "overflow-visible" : "")}>
        {isHelmet ? (
          <div className="w-full h-full rounded-full overflow-hidden border">
            <F1HelmetAvatar helmetColor={helmetColor} bgColor={bgColor} />
          </div>
        ) : (
          <AvatarImage src={avatarUrl} alt={name} />
        )}
        {!isHelmet && (
          <AvatarFallback style={{ backgroundColor: getTeamColor(team), color: "#fff" }}>
            {name.charAt(0)}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex flex-col text-left flex-1 min-w-0">
        <span className="text-xs sm:text-sm font-medium leading-none truncate">
          {name}
          {isCurrentUser && <span className="text-primary ml-1">(You)</span>}
        </span>
        {team && <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{team}</span>}
      </div>
      {typeof driverNumber === "number" && (
        <span className="text-sm font-black text-muted-foreground/50 ml-auto pr-1">#{driverNumber}</span>
      )}
    </div>
  );
}
