import type { CorePermissionRequirement, CoreRegistryItem } from "../types";

export type WidgetType =
  | "business_health"
  | "quick_actions"
  | "smart_insights"
  | "recent_activity"
  | "ai_assistant"
  | "kpi_cards"
  | (string & {});

export type WidgetSize = "small" | "medium" | "large" | "wide" | "full";

export type WidgetDefinition = CoreRegistryItem<{
  widgetType: WidgetType;
  defaultSize?: WidgetSize;
}> & {
  widgetType: WidgetType;
  defaultSize?: WidgetSize;
  permissions?: CorePermissionRequirement[];
};

export type WidgetPlacement = {
  widgetId: string;
  area: string;
  order: number;
  size?: WidgetSize;
};
