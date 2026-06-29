import type { CoreModuleId } from "../registry";
import type { CorePermissionRequirement } from "../types";
import type {
  WIDGET_CATEGORIES,
  WIDGET_SIZES,
  WIDGET_TYPES
} from "./widgets.constants";

export type HicoPilotWidgetType = (typeof WIDGET_TYPES)[number];

export type HicoPilotWidgetCategory = (typeof WIDGET_CATEGORIES)[number];

export type HicoPilotWidgetSize = (typeof WIDGET_SIZES)[number];

export type WidgetPosition = {
  area: string;
  row: number;
  column: number;
  order: number;
};

export type WidgetDataSource = {
  type: "static" | "registry" | "service" | "future-api";
  source: string;
  refreshInterval?: number;
};

export type WidgetMetadata = Record<string, string | number | boolean | null | undefined>;

export type HicoPilotWidget = {
  id: string;
  title: string;
  description?: string;
  type: HicoPilotWidgetType;
  category: HicoPilotWidgetCategory;
  moduleId?: CoreModuleId;
  size: HicoPilotWidgetSize;
  position: WidgetPosition;
  enabled: boolean;
  pinned: boolean;
  favorite: boolean;
  refreshable: boolean;
  configurable: boolean;
  permissions: CorePermissionRequirement[];
  dataSource?: WidgetDataSource;
  metadata?: WidgetMetadata;
  createdAt: string;
  updatedAt: string;
};

export type WidgetInput = Omit<
  HicoPilotWidget,
  "enabled" | "pinned" | "favorite" | "createdAt" | "updatedAt"
> & {
  enabled?: boolean;
  pinned?: boolean;
  favorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
