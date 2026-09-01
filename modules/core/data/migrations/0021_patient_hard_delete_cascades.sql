-- WP-66: hard, irreversible patient delete. Three tables carry `patient_id`
-- without an FK (they predate a strict need for one). Add ON DELETE CASCADE so a
-- single `DELETE FROM patient` also removes the patient's flexible-field values,
-- their pending invite, and their login (which in turn cascades sessions,
-- notifications and push subscriptions). `audit` is deliberately left FK-free so
-- the delete can still write its own metadata-only tombstone row.
ALTER TABLE "field_value" ADD CONSTRAINT "field_value_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;
