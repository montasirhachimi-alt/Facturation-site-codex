import type { HicoPilotActivity } from "@/core/activity";
import type { HicoPilotFavorite } from "@/core/favorites";
import type { HicoPilotNotification } from "@/core/notifications";
import type { HicoPilotPreference } from "@/core/preferences";
import type { HicoPilotRecentItem } from "@/core/recent";
import type { CoreModuleDefinition, CoreModuleId } from "@/core/registry";
import type { HicoPilotWidget } from "@/core/widgets";

export type WorkspaceType =
  | "executive"
  | "finance"
  | "sales"
  | "crm"
  | "stock"
  | "hr"
  | "analytics"
  | "ai"
  | "system"
  | "custom";

export type WorkspaceMetadata = Record<string, string | number | boolean | null | undefined>;

export type HicoPilotWorkspace = {
  id: string;
  name: string;
  description: string;
  type: WorkspaceType;
  ownerId?: string;
  companyId: string;
  defaultRoute: string;
  modules: CoreModuleId[];
  widgets: string[];
  preferences: string[];
  favorites: string[];
  recentItems: string[];
  createdAt: string;
  updatedAt: string;
  metadata?: WorkspaceMetadata;
};

export type WorkspaceSnapshot = {
  workspace: HicoPilotWorkspace;
  modules: CoreModuleDefinition[];
  widgets: HicoPilotWidget[];
  preferences: HicoPilotPreference[];
  favorites: HicoPilotFavorite[];
  recentItems: HicoPilotRecentItem[];
  notifications: HicoPilotNotification[];
  activities: HicoPilotActivity[];
};

export type WorkspaceLayoutSnapshot = Pick<WorkspaceSnapshot, "workspace" | "widgets" | "preferences">;

export type WorkspaceAdapterItem = {
  id: string;
  name: string;
  description: string;
  type: WorkspaceType;
  defaultRoute: string;
  moduleCount: number;
  widgetCount: number;
  favoriteCount: number;
  recentItemCount: number;
  updatedAt: string;
};
