export const IMPORT_DUPLICATE_POLICIES = Object.freeze(["stop", "ignore", "update"] as const);

export type ImportDuplicatePolicy = (typeof IMPORT_DUPLICATE_POLICIES)[number] | "merge";

export function isActiveDuplicatePolicy(value: string): value is Exclude<ImportDuplicatePolicy, "merge"> {
  return value === "stop" || value === "ignore" || value === "update";
}
