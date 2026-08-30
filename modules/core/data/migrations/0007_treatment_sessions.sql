CREATE TABLE "treatment_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"appointment_id" uuid,
	"date" date NOT NULL,
	"treatment_type" text,
	"patient_report" text,
	"complaints" text,
	"changes_since_last" text,
	"treatment_done" text,
	"therapist_notes" text,
	"recommendations" text,
	"next_focus" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "treatment_session" ADD CONSTRAINT "treatment_session_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_session" ADD CONSTRAINT "treatment_session_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_session" ADD CONSTRAINT "treatment_session_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "treatment_session_patient_idx" ON "treatment_session" USING btree ("patient_id","date");--> statement-breakpoint
CREATE INDEX "treatment_session_therapist_idx" ON "treatment_session" USING btree ("therapist_id","date");