import { changelog, type ChangelogEntry } from "../data/changelog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Rocket, Zap, Bug } from "lucide-react";

const TypeIcon = ({ type }: { type: ChangelogEntry["type"] }) => {
  switch (type) {
    case "feature":
      return <Rocket className="h-4 w-4 text-blue-500" />;
    case "improvement":
      return <Zap className="h-4 w-4 text-yellow-500" />;
    case "fix":
      return <Bug className="h-4 w-4 text-red-500" />;
  }
};

const TypeBadge = ({ type }: { type: ChangelogEntry["type"] }) => {
  switch (type) {
    case "feature":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 capitalize">
          New Feature
        </Badge>
      );
    case "improvement":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 capitalize">
          Improvement
        </Badge>
      );
    case "fix":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 capitalize">
          Bug Fix
        </Badge>
      );
  }
};

export function ChangelogScreen() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-6 md:py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
          What&apos;s New
          <span className="text-primary h-2 w-2 rounded-full bg-primary animate-pulse" />
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Track the latest updates, features, and fixes we&apos;re bringing to F1 Picks. We&apos;re constantly improving
          the experience for our racing fans.
        </p>
      </div>

      <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-border/60 before:to-transparent">
        {changelog.map((entry, index) => (
          <div
            key={entry.version}
            className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            {/* Dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <TypeIcon type={entry.type} />
            </div>

            {/* Content */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold font-mono tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded">
                    v{entry.version}
                  </span>
                  <TypeBadge type={entry.type} />
                </div>
                <time className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium italic">
                  <Calendar className="h-3 w-3" />
                  {new Date(entry.date).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </div>

              <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{entry.title}</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">{entry.description}</p>

              {entry.items && (
                <ul className="space-y-2">
                  {entry.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-12 pb-24 text-center space-y-4">
        <div className="h-px w-full bg-linear-to-r from-transparent via-border to-transparent" />
        <p className="text-muted-foreground text-sm">More updates coming soon. Stay tuned for the next Grand Prix!</p>
      </div>
    </div>
  );
}
