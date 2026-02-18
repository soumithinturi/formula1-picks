import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const AuthRequestSchema = z.object({
  type: z.enum(["email", "phone"]),
  contact: z.string().min(1),
});

export const AuthVerifySchema = z.object({
  type: z.enum(["email", "phone"]),
  contact: z.string().min(1),
  code: z.string().length(6),
});

export type AuthRequest = z.infer<typeof AuthRequestSchema>;
export type AuthVerify = z.infer<typeof AuthVerifySchema>;

// ─── Scoring Config ──────────────────────────────────────────────────────────

export const ScoringConfigSchema = z.object({
  sprintQualifyingP1: z.number().int().min(0).default(1),
  sprintP1: z.number().int().min(0).default(5),
  sprintP2: z.number().int().min(0).default(3),
  sprintP3: z.number().int().min(0).default(1),
  raceQualifyingP1: z.number().int().min(0).default(1),
  raceP1: z.number().int().min(0).default(5),
  raceP2: z.number().int().min(0).default(3),
  raceP3: z.number().int().min(0).default(1),
  fastestLap: z.number().int().min(0).default(1),
  firstDnf: z.number().int().min(0).default(2),
});

export type ScoringConfig = z.infer<typeof ScoringConfigSchema>;

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  sprintQualifyingP1: 1,
  sprintP1: 5,
  sprintP2: 3,
  sprintP3: 1,
  raceQualifyingP1: 1,
  raceP1: 5,
  raceP2: 3,
  raceP3: 1,
  fastestLap: 1,
  firstDnf: 2,
};

// ─── Pick Selections ─────────────────────────────────────────────────────────

export const PickSelectionsSchema = z.object({
  // Sprint picks (optional — only for sprint weekends)
  sprintQualifyingP1: z.string().nullable().optional(),
  sprintP1: z.string().nullable().optional(),
  sprintP2: z.string().nullable().optional(),
  sprintP3: z.string().nullable().optional(),
  // Race picks
  raceQualifyingP1: z.string().nullable().optional(),
  raceP1: z.string().nullable().optional(),
  raceP2: z.string().nullable().optional(),
  raceP3: z.string().nullable().optional(),
  fastestLap: z.string().nullable().optional(),
  firstDnf: z.string().nullable().optional(),
});

export type PickSelections = z.infer<typeof PickSelectionsSchema>;

// ─── Picks ───────────────────────────────────────────────────────────────────

export const PickSubmissionSchema = z.object({
  raceId: z.number().int().positive(),
  leagueId: z.string().uuid(),
  selections: PickSelectionsSchema,
});

export type PickSubmission = z.infer<typeof PickSubmissionSchema>;

// ─── Results (Admin) ─────────────────────────────────────────────────────────

export const ResultSubmissionSchema = z.object({
  raceId: z.number().int().positive(),
  results: PickSelectionsSchema,
});

export type ResultSubmission = z.infer<typeof ResultSubmissionSchema>;

// ─── Leagues ─────────────────────────────────────────────────────────────────

export const CreateLeagueSchema = z.object({
  name: z.string().min(1).max(100),
  scoringConfig: ScoringConfigSchema.optional(),
});

export const JoinLeagueSchema = z.object({
  inviteCode: z.string().min(1),
});

export type CreateLeague = z.infer<typeof CreateLeagueSchema>;
export type JoinLeague = z.infer<typeof JoinLeagueSchema>;

// ─── DB Row Types ─────────────────────────────────────────────────────────────

export interface UserRow {
  id: string; // Supabase auth UUID
  contact: string;
  display_name: string | null;
  role: "USER" | "ADMIN";
  created_at: string;
}

export interface RaceRow {
  id: number;
  name: string;
  date: string;
  has_sprint: boolean;
  status: "UPCOMING" | "COMPLETED";
  sprint_deadline: string | null;
  race_deadline: string | null;
}

export interface DriverRow {
  id: number;
  full_name: string;
  racing_number: string;
  team_name: string;
  tla: string;
}

export interface PickRow {
  id: number;
  user_id: string;
  race_id: number;
  league_id: string;
  total_points: number;
  submitted_at: string;
  sprint_qualifying_p1: string | null;
  sprint_p1: string | null;
  sprint_p2: string | null;
  sprint_p3: string | null;
  race_qualifying_p1: string | null;
  race_p1: string | null;
  race_p2: string | null;
  race_p3: string | null;
  fastest_lap: string | null;
  first_dnf: string | null;
}

export interface LeagueRow {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  scoring_config: ScoringConfig;
  created_at: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string | null;
  contact: string;
  totalPoints: number;
}
