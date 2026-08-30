/**
 * Pure enums + Hebrew labels — safe to import from client components (no DB /
 * server deps). The service module re-exports these.
 */
export const taskFrequency = ["once", "daily", "weekly", "custom"] as const;
export type TaskFrequency = (typeof taskFrequency)[number];

export const taskStatus = ["open", "done"] as const;
export type TaskStatus = (typeof taskStatus)[number];

export const TASK_FREQUENCY_LABEL: Record<TaskFrequency, string> = {
  once: "חד־פעמי",
  daily: "יומי",
  weekly: "שבועי",
  custom: "מותאם",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  open: "פתוחה",
  done: "בוצעה",
};
