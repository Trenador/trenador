ALTER TABLE "members" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "subscription_status" text DEFAULT 'inactive' NOT NULL;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_stripe_customer_id_unique" UNIQUE("stripe_customer_id");