CREATE TABLE "consent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"text_version" text DEFAULT 'v1' NOT NULL,
	CONSTRAINT "consent_unique" UNIQUE("patient_id","kind")
);
--> statement-breakpoint
CREATE TABLE "patient_treatment_type" (
	"patient_id" uuid NOT NULL,
	"treatment_type" text NOT NULL,
	"therapist_id" uuid NOT NULL,
	CONSTRAINT "patient_treatment_type_pk" UNIQUE("patient_id","treatment_type")
);
--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "dob" date;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "treatment_goal" text;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "general_notes" text;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "joined_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "consent" ADD CONSTRAINT "consent_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent" ADD CONSTRAINT "consent_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_treatment_type" ADD CONSTRAINT "patient_treatment_type_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_treatment_type" ADD CONSTRAINT "patient_treatment_type_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patient_treatment_type_therapist_idx" ON "patient_treatment_type" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "patient_therapist_idx" ON "patient" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "patient_therapist_status_idx" ON "patient" USING btree ("therapist_id","status");