import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Trophy, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { auth } from "@/lib/auth";

export function InviteScreen() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leagueInfo, setLeagueInfo] = useState<{ id: string; name: string; creatorName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError("No invite code provided.");
      setLoading(false);
      return;
    }

    // Try fetching preview info
    api.leagues
      .preview(code)
      .then((data) => {
        setLeagueInfo(data);
      })
      .catch((err) => {
        setError(String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code]);

  const handleJoin = async () => {
    if (!code) return;

    // Check auth status first. We're protected so this shouldn't happen, but just in case.
    if (!auth.isAuthenticated()) {
      sessionStorage.setItem("post_login_redirect", `/invite/${code}`);
      navigate("/login");
      return;
    }

    setJoining(true);
    try {
      await api.leagues.join(code);
      toast.success("Successfully joined the league!");
      navigate("/leagues");
    } catch (err: any) {
      // Don't error out if they are already in the league
      if (err.message && err.message.toLowerCase().includes("already a member")) {
        toast.success("You are already in this league!");
        navigate("/leagues");
      } else {
        toast.error(err.message || "Failed to join league");
      }
    } finally {
      setJoining(false);
    }
  };

  const handleGoHome = () => navigate("/");

  if (loading) {
    return (
      <PageContainer title="Join League">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (error || !leagueInfo) {
    return (
      <PageContainer title="Join League">
        <Card className="max-w-md mx-auto mt-10 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-destructive mb-2" />
            <h3 className="font-semibold text-lg text-foreground">Invalid Invite Link</h3>
            <p className="text-sm text-muted-foreground">
              This invite link might have expired or the code is incorrect.
            </p>
            <Button onClick={handleGoHome} className="mt-4">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="League Invitation" subtitle={`You have been invited by ${leagueInfo.creatorName}`}>
      <Card className="max-w-md mx-auto mt-6 shadow-xl border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 border-l-60 border-l-transparent border-t-60 border-t-primary/10"></div>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Trophy className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-black uppercase tracking-wide">{leagueInfo.name}</CardTitle>
          <CardDescription className="text-base mt-2">
            Join this private league to compete against other drivers!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4 text-center">
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <div className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mb-1">
              League Code
            </div>
            <div className="font-mono text-2xl font-bold text-foreground tracking-[0.2em]">{code}</div>
          </div>

          <Button size="lg" className="w-full text-lg h-14" disabled={joining} onClick={handleJoin}>
            {joining ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Users className="h-5 w-5 mr-2" />}
            Accept Invite
          </Button>

          <Button variant="ghost" onClick={handleGoHome} disabled={joining} className="w-full">
            Cancel
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
