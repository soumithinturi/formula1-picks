import React from "react";
import { Bell, Trophy, Clock, Users, CheckCheck } from "lucide-react";
import { useNotifications } from "@/context/notification-context";
import type { Notification } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_CONFIG: Record<Notification["type"], { icon: React.ElementType; color: string; bg: string }> = {
  RESULTS_IN: {
    icon: Trophy,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  PICKS_DUE: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  LEAGUE_ACTIVITY: {
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
};

interface NotificationItemProps {
  notification: Notification;
}

function NotificationItem({ notification }: NotificationItemProps) {
  const config = TYPE_CONFIG[notification.type];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-start gap-3 px-4 py-3 transition-colors", !notification.is_read && "bg-primary/5")}>
      <div className={cn("rounded-full p-2 shrink-0 mt-0.5", config.bg)}>
        <Icon className={cn("h-3.5 w-3.5", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold leading-snug", !notification.is_read && "text-foreground")}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notification.body}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium uppercase tracking-wide">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
    </div>
  );
}

export function NotificationPanel() {
  const { notifications, unreadCount, markAllRead, isLoading } = useNotifications();

  return (
    <div className="w-80 max-h-[480px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-foreground" />
          <span className="font-bold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-black bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors font-medium uppercase tracking-wide">
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col divide-y divide-border/50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2.5 bg-muted rounded w-full" />
                  <div className="h-2 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <span className="text-xl">🏁</span>
            </div>
            <p className="text-sm font-semibold text-foreground">You're all caught up</p>
            <p className="text-xs text-muted-foreground mt-1">Notifications will appear here when results come in.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
