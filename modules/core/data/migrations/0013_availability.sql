CREATE TABLE "availability_exception" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"date" date NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_exception_therapist_date_uq" UNIQUE("therapist_id","date")
);
--> statement-breakpoint
CREATE TABLE "availability_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_rule_therapist_weekday_uq" UNIQUE("therapist_id","weekday")
);
--> statement-breakpoint
CREATE TABLE "booking_policy" (
	"therapist_id" uuid PRIMARY KEY NOT NULL,
	"self_scheduling_enabled" boolean DEFAULT false NOT NULL,
	"slot_minutes" integer DEFAULT 60 NOT NULL,
	"granularity_minutes" integer DEFAULT 30 NOT NULL,
	"lead_hours" integer DEFAULT 12 NOT NULL,
	"horizon_days" integer DEFAULT 45 NOT NULL,
	"buffer_minutes" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability_exception" ADD CONSTRAINT "availability_exception_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rule" ADD CONSTRAINT "availability_rule_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_policy" ADD CONSTRAINT "booking_policy_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_rule_therapist_idx" ON "availability_rule" USING btree ("therapist_id");