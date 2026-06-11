import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // database
  DATABASE_URL: z.string().url(),

  // redis / queue
  REDIS_URL: z.string().url(),

  // auth — Clerk (web hosts UI, API verifies session tokens)
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  CLERK_JWT_ISSUER: z.string().optional(),

  // football data provider (api-football via RapidAPI)
  FOOTBALL_API_KEY: z.string().optional(),
  FOOTBALL_API_BASE_URL: z
    .string()
    .url()
    .default("https://v3.football.api-sports.io"),
  FOOTBALL_API_HOST: z.string().default("v3.football.api-sports.io"),

  // web
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),

  // api
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_CORS_ORIGINS: z.string().default("http://localhost:3000"),

  // worker
  SCORING_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(300_000),
  LEADERBOARD_REFRESH_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60_000),
  // dev-only: simulate live match progress every N ms (0 = disabled)
  LIVE_SIM_TICK_MS: z.coerce.number().int().nonnegative().default(5_000),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
