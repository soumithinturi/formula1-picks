import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaderboard } from "@/components/racing/leaderboard";
import { JoinLeagueDialog } from "../components/racing/join-league-dialog";
import { Input } from "@/components/ui/input";
import { Trophy, Users, Copy, Check, Share2, Plus, UserPlus, Loader2, Pencil, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-container";
import { api, type League } from "@/lib/api";
import { TEAMS } from "@/context/theme-context";
import { auth } from "@/lib/auth";

const truncateName = (name: string, length: number = 16) => {
  if (!name) return "";
  return name.length > length ? `${name.substring(0, length)}...` : name;
};

// Extended interface for UI logic
interface UILeague extends League {
  yourRank?: number;
  nextRace?: {
    name: string;
    daysUntil: number;
  };
}

export function LeaguesScreen() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<UILeague[]>([]);
  const [activeLeagueId, setActiveLeagueId] = useState<string>("");
  const [isJoinOpen, setJoinOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedLeagueRef = useRef<HTMLButtonElement>(null);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (selectedLeagueRef.current) {
      selectedLeagueRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeLeagueId]);

  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const currentUser = auth.getUser();

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    if (activeLeagueId) {
      setIsExpanded(false); // Reset expansion state when changing leagues
      fetchLeaderboard(activeLeagueId);
    }
  }, [activeLeagueId]);

  async function fetchLeagues() {
    try {
      const data = await api.leagues.list();
      // Map API data to UI data
      const uiLeagues: UILeague[] = data.map((l) => ({
        ...l,
        yourRank: 0, // Placeholder
        nextRace: undefined, // Placeholder
      }));

      setLeagues(uiLeagues);

      const firstLeague = uiLeagues[0];
      const leagueIdParam = searchParams.get("leagueId");

      if (leagueIdParam && uiLeagues.some((l) => l.id === leagueIdParam)) {
        setActiveLeagueId(leagueIdParam);
        setIsExpanded(true);
        // Clear the search param so it doesn't stick around if user changes tabs later
        setSearchParams(new URLSearchParams(), { replace: true });
      } else if (firstLeague && !activeLeagueId) {
        setActiveLeagueId(firstLeague.id);
      }
    } catch (error) {
      console.error("Failed to fetch leagues:", error);
      toast.error("Failed to load leagues");
    } finally {
      setLoading(false);
    }
  }
  async function fetchLeaderboard(leagueId: string) {
    try {
      const data = await api.leaderboard.get(leagueId);
      // Map to Leaderboard component format
      const mapped = data.map((entry, index) => {
        let teamName = "Independent";
        let avatarLink = undefined;
        try {
          if (entry.avatarUrl) {
            const parsed = JSON.parse(entry.avatarUrl);
            if (parsed.teamId && parsed.teamId !== "default") {
              const foundTeam = TEAMS.find((t) => t.id === parsed.teamId);
              if (foundTeam) {
                teamName = foundTeam.name;
              }
            }
          }
        } catch {
          avatarLink = entry.avatarUrl ?? undefined; // It was a raw URL
        }

        return {
          id: entry.userId,
          rank: index + 1,
          previousRank: index + 1, // Mock
          name: entry.displayName || "Unknown",
          team: teamName,
          predictionsCorrect: entry.leagueCorrectPredictions || 0,
          totalPredictions: entry.leagueTotalPredictions || 0,
          points: entry.totalPoints,
          avatarUrl: entry.avatarUrl, // Pass raw string (URL or JSON) to DriverInfo
        };
      });
      setLeaderboard(mapped);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      // Don't toast here to avoid spamming if switching leagues fast or on init
    }
  }

  const activeLeague = leagues.find((l) => l.id === activeLeagueId);

  const handleSaveLeagueName = async () => {
    if (!activeLeague || draftName.trim() === activeLeague.name || draftName.trim().length < 2) {
      setIsEditingName(false);
      return;
    }

    try {
      setIsSavingName(true);
      const updated = await api.leagues.update(activeLeague.id, { name: draftName.trim() });

      setLeagues((prev) => prev.map((l) => (l.id === activeLeague.id ? { ...l, name: updated.name } : l)));

      setIsEditingName(false);
      toast.success("League name updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update league name");
    } finally {
      setIsSavingName(false);
    }
  };

  const getInviteLink = (code: string) => {
    return `${window.location.origin}/#/invite/${code}`;
  };

  const handleCopyCode = () => {
    if (activeLeague?.invite_code) {
      navigator.clipboard.writeText(activeLeague.invite_code);
      setCopiedCode(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (activeLeague?.invite_code) {
      navigator.clipboard.writeText(getInviteLink(activeLeague.invite_code));
      setCopiedLink(true);
      toast.success("Invite link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShareCode = () => {
    if (activeLeague) {
      if (navigator.share) {
        navigator
          .share({
            title: `Join ${activeLeague.name} on F1 Picks`,
            text: `Join my F1 Picks league: ${activeLeague.name}`,
            url: getInviteLink(activeLeague.invite_code),
          })
          .catch(() => {
            // If share fails, just copy
            handleCopyLink();
          });
      } else {
        handleCopyLink();
      }
    }
  };

  const handleLeagueJoined = (inviteCode: string) => {
    // Refresh list after joining
    fetchLeagues();
    setJoinOpen(false);
  };

  if (loading) {
    return (
      <PageContainer title="Leagues" subtitle="Compete with friends">
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (!activeLeague) {
    return (
      <PageContainer title="Leagues" subtitle="Compete with friends">
        <div className="space-y-6 pb-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Leagues Yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Create your own league or join an existing one to compete with friends!
              </p>
              <div className="flex gap-2">
                <JoinLeagueDialog onLeagueJoined={handleLeagueJoined} />
                <Button onClick={() => navigate("/leagues/create")}>Create League</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Leagues" subtitle="Compete with friends">
      <div className="space-y-4 pb-6">
        {/* League Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {leagues.map((league) => (
            <button
              key={league.id}
              ref={activeLeagueId === league.id ? selectedLeagueRef : null}
              onClick={() => setActiveLeagueId(league.id)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors shrink-0 ${
                activeLeague.id === league.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              title={league.name}>
              <span className="md:hidden">{league.name}</span>
              <span className="hidden md:inline">{truncateName(league.name, 16)}</span>
            </button>
          ))}
        </div>

        {/* Active League Header */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        maxLength={50}
                        autoFocus
                        className="text-xl md:text-2xl font-bold uppercase tracking-wide h-auto py-1 w-[160px] sm:w-[220px] md:w-[280px] text-ellipsis"
                        disabled={isSavingName}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleSaveLeagueName}
                        disabled={isSavingName || draftName.trim().length < 2}
                        className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10 shrink-0">
                        {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingName(false);
                          setDraftName(activeLeague.name);
                        }}
                        disabled={isSavingName}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground ml-1 hidden md:inline-block">
                        {draftName.length}/50
                      </span>
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-2xl font-bold uppercase tracking-wide" title={activeLeague.name}>
                        <span className="md:hidden">{activeLeague.name}</span>
                        <span className="hidden md:inline">{truncateName(activeLeague.name, 16)}</span>
                      </CardTitle>
                      {currentUser?.id === activeLeague.created_by && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDraftName(activeLeague.name);
                            setIsEditingName(true);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                  <Users className="h-4 w-4" />
                  <span>{activeLeague.members_count || 1} Racers</span>
                </div>
              </div>
              {activeLeague.nextRace && (
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground uppercase">Next:</p>
                  <p className="font-bold">{activeLeague.nextRace.name}</p>
                  <p className="text-2xl font-bold text-primary">{activeLeague.nextRace.daysUntil}d</p>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Invite Rivals Section */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Invite Rivals</h3>
                <p className="text-xs text-muted-foreground">Tap link to copy and share</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleShareCode}>
                <Share2 className="h-4 w-4 text-primary" />
              </Button>
            </div>
            <button
              onClick={handleCopyCode}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors group overflow-hidden">
              <span className="text-sm font-medium tracking-tight truncate mr-3">
                Code: <span className="font-mono text-primary text-base ml-1">{activeLeague.invite_code}</span>
              </span>
              {copiedCode ? (
                <Check className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
              )}
            </button>
          </CardContent>
        </Card>

        {/* Standings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Standings</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Leaderboard entries={isExpanded ? leaderboard : leaderboard.slice(0, 5)} />
            {leaderboard.length > 5 && (
              <Button variant="outline" className="w-full" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? "Collapse Standings" : "View Full Standings"}
              </Button>
            )}
          </CardContent>
        </Card>
        {/* FAB */}
        <div className="fixed bottom-24 right-4 z-50 md:bottom-8 md:right-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48 p-2 mb-2">
              <DropdownMenuItem onClick={() => setJoinOpen(true)} className="gap-2 cursor-pointer py-3">
                <UserPlus className="h-4 w-4" />
                <span>Join League</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/leagues/create")} className="gap-2 cursor-pointer py-3">
                <Plus className="h-4 w-4" />
                <span>Create League</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <JoinLeagueDialog open={isJoinOpen} onOpenChange={setJoinOpen} onLeagueJoined={handleLeagueJoined} />
        </div>
      </div>
    </PageContainer>
  );
}
