import type { LucideIcon } from "lucide-react";

export type EntitySortDirection = "asc" | "desc";

export type EntityTableColumn<TEntity, TSortKey extends string = string> = Readonly<{
  key: string;
  label: string;
  sortable?: boolean;
  sortKey?: TSortKey;
  className?: string;
  render: (entity: TEntity) => React.ReactNode;
}>;

export type EntityAction<TEntity> = Readonly<{
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: (entity: TEntity) => void;
}>;

export type EntityMetric = Readonly<{
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
}>;

