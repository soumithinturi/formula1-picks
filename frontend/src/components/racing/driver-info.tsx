import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface DriverInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  team?: string;
  avatarUrl?: string;
  rank?: number;
}

export function DriverInfo({ name, team, avatarUrl, rank, className, ...props }: DriverInfoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      {rank && <span className="w-8 text-center text-sm font-bold text-muted-foreground mr-1">#{rank}</span>}
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium leading-none">{name}</span>
        {team && <span className="text-xs text-muted-foreground">{team}</span>}
      </div>
    </div>
  );
}
