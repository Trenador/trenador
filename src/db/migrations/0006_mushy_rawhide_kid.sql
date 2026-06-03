ALTER TABLE "workout_log_sets" RENAME COLUMN "weight_kg" TO "weight_lbs";--> statement-breakpoint
UPDATE "workout_log_sets" SET "weight_lbs" = ROUND(CAST("weight_lbs" AS numeric) * 2.20462, 2) WHERE "weight_lbs" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_log_sets" DROP COLUMN "rpe";