import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Copy, Share2, ArrowRight, Info } from "lucide-react";
import type { League } from "@/lib/api";
import { toast } from "sonner";

interface Rule {
  enabled: boolean;
  points: number;
}

interface Step3Props {
  league: League;
  rules: {
    p1: Rule;
    p2: Rule;
    p3: Rule;
    quali: Rule;
    podium: Rule;
    perfectOrder: Rule;
    fastestLap: Rule;
    firstDNF: Rule;
  };
  onFinish: () => void;
  onBack: () => void;
}

export function Step3({ league, rules, onFinish, onBack }: Step3Props) {
  const inviteCode = league.invite_code;

  const getInviteLink = (code: string) => `${window.location.origin}/#/invite/${code}`;

  const handleCopyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(getInviteLink(inviteCode));
      toast.success("Invite link copied!");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Join ${league.name} on F1 Picks`,
          text: `Join my F1 Picks league: ${league.name}`,
          url: getInviteLink(inviteCode),
        })
        .then(() => toast.success("Shared successfully!"))
        .catch(() => {
          // If share fails or is cancelled, fallback to copy
          handleCopyInviteCode();
        });
    } else {
      handleCopyInviteCode();
    }
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 max-w-5xl mx-auto">
        <div className="text-center space-y-4 py-8">
          <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-500/5">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">League Ready!</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Your league <span className="font-bold text-foreground">"{league.name}"</span> has been created
            successfully.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border border-white/10 bg-card/50 backdrop-blur-sm h-full">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                League Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="font-bold text-xl capitalize">Private League</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Max Points Per Race</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {Object.values(rules).reduce((acc, r) => acc + (r.enabled ? r.points : 0), 0)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">PTS</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Scoring Rules</p>
                <div className="space-y-1 mt-2 border border-white/10 rounded-lg overflow-hidden">
                  {(Object.keys(rules) as Array<keyof typeof rules>)
                    .filter((key) => rules[key].enabled)
                    .map((key) => {
                      const rule = rules[key];
                      const labels: Record<string, string> = {
                        p1: "Race Winner",
                        p2: "P2 Finish",
                        p3: "P3 Finish",
                        quali: "Pole Sitter",
                        podium: "Podium Bonus",
                        perfectOrder: "Perfect Order",
                        fastestLap: "Fastest Lap",
                        firstDNF: "First DNF",
                      };

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 bg-white/5 border-b border-white/5 last:border-0 hover:bg-white/10 transition-colors">
                          <span className="font-medium text-sm">{labels[key]}</span>
                          <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded">
                            +{rule.points} pts
                          </span>
                        </div>
                      );
                    })}
                </div>
                <div className="mt-4 bg-primary/10 border border-primary/20 rounded-lg p-3 flex gap-3 items-start">
                  <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    <span className="font-bold text-foreground">Sprint Races:</span> P1, P2, P3, Qualifying, and Fastest
                    Lap rules will also apply to Sprints.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-card/50 backdrop-blur-sm h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Invite Friends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">
              <p className="text-muted-foreground">Share this unique code to let others join your grid immediately.</p>

              <div
                className="flex items-center gap-2 p-4 bg-background/50 rounded-xl border border-white/10 cursor-pointer"
                onClick={handleCopyInviteCode}>
                <code
                  className="flex-1 text-center font-mono text-2xl font-bold tracking-widest text-primary cursor-pointer hover:bg-background/80 rounded transition-colors"
                  title="Click to copy">
                  {inviteCode}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-background"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyInviteCode();
                  }}>
                  <Copy className="h-5 w-5" />
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 border-primary/20 hover:bg-primary/5"
                onClick={handleShare}>
                <Share2 className="h-4 w-4" /> Share Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Desktop Navigation Bar */}
      <div className="hidden md:block fixed bottom-0 left-0 md:left-64 right-0 z-40 bg-background border-t p-4 px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
            Back
          </Button>
          <Button onClick={onFinish}>
            Go to League Dashboard <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Floating Actions */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 z-40 px-6 flex items-center gap-3 pointer-events-none">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 px-6 shrink-0 font-bold border border-white/10 bg-black/70 backdrop-blur-xl rounded-full pointer-events-auto shadow-2xl text-muted-foreground hover:bg-black/80"
          onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onFinish}
          className="flex-1 shadow-2xl text-lg font-bold bg-primary/85 backdrop-blur-xl border-t border-white/20 text-primary-foreground rounded-full pointer-events-auto">
          Finish <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </>
  );
}
