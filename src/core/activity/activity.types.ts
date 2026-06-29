import type { CoreModuleId } from "../registry";
import type {
  ACTIVITY_CATEGORIES,
  ACTIVITY_SEVERITIES,
  ACTIVITY_TYPES
} from "./activity.constants";

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type ActivitySeverity = (typeof ACTIVITY_SEVERITIES)[number];

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export type ActivityUser = {
  id: string;
  name: string;
  email?: string;
  role?: string;
};

export type ActivityMetadata = Record<string, string | number | boolean | null | undefined>;

export type HicoPilotActivity = {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  category: ActivityCategory;
  moduleId?: CoreModuleId;
  user?: ActivityUser;
  createdAt: string;
  severity: ActivitySeverity;
  icon?: string;
  color?: string;
  metadata?: ActivityMetadata;
  favorite: boolean;
  pinned: boolean;
};

export type ActivityInput = Omit<HicoPilotActivity, "favorite" | "pinned"> & {
  favorite?: boolean;
  pinned?: boolean;
};
