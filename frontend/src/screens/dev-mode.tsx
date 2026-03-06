import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, type League } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Trash2, LogOut, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DevModeScreen() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    loadLeagues();
  }, []);

  const loadLeagues = async () => {
    setIsLoading(true);
    try {
      const data = await api.leagues.list();
      setLeagues(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load leagues");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveLeague = async () => {
    if (!selectedLeagueId) return;
    setIsActionLoading(true);
    try {
      await api.leagues.leave(selectedLeagueId);
      toast.success("Left league successfully");
      setSelectedLeagueId("");
      await loadLeagues();
    } catch (err: any) {
      toast.error(err.message || "Failed to leave league");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteLeague = async () => {
    if (!selectedLeagueId) return;
    setIsActionLoading(true);
    try {
      await api.leagues.delete(selectedLeagueId);
      toast.success("League deleted successfully");
      setSelectedLeagueId("");
      setIsConfirmOpen(false);
      await loadLeagues();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete league");
    } finally {
      setIsActionLoading(false);
    }
  };

  const selectedLeague = leagues.find((l) => l.id === selectedLeagueId);

  return (
    <PageContainer title="Dev Mode" subtitle="Internal maintenance and debugging tools">
      <div className="space-y-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <CardTitle>League Management</CardTitle>
            </div>
            <CardDescription>Select a league to perform administrative actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select League</label>
              <Select
                value={selectedLeagueId}
                onValueChange={setSelectedLeagueId}
                disabled={isLoading || isActionLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading leagues..." : "Choose a league"} />
                </SelectTrigger>
                <SelectContent>
                  {leagues.map((league) => (
                    <SelectItem key={league.id} value={league.id}>
                      {league.name} ({league.invite_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLeagueId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Leave League
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Removes your membership from this league. You can rejoin via invite code later.
                  </p>
                  <Button variant="outline" className="w-full" onClick={handleLeaveLeague} disabled={isActionLoading}>
                    {isActionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Leave League
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Delete League
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    PERMANENTLY deletes this league, all members, and all picks. Only works if you are the creator.
                  </p>

                  <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full" disabled={isActionLoading}>
                        {isActionLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete League
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete the league
                          <span className="font-bold text-foreground"> "{selectedLeague?.name}" </span>
                          and remove all associated data for all members.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteLeague} disabled={isActionLoading}>
                          {isActionLoading ? (
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
            )}

            {!selectedLeagueId && !isLoading && leagues.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8 italic">
                You are not a member of any leagues.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
