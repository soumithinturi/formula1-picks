export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  type: "feature" | "improvement" | "fix";
  items?: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: "0.2.1",
    date: "2026-03-05",
    title: "Tutorial & Picks Update",
    description: "Add tutorial for first time users and clear picks option.",
    type: "improvement",
    items: ["Tutorial: Add tutorial for first time users", "Picks: Add clear picks option"],
  },
  {
    version: "0.2.0",
    date: "2026-03-05",
    title: "Chat & UX Polish",
    description: "Add chat experience and general app improvements.",
    type: "feature",
    items: [
      "Chat: Add league-specific chat experience",
      "iMessage-style timestamps: Swipe left on messages to reveal the exact time they were sent.",
      "Performance: Optimized real-time message delivery and state management.",
    ],
  },
  {
    version: "0.1.1",
    date: "2026-03-03",
    title: "League Management Updates",
    description: "New ways to share and manage your private leagues.",
    type: "improvement",
    items: [
      "Dedicated Invite Links: Copy full links or just the invite code directly from the leagues screen.",
      "Persistence: Invite messages are now securely stored.",
      "Profile hydration: Preferences like theme and timezone now sync reliably from the server.",
      "Mobile navigation: Improved header and side navigation for better accessibility.",
      "Bug Fix: Resolved an issue where private leagues wouldn't show the correct member count.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-02-28",
    title: "Avatar Customization & Stats",
    description: "Personalize your profile and track your performance over the season.",
    type: "feature",
    items: [
      "Custom F1 Helmets: Design your own helmet.",
      "Prediction Stats: View your accuracy and correct picks across all leagues in your profile.",
    ],
  },
  {
    version: "0.0.1",
    date: "2026-02-20",
    title: "Initial Launch",
    description: "Welcome to Formula 1 Picks! Let the racing begin.",
    type: "feature",
    items: [
      "Create and join private leagues.",
      "Submit weekly picks for every Grand Prix.",
      "Live race schedule and results tracking.",
    ],
  },
];
