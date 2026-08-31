CREATE TABLE "calendar_connection" (
	"therapist_id" uuid PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'google' NOT NULL,
	"refresh_token_enc" text NOT NULL,
	"calendar_id" text DEFAULT 'primary' NOT NULL,
	"sync_enabled" boolean DEFAULT true NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sync_at" timestamp with time zone,
	"last_error" text
);
--> statement-breakpoint
ALTER TABLE "calendar_connection" ADD CONSTRAINT "calendar_connection_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE cascade ON UPDATE no action;