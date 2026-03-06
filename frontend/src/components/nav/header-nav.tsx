import * as React from "react";
import { cn } from "@/lib/utils";
import { ProfileHeader } from "@/components/user/profile-header";
import { Bell, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router";
import { F1HelmetAvatar } from "@/components/user/f1-helmet-avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationPanel } from "@/components/notifications/notification-panel";
import { useNotifications } from "@/context/notification-context";

interface HeaderNavProps extends React.HTMLAttributes<HTMLDivElement> {}

import { TeamSwitcher } from "@/components/user/team-switcher";
import { auth, type UserProfile } from "@/lib/auth";
import { TEAMS } from "@/context/theme-context";

export function HeaderNav({ className, ...props }: HeaderNavProps) {
  const [user, setUser] = React.useState<UserProfile | null>(auth.getUser());
  const [notifOpen, setNotifOpen] = React.useState(false);
  const { unreadCount, markAllRead } = useNotifications();

  React.useEffect(() => {
    const handleUserUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<UserProfile>;
      setUser(customEvent.detail);
    };

    window.addEventListener("f1_user_updated", handleUserUpdate);
    return () => window.removeEventListener("f1_user_updated", handleUserUpdate);
  }, []);

  const handleNotifOpen = (open: boolean) => {
    setNotifOpen(open);
    // Mark all as read when the panel is opened
    if (open && unreadCount > 0) {
      markAllRead();
    }
  };

  const displayName = user?.display_name || user?.contact || "User";
  const avatarChar = displayName.charAt(0).toUpperCase();

  let helmetColors = null;
  let userTeam = TEAMS[0]!;

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
      <div className="flex items-center gap-2 md:hidden mr-auto">
        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-lg">F1</span>
        </div>
        <span className="text-xl font-bold tracking-tight">Picks</span>
      </div>

      <div className="hidden md:flex flex-1 max-w-sm mr-4">
        {/* <Searchbar placeholder="Search..." className="w-full text-xs md:text-sm pl-8 md:pl-9 h-9" /> */}
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0" id="profile-theme-group">
        {/* Notification Bell */}
        <Popover open={notifOpen} onOpenChange={handleNotifOpen}>
          <PopoverTrigger asChild>
            <Button
              id="notification-bell-btn"
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60">
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="p-0 rounded-xl overflow-hidden border-border/60 shadow-2xl w-auto">
            <NotificationPanel />
          </PopoverContent>
        </Popover>

        <TeamSwitcher />

        <div className="h-6 w-px bg-border mx-1 md:mx-2 hidden sm:block" />

        {/* Desktop Profile Header */}
        <Link to="/profile" className="hidden sm:block" id="profile-header-tour">
          <ProfileHeader
            name={displayName}
            team={userTeam.name}
            teamId={userTeam.id}
            className="hover:opacity-80 transition-opacity cursor-pointer"
            avatarData={user?.avatar_url}
          />
        </Link>

        {/* Mobile Profile Badge (Avatar Only) */}
        <Link to="/profile" className="sm:hidden block" id="profile-header-tour-mobile">
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
