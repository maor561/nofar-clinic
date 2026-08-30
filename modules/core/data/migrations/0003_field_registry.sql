CREATE TABLE "field_definition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"entity" text NOT NULL,
	"key" text NOT NULL,
	"label_he" text NOT NULL,
	"type" text NOT NULL,
	"schema" jsonb NOT NULL,
	"unit" text,
	"charted" boolean DEFAULT false NOT NULL,
	"charted_column" text,
	"order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "field_definition_scope_key" UNIQUE("therapist_id","entity","key")
);
--> statement-breakpoint
CREATE TABLE "field_value" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"definition_id" uuid NOT NULL,
	"value" jsonb NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "field_value_unique" UNIQUE("entity","entity_id","definition_id")
);
--> statement-breakpoint
ALTER TABLE "field_definition" ADD CONSTRAINT "field_definition_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_value" ADD CONSTRAINT "field_value_definition_id_field_definition_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."field_definition"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "field_definition_entity_idx" ON "field_definition" USING btree ("therapist_id","entity");--> statement-breakpoint
CREATE INDEX "field_value_entity_idx" ON "field_value" USING btree ("therapist_id","entity","entity_id");--> statement-breakpoint
CREATE INDEX "field_value_patient_idx" ON "field_value" USING btree ("patient_id");