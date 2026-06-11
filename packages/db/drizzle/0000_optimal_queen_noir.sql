CREATE SCHEMA "soccerx";
--> statement-breakpoint
CREATE TYPE "soccerx"."archetype" AS ENUM('CHALK', 'ROMANTIC', 'CHAOS', 'PATRIOT', 'STATISTICIAN');--> statement-breakpoint
CREATE TYPE "soccerx"."match_status" AS ENUM('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "soccerx"."pick_type" AS ENUM('group_winner', 'group_runner_up', 'best_third', 'r32', 'r16', 'qf', 'sf', 'final', 'champion', 'match_scoreline', 'daily_first_scorer', 'daily_over_under', 'daily_red_card', 'daily_half_time');--> statement-breakpoint
CREATE TYPE "soccerx"."stage" AS ENUM('GROUP', 'R32', 'R16', 'QF', 'SF', 'FINAL', 'THIRD_PLACE');--> statement-breakpoint
CREATE TYPE "soccerx"."tournament_format" AS ENUM('wc2026', 'afcon2027');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "soccerx"."daily_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"pick_type" "soccerx"."pick_type" NOT NULL,
	"prompt" text NOT NULL,
	"points_award" integer DEFAULT 10 NOT NULL,
	"settled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "soccerx"."groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"letter" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "soccerx"."leaderboard_cache" (
	"scope" text NOT NULL,
	"tournament_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"total_points" integer NOT NULL,
	"rank" integer NOT NULL,
	"last_refreshed" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leaderboard_cache_scope_tournament_id_user_id_pk" PRIMARY KEY("scope","tournament_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "soccerx"."league_members" (
	"league_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "league_members_league_id_user_id_pk" PRIMARY KEY("league_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "soccerx"."leagues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leagues_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "soccerx"."matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"stage" "soccerx"."stage" NOT NULL,
	"group_id" uuid,
	"home_team_id" uuid,
	"away_team_id" uuid,
	"kickoff_at" timestamp with time zone NOT NULL,
	"venue" text,
	"home_score" integer,
	"away_score" integer,
	"status" "soccerx"."match_status" DEFAULT 'SCHEDULED' NOT NULL,
	"external_ref" text,
	"settled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "soccerx"."picks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tournament_id" uuid NOT NULL,
	"pick_type" "soccerx"."pick_type" NOT NULL,
	"match_id" uuid,
	"team_id" uuid,
	"scalar_value" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "soccerx"."score_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"tournament_id" uuid NOT NULL,
	"pick_id" uuid NOT NULL,
	"match_id" uuid,
	"points" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "soccerx"."teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"group_id" uuid,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"flag_emoji" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "soccerx"."tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"format" "soccerx"."tournament_format" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"bracket_lock_at" timestamp with time zone NOT NULL,
	CONSTRAINT "tournaments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "soccerx"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_sub" text,
	"email" text NOT NULL,
	"handle" text NOT NULL,
	"name" text,
	"image" text,
	"country" text,
	"archetype" "soccerx"."archetype",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."daily_questions" ADD CONSTRAINT "daily_questions_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "soccerx"."tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."daily_questions" ADD CONSTRAINT "daily_questions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "soccerx"."matches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."groups" ADD CONSTRAINT "groups_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "soccerx"."tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."leaderboard_cache" ADD CONSTRAINT "leaderboard_cache_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "soccerx"."tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."leaderboard_cache" ADD CONSTRAINT "leaderboard_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "soccerx"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."league_members" ADD CONSTRAINT "league_members_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "soccerx"."leagues"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."league_members" ADD CONSTRAINT "league_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "soccerx"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."leagues" ADD CONSTRAINT "leagues_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "soccerx"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "soccerx"."tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."matches" ADD CONSTRAINT "matches_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "soccerx"."groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."matches" ADD CONSTRAINT "matches_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "soccerx"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."matches" ADD CONSTRAINT "matches_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "soccerx"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."picks" ADD CONSTRAINT "picks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "soccerx"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."picks" ADD CONSTRAINT "picks_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "soccerx"."tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."picks" ADD CONSTRAINT "picks_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "soccerx"."matches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."picks" ADD CONSTRAINT "picks_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "soccerx"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."score_events" ADD CONSTRAINT "score_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "soccerx"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."score_events" ADD CONSTRAINT "score_events_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "soccerx"."tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."score_events" ADD CONSTRAINT "score_events_pick_id_picks_id_fk" FOREIGN KEY ("pick_id") REFERENCES "soccerx"."picks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."score_events" ADD CONSTRAINT "score_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "soccerx"."matches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."teams" ADD CONSTRAINT "teams_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "soccerx"."tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "soccerx"."teams" ADD CONSTRAINT "teams_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "soccerx"."groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "daily_questions_match_type_unique" ON "soccerx"."daily_questions" USING btree ("match_id","pick_type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "groups_tournament_letter_unique" ON "soccerx"."groups" USING btree ("tournament_id","letter");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leaderboard_scope_tournament_rank_idx" ON "soccerx"."leaderboard_cache" USING btree ("scope","tournament_id","rank");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leagues_code_idx" ON "soccerx"."leagues" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_kickoff_idx" ON "soccerx"."matches" USING btree ("kickoff_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "matches_external_ref_unique" ON "soccerx"."matches" USING btree ("external_ref");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "picks_user_tournament_type_idx" ON "soccerx"."picks" USING btree ("user_id","tournament_id","pick_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "score_events_user_tournament_idx" ON "soccerx"."score_events" USING btree ("user_id","tournament_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "score_events_pick_match_unique" ON "soccerx"."score_events" USING btree ("pick_id","match_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "teams_tournament_code_unique" ON "soccerx"."teams" USING btree ("tournament_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_handle_lower_unique" ON "soccerx"."users" USING btree ("handle");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "soccerx"."users" USING btree ("email");