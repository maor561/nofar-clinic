CREATE TABLE "patient_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"name" text NOT NULL,
	"session_count" integer NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"treatment_type" text,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"ending_notified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "treatment_series_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"name" text NOT NULL,
	"session_count" integer NOT NULL,
	"treatment_type" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "treatment_series_template_therapist_name_uq" UNIQUE("therapist_id","name")
);
--> statement-breakpoint
ALTER TABLE "patient_series" ADD CONSTRAINT "patient_series_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_series" ADD CONSTRAINT "patient_series_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_series_template" ADD CONSTRAINT "treatment_series_template_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patient_series_patient_idx" ON "patient_series" USING btree ("patient_id","status");