-- WP-67: questionnaire library. Several named questionnaires per therapist; the
-- therapist picks which ones (>=1) a patient must fill at intake.
CREATE TABLE "questionnaire_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description_he" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "questionnaire_template_therapist_name_uq" UNIQUE("therapist_id","name")
);
--> statement-breakpoint
ALTER TABLE "questionnaire_template" ADD CONSTRAINT "questionnaire_template_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "questionnaire_template_therapist_idx" ON "questionnaire_template" USING btree ("therapist_id","sort_order");
--> statement-breakpoint
-- questions for a template are field_definition rows (entity='questionnaire') tagged with template_id
ALTER TABLE "field_definition" ADD COLUMN "template_id" uuid;
--> statement-breakpoint
ALTER TABLE "field_definition" ADD CONSTRAINT "field_definition_template_id_questionnaire_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."questionnaire_template"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- one response row per (patient, template); the row is both the assignment and the answer container
ALTER TABLE "questionnaire_response" ADD COLUMN "template_id" uuid;
--> statement-breakpoint
ALTER TABLE "questionnaire_response" ADD CONSTRAINT "questionnaire_response_template_id_questionnaire_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."questionnaire_template"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "questionnaire_response" DROP CONSTRAINT IF EXISTS "questionnaire_response_patient";
--> statement-breakpoint
CREATE UNIQUE INDEX "questionnaire_response_patient_template_uq" ON "questionnaire_response" USING btree ("patient_id","template_id") NULLS NOT DISTINCT;
