export type CrmEntityId = string & { readonly __brand: "CrmEntityId" };
export type CrmWorkspaceId = string & { readonly __brand: "CrmWorkspaceId" };
export type CrmUserId = string & { readonly __brand: "CrmUserId" };

export type CrmEntityType = "customer" | "company" | "contact" | "activity" | "note";
export type CrmSortDirection = "asc" | "desc";
export type CrmCommandType = "create" | "update" | "archive" | "restore" | "delete";

export type CrmTimestamped = Readonly<{
  createdAt: string;
  updatedAt: string;
}>;

export type CrmWorkspaceScoped = Readonly<{
  workspaceId: CrmWorkspaceId | string;
}>;

export type CrmOwned = Readonly<{
  ownerId?: CrmUserId | string;
}>;

export type CrmTaggable = Readonly<{
  tags?: readonly string[];
}>;

export type CrmArchivable = Readonly<{
  archived?: boolean;
  archivedAt?: string;
}>;

export type CrmEntityBase = CrmWorkspaceScoped &
  CrmTimestamped &
  CrmOwned &
  CrmTaggable &
  CrmArchivable &
  Readonly<{
    id: CrmEntityId | string;
    entityType: CrmEntityType;
    displayName: string;
  }>;

export type CrmSearchableEntity = Readonly<{
  id: string;
  [field: string]: unknown;
}>;

export type CrmDateRange = Readonly<{
  from?: string;
  to?: string;
}>;

export type CrmFieldValue = string | number | boolean | Date | null | undefined;

export type CrmSortField<T extends string = string> = Readonly<{
  field: T;
  direction: CrmSortDirection;
}>;

