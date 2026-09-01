import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";

import { documentKind, documentVisibility } from "./labels";

/**
 * Patient document (WP-17). DATA_MODEL#document. Metadata only — the bytes live
 * in Vercel Blob (private) under `fileKey`, reachable only through the scoped
 * `/api/documents/[id]` route. `visibility` decides whether the patient can see
 * it at all; `therapist_only` must be unreachable for a patient on every path.
 */
export {
  documentKind,
  documentVisibility,
  type DocumentKind,
  type DocumentVisibility,
} from "./labels";

export const documentUploader = ["therapist", "patient"] as const;
export type DocumentUploader = (typeof documentUploader)[number];

export const document = pgTable(
  "document",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind", { enum: documentKind }).notNull().default("other"),
    fileKey: text("file_key").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    uploadedBy: text("uploaded_by", { enum: documentUploader }).notNull(),
    visibility: text("visibility", { enum: documentVisibility })
      .notNull()
      .default("therapist_only"),
    /**
     * WP-64 retention loop. A document older than a year surfaces on
     * `/t/documents/review`; "keep" sets this to now + 90d and it drops off the
     * list until then, then reappears. NULL = never reviewed / not deferred.
     */
    retentionDeferUntil: timestamp("retention_defer_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("document_patient_idx").on(t.patientId, t.createdAt)],
);
