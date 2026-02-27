import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Globe, Lock, ChevronRight, Check } from "lucide-react";

interface Step1Props {
  initialData: {
    name: string;
    privacy: "public" | "private";
  };
  onNext: (data: { name: string; privacy: "public" | "private" }) => void;
  onCancel: () => void;
}

export function Step1({ initialData, onNext, onCancel }: Step1Props) {
  const [name, setName] = useState(initialData.name);
  const [privacy, setPrivacy] = useState<"public" | "private">(initialData.privacy);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNext({ name, privacy });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 max-w-5xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">Start Your Grid</h1>
        <p className="text-muted-foreground text-lg">
          Create a new league to compete with friends and track your podium predictions.
        </p>
      </div>

      <Card className="border border-white/10 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leagueName" className="text-base font-semibold">
                  League Name
                </Label>
                <div className="relative">
                  <Input
                    id="leagueName"
                    placeholder="e.g. The Pit Crew"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-lg py-6 bg-background/50 border-white/10 focus:border-primary/50"
                    autoFocus
                    minLength={2}
                    maxLength={50}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Choose a unique name for your racing group.</p>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">League Privacy</Label>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">BETA</span>
                </div>
                <div className="grid grid-cols-1">
                  <div className="relative border rounded-xl p-6 border-primary bg-primary/5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-full bg-primary text-primary-foreground">
                        <Lock className="h-6 w-6" />
                      </div>
                      <div className="h-6 w-6 rounded-full border-2 flex items-center justify-center border-primary">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Private Garage</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Invite-only via secure link. Perfect for close groups of friends and rivalries.
                    </p>
                    <p className="text-xs text-primary mt-2 font-semibold">
                      Note: All leagues created during the beta period are invite-only.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 items-center pt-8 border-t border-white/5 gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="justify-start px-0 text-muted-foreground hover:text-foreground hover:bg-transparent w-fit">
                Cancel
              </Button>
              <div className="flex justify-end">
                <Button type="submit" disabled={!name.trim()}>
                  Continue <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
