import type { WidgetDefinition } from "./types";

const widgetDefinitions: WidgetDefinition[] = [];

export function registerWidgetDefinition(widget: WidgetDefinition) {
  widgetDefinitions.push(widget);
}

export function getWidgetDefinitions() {
  return [...widgetDefinitions];
}

export function clearWidgetDefinitions() {
  widgetDefinitions.length = 0;
}
