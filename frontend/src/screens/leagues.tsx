import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaderboard } from "@/components/racing/leaderboard";
import { CreateLeagueDialog } from "../components/racing/create-league-dialog";
import { JoinLeagueDialog } from "../components/racing/join-league-dialog";
import { Trophy, Users, Copy, Check, Share2, Plus, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-container";

interface League {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  yourRank: number;
  inviteCode: string;
  nextRace?: {
    name: string;
    daysUntil: number;
  };
}

export function LeaguesScreen() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<League[]>([
    {
      id: "1",
      name: "Work Crew",
      description: "Office racing league",
      memberCount: 12,
      yourRank: 5,
      inviteCode: "RACE-99X",
      nextRace: {
        name: "MONACO",
        daysUntil: 3,
      },
    },
    {
      id: "2",
      name: "Family",
      memberCount: 8,
      yourRank: 2,
      inviteCode: "FAM-456",
      nextRace: {
        name: "MONACO",
        daysUntil: 3,
      },
    },
    {
      id: "3",
      name: "Local Karting",
      memberCount: 15,
      yourRank: 8,
      inviteCode: "KART-789",
      nextRace: {
        name: "MONACO",
        daysUntil: 3,
      },
    },
  ]);

  const [activeLeagueId, setActiveLeagueId] = useState<string>(leagues[0]?.id || "");
  const [isJoinOpen, setJoinOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeLeague = leagues.find((l) => l.id === activeLeagueId);

  // Mock leaderboard data
  const mockLeaderboardData = [
    {
      id: "1",
      rank: 1,
      previousRank: 2,
      name: "SpeedDemon",
      team: "Red Bull Racing",
      predictionsCorrect: 5,
      totalPredictions: 5,
      points: 150,
      avatarUrl: "",
    },
    {
      id: "2",
      rank: 2,
      previousRank: 1,
      name: "BoxBoxBox",
      team: "Ferrari",
      predictionsCorrect: 4,
      totalPredictions: 5,
      points: 142,
    },
    {
      id: "3",
      rank: 3,
      previousRank: 4,
      name: "Tifosi4Life",
      team: "Ferrari",
      predictionsCorrect: 4,
      totalPredictions: 5,
      points: 138,
    },
    {
      id: "4",
      rank: 4,
      previousRank: 3,
      name: "LateBraker",
      team: "Mercedes",
      predictionsCorrect: 3,
      totalPredictions: 5,
      points: 112,
    },
  ];

  const handleCopyInviteCode = () => {
    if (activeLeague?.inviteCode) {
      navigator.clipboard.writeText(activeLeague.inviteCode);
      setCopiedCode(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShareCode = () => {
    if (activeLeague) {
      if (navigator.share) {
        navigator
          .share({
            title: `Join ${activeLeague.name} on F1 Picks`,
            text: `Use code ${activeLeague.inviteCode} to join my league!`,
          })
          .catch(() => {
            // If share fails, just copy
            handleCopyInviteCode();
          });
      } else {
        handleCopyInviteCode();
      }
    }
  };

  const handleLeagueCreated = (newLeague: { name: string; description: string; inviteCode: string }) => {
    // This will likely be handled by the backend/wizard completion in the future
    // For now we just add it purely for demo consistency if needed, but the Wizard handles its own completion logic
    // We might need to lift state up or pass a callback to the wizard if we want the data back here immediately.
    // For this step, we'll just log or ignore, as the prompt is about screens.
    console.log("League created", newLeague);
  };

  const handleLeagueJoined = (inviteCode: string) => {
    const newLeague: League = {
      id: Date.now().toString(),
      name: `League ${inviteCode}`,
      memberCount: Math.floor(Math.random() * 20) + 5,
      yourRank: Math.floor(Math.random() * 15) + 1,
      inviteCode,
      nextRace: {
        name: "MONACO",
        daysUntil: 3,
      },
    };
    setLeagues([...leagues, newLeague]);
    setActiveLeagueId(newLeague.id);
  };

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
              onClick={() => setActiveLeagueId(league.id)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors shrink-0 ${
                activeLeague.id === league.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}>
              {league.name}
            </button>
          ))}
        </div>

        {/* Active League Header */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-2xl font-bold uppercase tracking-wide">{activeLeague.name}</CardTitle>
                  <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded">
                    PRIVATE
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                  <Users className="h-4 w-4" />
                  <span>{activeLeague.memberCount} Racers</span>
                  <span>•</span>
                  <span>Season 2024</span>
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
                <p className="text-xs text-muted-foreground">Tap code to copy and share</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleShareCode}>
                <Share2 className="h-4 w-4 text-primary" />
              </Button>
            </div>
            <button
              onClick={handleCopyInviteCode}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors group">
              <code className="text-lg font-mono font-bold tracking-wider text-primary">{activeLeague.inviteCode}</code>
              {copiedCode ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
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
              <span className="text-xs font-semibold text-muted-foreground uppercase">League Standings</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Leaderboard entries={mockLeaderboardData} />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/leagues/${activeLeagueId}/standings`)}>
              View Full Standings
            </Button>
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
