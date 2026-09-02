-- WP-69: shared food diary. One row per patient per day; five fixed meal slots
-- as text, the patient's own note, and the therapist's feedback note (shown to
-- the patient). No macro/portion maths — the therapist reads it and responds
-- with notes, tasks and the treatment plan.
CREATE TABLE "food_log_day" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"date" date NOT NULL,
	"wakeup" text,
	"breakfast" text,
	"lunch" text,
	"afternoon" text,
	"evening" text,
	"patient_note" text,
	"therapist_note" text,
	"therapist_note_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "food_log_day_patient_date_uq" UNIQUE("patient_id","date")
);
--> statement-breakpoint
ALTER TABLE "food_log_day" ADD CONSTRAINT "food_log_day_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "food_log_day" ADD CONSTRAINT "food_log_day_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "food_log_day_patient_idx" ON "food_log_day" USING btree ("patient_id","date");
