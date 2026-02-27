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

export const UpdateProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  full_name: z.string().max(100).nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

// ─── Scoring Config ──────────────────────────────────────────────────────────

export const RuleSchema = z.object({
  enabled: z.boolean(),
  points: z.number().int().min(0),
});

export const ScoringConfigSchema = z.object({
  p1: RuleSchema.default({ enabled: true, points: 5 }),
  p2: RuleSchema.default({ enabled: true, points: 3 }),
  p3: RuleSchema.default({ enabled: true, points: 1 }),
  quali: RuleSchema.default({ enabled: true, points: 1 }),
  podium: RuleSchema.default({ enabled: true, points: 10 }),
  perfectOrder: RuleSchema.default({ enabled: true, points: 15 }),
  fastestLap: RuleSchema.default({ enabled: true, points: 5 }),
  sprintFastestLap: RuleSchema.default({ enabled: true, points: 5 }),
  firstDNF: RuleSchema.default({ enabled: false, points: 5 }),
});

export type ScoringConfig = z.infer<typeof ScoringConfigSchema>;

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  p1: { enabled: true, points: 5 },
  p2: { enabled: true, points: 3 },
  p3: { enabled: true, points: 1 },
  quali: { enabled: true, points: 1 },
  podium: { enabled: true, points: 10 },
  perfectOrder: { enabled: true, points: 15 },
  fastestLap: { enabled: true, points: 5 },
  sprintFastestLap: { enabled: true, points: 5 },
  firstDNF: { enabled: false, points: 5 },
};

// ─── Pick Selections ─────────────────────────────────────────────────────────

export const PickSelectionsSchema = z.object({
  // Sprint picks (optional — only for sprint weekends)
  sprintQualifyingP1: z.string().nullable().optional(),
  sprintP1: z.string().nullable().optional(),
  sprintP2: z.string().nullable().optional(),
  sprintP3: z.string().nullable().optional(),
  sprintFastestLap: z.string().nullable().optional(),
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
  full_name: string | null;
  avatar_url: string | null;
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
  driver_id: string;
  permanent_number: string | null;
  code: string | null;
  url: string | null;
  given_name: string;
  family_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  constructor_id: string | null;
  constructor_name: string | null;
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
  sprint_fastest_lap: string | null;
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
