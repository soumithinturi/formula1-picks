import * as React from "react";
import { cn } from "@/lib/utils";
import { Searchbar } from "@/components/ui/searchbar";
import { ProfileHeader } from "@/components/user/profile-header";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderNavProps extends React.HTMLAttributes<HTMLDivElement> {}

import { TeamSwitcher } from "@/components/user/team-switcher";

export function HeaderNav({ className, ...props }: HeaderNavProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between h-16 px-4 md:px-6 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50",
        className,
      )}
      {...props}>
      <div className="flex-1 max-w-sm mr-4">
        <Searchbar placeholder="Search..." className="w-full text-xs md:text-sm pl-8 md:pl-9 h-9" />
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <TeamSwitcher />
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground h-8 w-8 md:h-9 md:w-9">
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full border border-background" />
        </Button>
        <div className="h-6 w-px bg-border mx-1 md:mx-2 hidden sm:block" />

        {/* Desktop Profile Header */}
        <ProfileHeader name="MyUsername" team="Alpine" className="hidden sm:flex" />

        {/* Mobile Profile Badge (Avatar Only) */}
        <Avatar className="h-8 w-8 sm:hidden">
          <AvatarFallback>M</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
