CREATE TABLE "exercise_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"muscle_group" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_id" uuid NOT NULL,
	"name" text NOT NULL,
	"day_index" smallint DEFAULT 0 NOT NULL,
	"order_index" smallint NOT NULL,
	"exercises" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"coach_id" uuid,
	"title" text NOT NULL,
	"category" text,
	"level" text,
	"muscle_groups" text[] DEFAULT '{}' NOT NULL,
	"duration_minutes" integer,
	"coach_notes" text,
	"structure" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "member_workout_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_workout_id" uuid NOT NULL,
	"exercise_id" uuid,
	"exercise_name" text NOT NULL,
	"day_index" smallint DEFAULT 0 NOT NULL,
	"order_index" smallint NOT NULL,
	"target_sets" smallint,
	"target_reps" smallint,
	"target_weight_kg" numeric(6, 2),
	"target_rpe" smallint,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"source_workout_id" uuid,
	"title" text NOT NULL,
	"category" text,
	"notes" text,
	"structure" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workout_log_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_log_id" uuid NOT NULL,
	"exercise_id" uuid,
	"exercise_name" text NOT NULL,
	"order_index" smallint NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_log_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_log_exercise_id" uuid NOT NULL,
	"set_number" smallint NOT NULL,
	"reps" smallint,
	"weight_kg" numeric(6, 2),
	"duration_seconds" integer,
	"distance_meters" numeric(8, 2),
	"rpe" smallint,
	"is_warmup" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"workout_type" text,
	"duration_minutes" integer,
	"energy_pre" smallint,
	"energy_post" smallint,
	"notes" text,
	"source_workout_id" uuid,
	"source_member_workout_id" uuid,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "exercise_catalog" ADD CONSTRAINT "exercise_catalog_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_blocks" ADD CONSTRAINT "workout_blocks_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_workout_exercises" ADD CONSTRAINT "member_workout_exercises_member_workout_id_member_workouts_id_fk" FOREIGN KEY ("member_workout_id") REFERENCES "public"."member_workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_workout_exercises" ADD CONSTRAINT "member_workout_exercises_exercise_id_exercise_catalog_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_workouts" ADD CONSTRAINT "member_workouts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_workouts" ADD CONSTRAINT "member_workouts_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_workouts" ADD CONSTRAINT "member_workouts_source_workout_id_workouts_id_fk" FOREIGN KEY ("source_workout_id") REFERENCES "public"."workouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_log_exercises" ADD CONSTRAINT "workout_log_exercises_workout_log_id_workout_logs_id_fk" FOREIGN KEY ("workout_log_id") REFERENCES "public"."workout_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_log_exercises" ADD CONSTRAINT "workout_log_exercises_exercise_id_exercise_catalog_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_log_sets" ADD CONSTRAINT "workout_log_sets_workout_log_exercise_id_workout_log_exercises_id_fk" FOREIGN KEY ("workout_log_exercise_id") REFERENCES "public"."workout_log_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_source_workout_id_workouts_id_fk" FOREIGN KEY ("source_workout_id") REFERENCES "public"."workouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_source_member_workout_id_member_workouts_id_fk" FOREIGN KEY ("source_member_workout_id") REFERENCES "public"."member_workouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercise_catalog_tenant_idx" ON "exercise_catalog" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "workout_blocks_workout_idx" ON "workout_blocks" USING btree ("workout_id","day_index","order_index");--> statement-breakpoint
CREATE INDEX "workouts_tenant_idx" ON "workouts" USING btree ("tenant_id","published_at");--> statement-breakpoint
CREATE INDEX "mwe_workout_idx" ON "member_workout_exercises" USING btree ("member_workout_id","day_index","order_index");--> statement-breakpoint
CREATE INDEX "member_workouts_member_idx" ON "member_workouts" USING btree ("member_id","updated_at");--> statement-breakpoint
CREATE INDEX "wle_log_idx" ON "workout_log_exercises" USING btree ("workout_log_id","order_index");--> statement-breakpoint
CREATE INDEX "wls_exercise_idx" ON "workout_log_sets" USING btree ("workout_log_exercise_id","set_number");--> statement-breakpoint
CREATE INDEX "workout_logs_member_idx" ON "workout_logs" USING btree ("member_id","logged_at");--> statement-breakpoint
CREATE INDEX "workout_logs_source_workout_idx" ON "workout_logs" USING btree ("source_workout_id");--> statement-breakpoint
CREATE INDEX "workout_logs_source_member_workout_idx" ON "workout_logs" USING btree ("source_member_workout_id");