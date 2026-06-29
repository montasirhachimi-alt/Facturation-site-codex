export type RecentTargetType =
  | "route"
  | "record"
  | "command"
  | "search"
  | (string & {});

export type RecentItem = {
  id: string;
  userId?: string;
  companyId?: string;
  targetType: RecentTargetType;
  targetId: string;
  label: string;
  href?: string;
  viewedAt: string;
  metadata?: Record<string, unknown>;
};
