import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  team?: string;
  avatarUrl?: string;
}

export function ProfileHeader({ name, team, avatarUrl, className, ...props }: ProfileHeaderProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      <Avatar>
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-none">{name}</span>
        {team && <span className="text-xs text-muted-foreground">{team}</span>}
      </div>
    </div>
  );
}
