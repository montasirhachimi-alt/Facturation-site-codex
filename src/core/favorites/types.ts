export type FavoriteTargetType =
  | "route"
  | "record"
  | "command"
  | "widget"
  | (string & {});

export type FavoriteItem = {
  id: string;
  userId?: string;
  companyId?: string;
  targetType: FavoriteTargetType;
  targetId: string;
  label: string;
  href?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};
