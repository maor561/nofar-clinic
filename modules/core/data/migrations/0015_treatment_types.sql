CREATE TABLE "treatment_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "treatment_type_therapist_name_uq" UNIQUE("therapist_id","name")
);
--> statement-breakpoint
ALTER TABLE "treatment_type" ADD CONSTRAINT "treatment_type_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "treatment_type" ("therapist_id", "name", "sort_order") SELECT t."id", v."name", v."ord" FROM "therapist" t CROSS JOIN (VALUES ('נטורופתיה', 0), ('רפלקסולוגיה', 1), ('תזונה', 2)) AS v("name", "ord") ON CONFLICT ("therapist_id", "name") DO NOTHING;--> statement-breakpoint
UPDATE "patient_treatment_type" SET "treatment_type" = 'נטורופתיה' WHERE "treatment_type" = 'naturopathy';--> statement-breakpoint
UPDATE "patient_treatment_type" SET "treatment_type" = 'רפלקסולוגיה' WHERE "treatment_type" = 'reflexology';--> statement-breakpoint
UPDATE "patient_treatment_type" SET "treatment_type" = 'תזונה' WHERE "treatment_type" = 'nutrition';--> statement-breakpoint
UPDATE "appointment" SET "treatment_type" = 'נטורופתיה' WHERE "treatment_type" = 'naturopathy';--> statement-breakpoint
UPDATE "appointment" SET "treatment_type" = 'רפלקסולוגיה' WHERE "treatment_type" = 'reflexology';--> statement-breakpoint
UPDATE "appointment" SET "treatment_type" = 'תזונה' WHERE "treatment_type" = 'nutrition';--> statement-breakpoint
UPDATE "treatment_session" SET "treatment_type" = 'נטורופתיה' WHERE "treatment_type" = 'naturopathy';--> statement-breakpoint
UPDATE "treatment_session" SET "treatment_type" = 'רפלקסולוגיה' WHERE "treatment_type" = 'reflexology';--> statement-breakpoint
UPDATE "treatment_session" SET "treatment_type" = 'תזונה' WHERE "treatment_type" = 'nutrition';
