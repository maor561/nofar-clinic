CREATE TABLE "appointment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"treatment_type" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"gcal_event_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointment_therapist_start_idx" ON "appointment" USING btree ("therapist_id","starts_at");--> statement-breakpoint
CREATE INDEX "appointment_patient_start_idx" ON "appointment" USING btree ("patient_id","starts_at");