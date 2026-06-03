ALTER TABLE "workouts" ADD COLUMN "summary" text;
ALTER TABLE "workouts" ADD COLUMN "length_label" text;
ALTER TABLE "workouts" ADD COLUMN "saves_count" integer DEFAULT 0 NOT NULL;
