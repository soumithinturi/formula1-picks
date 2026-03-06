import { useNavigate } from "react-router";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bell, Globe, Bug, Trash2, LogOut, Loader2 } from "lucide-react";
import { useTheme, TEAMS } from "@/context/theme-context";
import { auth } from "@/lib/auth";
import { usePreferences } from "@/context/preferences-context";
import { useTutorial } from "@/context/tutorial-context";
import { FeedbackModal } from "@/components/user/feedback-modal";
import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Disclaimer } from "@/components/ui/disclaimer";
import pkg from "../../package.json";

export function SettingsScreen() {
  const navigate = useNavigate();
  const { currentTeam, setTeam } = useTheme();
  const { timezoneDisplay, setTimezoneDisplay } = usePreferences();
  const { startTour } = useTutorial();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [betaTapCount, setBetaTapCount] = useState(0);

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.toLowerCase() !== "delete my account") return;

    setIsDeleting(true);
    try {
      await api.users.delete();
      auth.logout();
      toast.success("Account deleted successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
      setIsDeleting(false);
    }
  };

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

          <Button
            variant="outline"
            className="w-full mt-2 border-dashed border-primary/40 text-primary hover:bg-primary/5"
            onClick={async () => {
              const leagues = await api.leagues.list().catch(() => []);
              startTour("onboarding", leagues.length);
              navigate("/");
            }}>
            Restart Onboarding Tutorial
          </Button>
        </section>

        {/* Beta Support */}
        <section
          className="space-y-3"
          onClick={() => {
            const nextCount = betaTapCount + 1;
            setBetaTapCount(nextCount);
            if (nextCount >= 10) {
              navigate("/dev-mode");
              setBetaTapCount(0);
            }
          }}>
          <div className="flex items-center gap-2 mb-2 select-none pointer-events-none">
            <Bug className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Beta Support</h2>
          </div>
          <Card className="cursor-default">
            <CardContent className="p-4 space-y-3">
              <FeedbackModal />
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground font-mono">
                  App Version: v{pkg.version}
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1 mt-1">
                    BETA
                  </span>
                </p>
              </div>
              <Disclaimer className="mt-4 pt-4 border-t border-border/50 text-center" variant="muted" />
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
              <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                  setIsDeleteDialogOpen(open);
                  if (!open) setDeleteConfirmationText("");
                }}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs h-auto py-1 px-2">
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-destructive">Delete Account</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account, your picks, and remove
                      you from all leagues. If you created any leagues, they will remain but you will no longer be the
                      owner.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="confirmation">
                        Please type <span className="font-bold">delete my account</span> to confirm.
                      </Label>
                      <Input
                        id="confirmation"
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        placeholder="delete my account"
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmationText.toLowerCase() !== "delete my account" || isDeleting}>
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Confirm Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
