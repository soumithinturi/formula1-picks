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

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success("Invite code copied!");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 max-w-5xl mx-auto">
      <div className="text-center space-y-4 py-8">
        <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-500/5">
          <Check className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">League Ready!</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Your league <span className="font-bold text-foreground">"{league.name}"</span> has been created successfully.
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
              className="flex items-center gap-2 p-4 bg-background/50 rounded-xl border border-white/10"
              onClick={handleCopy}>
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
                  handleCopy();
                }}>
                <Copy className="h-5 w-5" />
              </Button>
            </div>

            <Button variant="outline" className="w-full gap-2 border-primary/20 hover:bg-primary/5">
              <Share2 className="h-4 w-4" /> Share Link
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-8">
        <Button
          onClick={onFinish}
          size="lg"
          className="px-12 py-6 text-lg w-full md:w-auto shadow-lg shadow-primary/20">
          Go to League Dashboard <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
