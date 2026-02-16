import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Calendar, Settings, User, HelpCircle, ChevronRight } from "lucide-react";

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
}

export function MoreScreen() {
  // Placeholder navigation handlers - will be wired up when routing is implemented
  const handleNavigate = (destination: string) => {
    console.log(`Navigate to: ${destination}`);
  };

  const menuItems: MenuItem[] = [
    {
      id: "race-history",
      title: "Race Winners History",
      description: "Analyze past podiums and race results from all seasons",
      icon: Trophy,
      onClick: () => handleNavigate("race-winners-history"),
    },
    {
      id: "league-history",
      title: "Leagues History",
      description: "Your season archive and past competition records",
      icon: Calendar,
      onClick: () => handleNavigate("leagues-history"),
    },
    {
      id: "settings",
      title: "Settings",
      description: "Manage your preferences and notifications",
      icon: Settings,
      onClick: () => handleNavigate("settings"),
    },
    {
      id: "profile",
      title: "Profile",
      description: "View and edit your profile information",
      icon: User,
      onClick: () => handleNavigate("profile"),
    },
    {
      id: "help",
      title: "Help & Support",
      description: "Get help and learn how to use the app",
      icon: HelpCircle,
      onClick: () => handleNavigate("help"),
    },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">More</h1>
        <p className="text-muted-foreground">Access historical data, manage your account, and explore app features</p>
      </div>

      {/* Menu Items */}
      <div className="space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.id}
              className="cursor-pointer transition-all hover:bg-accent/50 active:scale-[0.98]"
              onClick={item.onClick}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base leading-none mb-1.5">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-snug">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-4 space-y-2 text-center">
        <p className="text-xs text-muted-foreground">© 2024 F1 Podium Predictor</p>
        <p className="text-xs text-muted-foreground">Unofficial Fan App • Not affiliated with Formula 1</p>
      </div>
    </div>
  );
}
