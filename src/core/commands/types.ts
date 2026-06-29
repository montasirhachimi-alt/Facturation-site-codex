import type { CoreAction, CorePermissionRequirement } from "../types";

export type CommandCategory =
  | "navigation"
  | "creation"
  | "search"
  | "workflow"
  | "system"
  | (string & {});

export type CommandContext = {
  userId?: string;
  companyId?: string;
  currentPath?: string;
  selection?: unknown;
};

export type CommandDefinition<TResult = unknown> = CoreAction<CommandContext, TResult> & {
  category: CommandCategory;
  shortcut?: string[];
  keywords?: string[];
  href?: string;
  permissions?: CorePermissionRequirement[];
};
