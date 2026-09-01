import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "@/modules/core/auth/schema";

/**
 * Web Push subscriptions (WP-65). One row per browser/device a user granted
 * notification permission on. `endpoint` is the push service URL and is unique;
 * `p256dh` / `auth` are the client keys used to encrypt the payload (RFC 8291).
 * Rows are pruned when the push service reports the subscription gone (404/410).
 */
export const pushSubscription = pgTable(
  "push_subscription",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("push_subscription_user_idx").on(t.userId)],
);
