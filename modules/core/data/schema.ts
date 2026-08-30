/**
 * Schema barrel — every module's tables registered in one place so drizzle-kit
 * can diff the whole schema and generate migrations. Modules still *own* their
 * schema file; this only re-exports.
 */
export * from "@/modules/core/auth/schema";
export * from "@/modules/patients/schema";
export * from "@/modules/patient-file/schema";
