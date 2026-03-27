import { motion } from "framer-motion";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Trophy, Users, BarChart3, ChevronRight, Zap } from "lucide-react";
import { F1HelmetAvatar } from "@/components/user/f1-helmet-avatar";

export function LandingScreen() {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-linear-to-b from-primary/10 via-background to-background pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/5 blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/assets/icon-192x192.png" alt="F1 Picks" className="h-8 w-8 shrink-0 object-contain" />
          <span className="text-xl font-black uppercase italic tracking-tighter -ml-1.5">Picks</span>
          <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mt-1">
            BETA
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            asChild
            className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
            <Link to="/login">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible">
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
            <Zap className="w-4 h-4" /> 2026 Season Now Open
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Predict the Grid.
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-orange-400">
              Own the Leaderboard.
            </span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            The ultimate Formula 1 fantasy experience. Build your profile, join leagues with friends, and prove your
            racing knowledge every race weekend.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto rounded-full text-base h-14 px-8 shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-300">
              <Link to="/login">
                Start Predicting <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Mock UI Showcase */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
          className="mt-24 relative max-w-5xl mx-auto">
          {/* Decorative Elements */}
          <div className="absolute -inset-1 bg-linear-to-r from-primary/20 to-orange-500/20 rounded-3xl blur-xl opacity-50" />

          <div className="relative bg-card border border-border rounded-3xl p-6 md:p-10 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary via-orange-500 to-primary opacity-50" />

            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Leaderboard Mock */}
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold tracking-tight">App Experience</h3>
                  <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/20">
                    BETA
                  </Badge>
                </div>

                {/* League Mock */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/40 hover:bg-background/80 transition-colors mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Die Hard Lewis Fans</span>
                    </div>
                    <span className="text-xs text-muted-foreground uppercase">Next: United States Grand Prix</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>RNK RACER</span>
                      <div className="flex gap-8 text-right">
                        <span className="w-8">ACC.</span>
                        <span className="w-8">PTS</span>
                      </div>
                    </div>
                    {[
                      { pos: 1, name: "LewisGOAT (You)", points: 100, accuracy: "62%", team: "FERRARI" },
                      { pos: 2, name: "MaxFan99", points: 26, accuracy: "18%", team: "RED_BULL" },
                    ].map((user) => (
                      <div key={user.name} className="flex items-center gap-4">
                        <span className="w-4 text-xs font-medium text-muted-foreground">{user.pos}</span>
                        <F1HelmetAvatar
                          className="w-6 h-6"
                          helmetColor={user.team === "RED_BULL" ? "#1e3a8a" : "#2dd4bf"}
                        />
                        <div className="flex-1">
                          <p
                            className={`text-sm ${user.name.includes("(You)") ? "text-primary font-medium" : "font-medium"}`}>
                            {user.name}
                          </p>
                        </div>
                        <div className="flex gap-8 text-sm font-medium text-right">
                          <span className="w-8">{user.accuracy}</span>
                          <span className="w-8">{user.points}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Picks Mock */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/40 hover:bg-background/80 transition-colors">
                  <div className="flex flex-col items-center justify-center mb-4 text-center">
                    <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider mb-2">
                      Picks Open
                    </span>
                    <h4 className="font-black italic text-lg uppercase">United States Grand Prix</h4>
                    <div className="flex items-center gap-2 text-primary font-mono text-sm mt-2">
                      <span>
                        01<span className="text-[10px] text-muted-foreground ml-0.5">d</span>
                      </span>{" "}
                      :
                      <span>
                        04<span className="text-[10px] text-muted-foreground ml-0.5">h</span>
                      </span>{" "}
                      :
                      <span>
                        55<span className="text-[10px] text-muted-foreground ml-0.5">m</span>
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-card border border-border rounded-lg flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-sm">
                        L
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                          Pole Position
                        </p>
                        <p className="text-sm font-semibold">Lando Norris</p>
                      </div>
                      <span className="text-xs text-muted-foreground">#1</span>
                    </div>
                    <div className="p-3 bg-card border border-border rounded-lg flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-yellow-500/20 text-yellow-500 flex items-center justify-center font-bold text-sm">
                        M
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                          Race P1
                        </p>
                        <p className="text-sm font-semibold">Max Verstappen</p>
                      </div>
                      <span className="text-xs text-muted-foreground">#3</span>
                    </div>
                    <div className="p-3 bg-card border border-border rounded-lg flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-sm">
                        C
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold tracking-wider">
                          Race P2
                        </p>
                        <p className="text-sm font-semibold">Charles Leclerc</p>
                      </div>
                      <span className="text-xs text-muted-foreground">#16</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="grid gap-6">
                <FeatureCard
                  icon={<Users className="w-6 h-6 text-primary" />}
                  title="Private Leagues"
                  description="Create custom leagues, invite your friends, and compete together."
                />
                <FeatureCard
                  icon={<Zap className="w-6 h-6 text-orange-500" />}
                  title="Race Predictions"
                  description="Predict pole position, podium finishes, and fastest lap for every race."
                />
                {/* <FeatureCard
                  icon={<Trophy className="w-6 h-6 text-yellow-500" />}
                  title="Global Leaderboard"
                  description="See how your predictions stack up against F1 fans worldwide."
                /> */}
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground mt-20">
        <p>© 2026 F1 Picks. Not affiliated with Formula 1.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-5 rounded-xl bg-background border border-border hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02] cursor-default flex items-start gap-4">
      <div className="p-3 rounded-lg bg-muted border border-border shrink-0">{icon}</div>
      <div>
        <h4 className="font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// Minimal Badge implementation for the mock UI to avoid another import if it's not needed globally here,
// but we could also just import it from ui/badge.
function Badge({ children, className, variant = "default" }: any) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}
