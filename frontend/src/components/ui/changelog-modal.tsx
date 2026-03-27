import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Zap, Bug, Calendar, ArrowRight } from "lucide-react";
import { type ChangelogEntry } from "@/data/changelog";
import { cn } from "@/lib/utils";

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: ChangelogEntry;
}

const TypeIcon = ({ type }: { type: ChangelogEntry["type"] }) => {
  switch (type) {
    case "feature":
      return <Rocket className="h-5 w-5 text-blue-500" />;
    case "improvement":
      return <Zap className="h-5 w-5 text-yellow-500" />;
    case "fix":
      return <Bug className="h-5 w-5 text-red-500" />;
  }
};

const TypeBadge = ({ type }: { type: ChangelogEntry["type"] }) => {
  switch (type) {
    case "feature":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 capitalize font-bold">
          New Feature
        </Badge>
      );
    case "improvement":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 capitalize font-bold">
          Improvement
        </Badge>
      );
    case "fix":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 capitalize font-bold">
          Bug Fix
        </Badge>
      );
  }
};

export function ChangelogModal({ isOpen, onClose, entry }: ChangelogModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
        {/* Header Visual */}
        <div className="h-32 bg-linear-to-br from-primary/20 via-primary/5 to-transparent relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-size-[20px_20px]" />
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-8 left-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center">
              <TypeIcon type={entry.type} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold font-mono tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  v{entry.version}
                </span>
                <TypeBadge type={entry.type} />
              </div>
              <h2 className="text-2xl font-black tracking-tight leading-none uppercase italic">What&apos;s New</h2>
            </div>
          </div>
        </div>

        <div className="p-8 pt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-serif">{entry.title}</h3>
              <time className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium italic">
                <Calendar className="h-3 w-3" />
                {new Date(entry.date).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </div>
            <p className="text-muted-foreground leading-relaxed">{entry.description}</p>
          </div>

          {entry.items && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Key Changes</h4>
              <ul className="space-y-2.5">
                {entry.items.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/90 group">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5 group-hover:scale-125 transition-transform" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter className="pt-4 mt-2">
            <Button onClick={onClose} className="w-full h-12 text-sm font-bold uppercase tracking-widest group">
              Let&apos;s Race
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
