ALTER TABLE "treatment_session" ADD COLUMN "treatment_types" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
UPDATE "treatment_session" SET "treatment_types" = ARRAY["treatment_type"] WHERE "treatment_type" IS NOT NULL AND "treatment_type" <> '';
