import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Info, Minus, Plus, ChevronRight, AlertTriangle, Lightbulb, XCircle } from "lucide-react";
interface Rule {
  enabled: boolean;
  points: number;
}

interface Step2Props {
  initialData: {
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
  };
  onNext: (data: {
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
  }) => void;
  onBack: () => void;
}

export function Step2({ initialData, onNext, onBack }: Step2Props) {
  const [rules, setRules] = useState(initialData.rules);

  const toggleRule = (key: keyof typeof rules) => {
    setRules((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  const updatePoints = (key: keyof typeof rules, delta: number) => {
    setRules((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        points: Math.max(0, prev[key].points + delta),
      },
    }));
  };

  const activeRulesCount = Object.values(rules).filter((r) => r.enabled).length;
  const maxPoints = Object.values(rules).reduce((acc, r) => acc + (r.enabled ? r.points : 0), 0);

  return (
    <>
      <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-6xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Rules Configuration */}
          <div className="flex-1 flex flex-col">
            <div className="space-y-2 shrink-0">
              <h1 className="text-3xl font-bold tracking-tight">League Scoring Rules</h1>
              <div className="h-1 w-20 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-2/3" />
              </div>
            </div>

            <p className="text-muted-foreground shrink-0 mt-4 mb-4 pr-4">
              Customize how points are awarded in your private league. Enable or disable specific rules and set their
              point values.
            </p>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-6 shrink-0 flex gap-3 items-start mr-4">
              <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground/80 leading-relaxed">
                <span className="font-bold text-foreground">Sprint Races:</span> The points configured below for P1, P2,
                P3, Qualifying Winner (Sprint Shootout P1), and Fastest Lap will also apply to Sprint races.
              </p>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Standard Rules</h2>
                <RuleCard
                  title="Race Winner (P1)"
                  description="Points for correctly predicting the race winner."
                  enabled={rules.p1.enabled}
                  points={rules.p1.points}
                  onToggle={() => toggleRule("p1")}
                  onPointsChange={(d) => updatePoints("p1", d)}
                />
                <RuleCard
                  title="Second Place (P2)"
                  description="Points for correctly predicting the second place finisher."
                  enabled={rules.p2.enabled}
                  points={rules.p2.points}
                  onToggle={() => toggleRule("p2")}
                  onPointsChange={(d) => updatePoints("p2", d)}
                />
                <RuleCard
                  title="Third Place (P3)"
                  description="Points for correctly predicting the third place finisher."
                  enabled={rules.p3.enabled}
                  points={rules.p3.points}
                  onToggle={() => toggleRule("p3")}
                  onPointsChange={(d) => updatePoints("p3", d)}
                />
                <RuleCard
                  title="Qualifying Winner"
                  description="Points for predicting the Pole Sitter from qualifying."
                  enabled={rules.quali.enabled}
                  points={rules.quali.points}
                  onToggle={() => toggleRule("quali")}
                  onPointsChange={(d) => updatePoints("quali", d)}
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Bonus Rules</h2>
                <RuleCard
                  title="Correct Podium"
                  description="Points awarded for any driver who finishes in the top 3"
                  enabled={rules.podium.enabled}
                  points={rules.podium.points}
                  onToggle={() => toggleRule("podium")}
                  onPointsChange={(d) => updatePoints("podium", d)}
                />
                <RuleCard
                  title="Perfect Order Bonus"
                  description="Extra points if P1, P2, and P3 are predicted in exact order"
                  enabled={rules.perfectOrder.enabled}
                  points={rules.perfectOrder.points}
                  onToggle={() => toggleRule("perfectOrder")}
                  onPointsChange={(d) => updatePoints("perfectOrder", d)}
                />
                <RuleCard
                  title="Fastest Lap"
                  description="Guess which driver sets the fastest lap of the race"
                  enabled={rules.fastestLap.enabled}
                  points={rules.fastestLap.points}
                  onToggle={() => toggleRule("fastestLap")}
                  onPointsChange={(d) => updatePoints("fastestLap", d)}
                />
                <RuleCard
                  title="First DNF"
                  description="Predict the first driver to retire from the race"
                  enabled={rules.firstDNF.enabled}
                  points={rules.firstDNF.points}
                  onToggle={() => toggleRule("firstDNF")}
                  onPointsChange={(d) => updatePoints("firstDNF", d)}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Summary & Preview — single sticky block */}
          <div className="hidden lg:flex lg:w-80 xl:w-96 shrink-0 flex-col gap-4 sticky top-24 h-fit">
            <Card className="border border-white/10 bg-card/30 backdrop-blur-sm">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">Summary Preview</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Rules Enabled:</span>
                    <span className="font-bold">{activeRulesCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Base Difficulty:</span>
                    <span className={`font-bold ${maxPoints > 40 ? "text-red-500" : "text-green-500"}`}>
                      {maxPoints > 40 ? "Competitive" : "Casual"}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Max Points Per Race</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{maxPoints}</span>
                      <span className="text-sm font-medium text-muted-foreground">PTS</span>
                    </div>
                  </div>
                </div>

                <div className="bg-background/40 p-4 rounded-lg border border-white/5 space-y-2">
                  <div className="flex gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-bold text-foreground">Tip:</span> Higher point values for "Perfect Order"
                      encourage more strategic, risky predictions!
                    </p>
                  </div>
                </div>

                {/* Live Competition — merged into same card */}
                <div className="pt-4 border-t border-white/5">
                  <h3 className="font-bold text-sm mb-2">Live Competition</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Changes to scoring rules after the league starts will only apply to future races.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Bar */}
      <div className="hidden md:block fixed bottom-0 left-0 md:left-64 right-0 z-40 bg-background border-t p-4 px-4 md:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-3 items-center">
          <div className="flex justify-start">
            <Button
              variant="ghost"
              onClick={onBack}
              className="px-0 sm:px-4 text-muted-foreground hover:text-foreground hover:bg-transparent">
              Back
            </Button>
          </div>
          <div className="flex flex-col items-center lg:hidden">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">
              Max Points
            </span>
            <span className="text-xl font-bold leading-none mt-1">
              {maxPoints} <span className="text-sm font-normal text-muted-foreground">PTS</span>
            </span>
          </div>
          <div className="justify-end hidden lg:flex" />
          <div className="flex justify-end items-center gap-2">
            <Button onClick={() => onNext({ rules })}>Finalize</Button>
          </div>
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
          onClick={() => onNext({ rules })}
          className="flex-1 shadow-2xl text-lg font-bold bg-primary/85 backdrop-blur-xl border-t border-white/20 text-primary-foreground rounded-full pointer-events-auto">
          Finalize
        </Button>
      </div>
    </>
  );
}

function RuleCard({
  title,
  description,
  enabled,
  points,
  onToggle,
  onPointsChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  points: number;
  onToggle: () => void;
  onPointsChange: (delta: number) => void;
}) {
  return (
    <div
      className={`relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-6 rounded-xl border transition-all ${
        enabled ? "border-white/10 bg-white/5" : "border-white/5 bg-black/20 opacity-70"
      }`}>
      <div className="flex items-start gap-4 mb-4 sm:mb-0 flex-1 cursor-pointer" onClick={onToggle}>
        <div
          className={`shrink-0 h-6 w-6 mt-1 rounded flex items-center justify-center border transition-colors ${
            enabled ? "bg-primary border-primary" : "border-white/20 hover:border-white/40"
          }`}>
          {enabled && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-lg ${enabled ? "text-foreground" : "text-muted-foreground"}`}>{title}</h3>
            <Info className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground leading-snug mt-1 max-w-sm">{description}</p>
        </div>
      </div>

      <div
        className={`flex items-center justify-end gap-3 transition-opacity ${enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Points</span>
        <div className="flex items-center bg-background/50 rounded-lg border border-white/10 p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/10 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              onPointsChange(-1);
            }}>
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-10 text-center font-bold font-mono">{points}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/10 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              onPointsChange(1);
            }}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Visual cue for selected state */}
      {enabled && <div className="absolute left-0 top-6 bottom-6 w-1 bg-primary rounded-r-lg" />}
    </div>
  );
}
