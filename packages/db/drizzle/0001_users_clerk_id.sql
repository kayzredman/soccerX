ALTER TABLE "soccerx"."users" DROP CONSTRAINT "users_google_sub_unique";--> statement-breakpoint
ALTER TABLE "soccerx"."users" ADD COLUMN "clerk_user_id" text;--> statement-breakpoint
ALTER TABLE "soccerx"."users" DROP COLUMN IF EXISTS "google_sub";--> statement-breakpoint
ALTER TABLE "soccerx"."users" ADD CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id");