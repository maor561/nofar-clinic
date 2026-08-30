CREATE TABLE "treatment_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"current_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "treatment_plan_patient" UNIQUE("patient_id")
);
--> statement-breakpoint
CREATE TABLE "treatment_plan_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"version_no" integer NOT NULL,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "treatment_plan_version_no" UNIQUE("plan_id","version_no")
);
--> statement-breakpoint
ALTER TABLE "treatment_plan" ADD CONSTRAINT "treatment_plan_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plan" ADD CONSTRAINT "treatment_plan_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plan_version" ADD CONSTRAINT "treatment_plan_version_plan_id_treatment_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."treatment_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plan_version" ADD CONSTRAINT "treatment_plan_version_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_plan_version" ADD CONSTRAINT "treatment_plan_version_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "treatment_plan_version_patient_idx" ON "treatment_plan_version" USING btree ("patient_id","created_at");