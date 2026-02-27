import * as React from "react";
import { cn } from "@/lib/utils";
import { Searchbar } from "@/components/ui/searchbar";
import { ProfileHeader } from "@/components/user/profile-header";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router";
import { F1HelmetAvatar } from "@/components/user/f1-helmet-avatar";

interface HeaderNavProps extends React.HTMLAttributes<HTMLDivElement> {}

import { TeamSwitcher } from "@/components/user/team-switcher";
import { auth, type UserProfile } from "@/lib/auth";
import { TEAMS } from "@/context/theme-context";

export function HeaderNav({ className, ...props }: HeaderNavProps) {
  const [user, setUser] = React.useState<UserProfile | null>(auth.getUser());

  React.useEffect(() => {
    const handleUserUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<UserProfile>;
      setUser(customEvent.detail);
    };

    window.addEventListener("f1_user_updated", handleUserUpdate);
    return () => window.removeEventListener("f1_user_updated", handleUserUpdate);
  }, []);

  const displayName = user?.display_name || user?.contact || "User";
  const avatarChar = displayName.charAt(0).toUpperCase();

  let helmetColors = null;
  let userTeam = TEAMS[1]!;

  if (user?.avatar_url) {
    try {
      const parsed = JSON.parse(user.avatar_url);
      helmetColors = parsed;
      if (parsed.teamId) {
        const found = TEAMS.find((t) => t.id === parsed.teamId);
        if (found) userTeam = found;
      }
    } catch (e) {}
  }

  return (
    <header
      className={cn(
        "flex items-center justify-between h-16 px-4 md:px-6 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50",
        className,
      )}
      {...props}>
      <div className="flex-1 max-w-sm mr-4">
        {/* <Searchbar placeholder="Search..." className="w-full text-xs md:text-sm pl-8 md:pl-9 h-9" /> */}
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <TeamSwitcher />
        <div className="h-6 w-px bg-border mx-1 md:mx-2 hidden sm:block" />

        {/* Desktop Profile Header */}
        <Link to="/profile" className="hidden sm:block">
          <ProfileHeader
            name={displayName}
            team={userTeam.name}
            teamId={userTeam.id}
            className="hover:opacity-80 transition-opacity cursor-pointer"
            avatarData={user?.avatar_url}
          />
        </Link>

        {/* Mobile Profile Badge (Avatar Only) */}
        <Link to="/profile" className="sm:hidden block">
          {helmetColors ? (
            <div className="h-8 w-8 aspect-square rounded-full shrink-0">
              <F1HelmetAvatar helmetColor={helmetColors.helmetColor} bgColor={helmetColors.bgColor} />
            </div>
          ) : (
            <Avatar className="h-8 w-8">
              <AvatarFallback>{avatarChar}</AvatarFallback>
            </Avatar>
          )}
        </Link>
      </div>
    </header>
  );
}
