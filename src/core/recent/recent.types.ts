import type { CoreModuleId } from "../registry";
import type { RECENT_TARGET_TYPES } from "./recent.constants";

export type RecentItemTargetType = (typeof RECENT_TARGET_TYPES)[number];

export type RecentItemMetadata = Record<string, string | number | boolean | null | undefined>;

export type HicoPilotRecentItem = {
  id: string;
  targetId: string;
  targetType: RecentItemTargetType;
  moduleId?: CoreModuleId;
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  lastOpened: string;
  openCount: number;
  pinned: boolean;
  favorite: boolean;
  metadata?: RecentItemMetadata;
};

export type RecentItemInput = Omit<HicoPilotRecentItem, "lastOpened" | "openCount" | "pinned" | "favorite"> & {
  lastOpened?: string;
  openCount?: number;
  pinned?: boolean;
  favorite?: boolean;
};
