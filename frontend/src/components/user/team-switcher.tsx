import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TEAMS, useTheme } from "@/context/theme-context";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export function TeamSwitcher() {
  const { currentTeam, setTeam } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
        <DropdownMenuLabel>Select Team Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TEAMS.map((team) => (
          <DropdownMenuItem
            key={team.id}
            onClick={() => setTeam(team.id)}
            className="flex items-center justify-between gap-2 cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border border-border" style={{ background: team.primaryColor }} />
              <span className={cn(team.id === currentTeam.id && "font-bold")}>{team.themeName}</span>
            </div>
            {team.id === currentTeam.id && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
