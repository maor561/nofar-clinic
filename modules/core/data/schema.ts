/**
 * Schema barrel — every module's tables registered in one place so drizzle-kit
 * can diff the whole schema and generate migrations. Modules still *own* their
 * schema file; this only re-exports.
 */
export * from "@/modules/core/auth/schema";
export * from "@/modules/core/audit/schema";
export * from "@/modules/core/fields/schema";
export * from "@/modules/core/notifications/schema";
export * from "@/modules/patients/schema";
export * from "@/modules/patient-file/schema";
export * from "@/modules/appointments/schema";
export * from "@/modules/sessions/schema";
export * from "@/modules/plans/schema";
export * from "@/modules/tasks/schema";
export * from "@/modules/messaging/schema";
export * from "@/modules/documents/schema";
