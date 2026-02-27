import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { F1HelmetAvatar } from "./f1-helmet-avatar";

interface ProfileHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  team?: string;
  avatarData?: string | null;
}

export function ProfileHeader({ name, team, avatarData, className, ...props }: ProfileHeaderProps) {
  let helmetColors = null;
  if (avatarData) {
    try {
      helmetColors = JSON.parse(avatarData);
    } catch (e) {}
  }

  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      {helmetColors ? (
        <div className="w-10 h-10 aspect-square rounded-full shrink-0">
          <F1HelmetAvatar helmetColor={helmetColors.helmetColor} bgColor={helmetColors.bgColor} />
        </div>
      ) : (
        <Avatar>
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-none">{name}</span>
        {team && <span className="text-xs text-muted-foreground">{team}</span>}
      </div>
    </div>
  );
}
