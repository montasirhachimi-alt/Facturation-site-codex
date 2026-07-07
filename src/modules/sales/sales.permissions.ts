import type { CorePermissionRequirement } from "@/core/types";

export const salesPermissions = Object.freeze([
  { module: "sales", action: "read" },
  { module: "sales", action: "write" },
  { module: "sales.quote", action: "read" },
  { module: "sales.quote", action: "write" },
  { module: "sales.invoice", action: "read" },
  { module: "sales.invoice", action: "write" },
  { module: "sales.payment", action: "read" },
  { module: "sales.payment", action: "write" }
] satisfies CorePermissionRequirement[]);

export type SalesPermission = (typeof salesPermissions)[number];
