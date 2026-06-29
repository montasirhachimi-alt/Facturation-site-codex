export type CoreStatus = "inactive" | "active" | "disabled" | "experimental";

export type CoreModule =
  | "search"
  | "commands"
  | "notifications"
  | "activity"
  | "widgets"
  | "favorites"
  | "recent"
  | "preferences"
  | (string & {});

export type CorePermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "print"
  | "approve"
  | (string & {});

export type CorePermissionRequirement = {
  module: string;
  action: CorePermissionAction;
  scope?: "global" | "company" | "own" | (string & {});
};

export type CoreRegistryItem<TMetadata extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  module: CoreModule;
  label: string;
  description?: string;
  status?: CoreStatus;
  permissions?: CorePermissionRequirement[];
  metadata?: TMetadata;
};

export type CoreAction<TContext = unknown, TResult = unknown> = CoreRegistryItem & {
  kind: "action";
  execute?: (context: TContext) => TResult | Promise<TResult>;
};
