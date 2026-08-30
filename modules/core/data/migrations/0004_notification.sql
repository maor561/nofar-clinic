CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title_he" text NOT NULL,
	"body_he" text,
	"link" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"emailed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_therapist_id_therapist_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapist"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_recipient_idx" ON "notification" USING btree ("recipient_user_id","created_at");