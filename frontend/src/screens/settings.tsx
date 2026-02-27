import { useNavigate } from "react-router";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Globe, Bug, Trash2, LogOut } from "lucide-react";
import { useTheme, TEAMS } from "@/context/theme-context";
import { auth } from "@/lib/auth";
import { usePreferences } from "@/context/preferences-context";
import { FeedbackModal } from "@/components/user/feedback-modal";

export function SettingsScreen() {
  const navigate = useNavigate();
  const { currentTeam, setTeam } = useTheme();
  const { timezoneDisplay, setTimezoneDisplay } = usePreferences();

  return (
    <PageContainer title="Settings" subtitle="Manage your app preferences and account">
      <div className="space-y-6">
        {/* Preferences */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Preferences</h2>
          </div>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="timezone">Timezone Display</Label>
                <Select value={timezoneDisplay} onValueChange={(val: "local" | "track") => setTimezoneDisplay(val)}>
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="track">Track Time (Local to Race)</SelectItem>
                    <SelectItem value="local">My Local Time</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose how session times are displayed throughout the app.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="theme">App Theme</Label>
                <Select value={currentTeam.id} onValueChange={(val: string) => setTeam(val)}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAMS.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full shadow-sm"
                            style={{ backgroundColor: team.primaryColor }}
                          />
                          <span>{team.themeName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Beta Support */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Bug className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Beta Support</h2>
          </div>
          <Card>
            <CardContent className="p-4 space-y-3">
              <FeedbackModal />
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground font-mono">
                  App Version: v0.0.1
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1 mt-1">
                    BETA
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Account Management */}
        <section className="space-y-3 pt-6 border-t border-border/10">
          <div className="flex flex-col gap-3">
            <Button variant="outline" className="w-full text-foreground" onClick={() => auth.logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs h-auto py-1 px-2">
                Delete Account
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
