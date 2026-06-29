import type {
  HicoPilotWidget,
  HicoPilotWidgetCategory,
  HicoPilotWidgetType,
  WidgetInput
} from "./widgets.types";
import { createWidget, sortWidgets, updateWidgetTimestamp } from "./widgets.utils";

const widgets = new Map<string, HicoPilotWidget>();

export function registerWidget(input: WidgetInput) {
  const widget = createWidget(input);
  widgets.set(widget.id, widget);
  return widget;
}

export function removeWidget(id: string) {
  const widget = widgets.get(id);
  widgets.delete(id);
  return widget;
}

export function getWidget(id: string) {
  return widgets.get(id);
}

export function getWidgets() {
  return sortWidgets([...widgets.values()]);
}

export function getWidgetsByCategory(category: HicoPilotWidgetCategory) {
  return getWidgets().filter((widget) => widget.category === category);
}

export function getWidgetsByModule(moduleId: string) {
  return getWidgets().filter((widget) => widget.moduleId === moduleId);
}

export function getWidgetsByType(type: HicoPilotWidgetType) {
  return getWidgets().filter((widget) => widget.type === type);
}

export function getEnabledWidgets() {
  return getWidgets().filter((widget) => widget.enabled);
}

export function getPinnedWidgets() {
  return getWidgets().filter((widget) => widget.pinned);
}

export function getFavoriteWidgets() {
  return getWidgets().filter((widget) => widget.favorite);
}

export function toggleWidget(id: string, enabled?: boolean) {
  const widget = widgets.get(id);
  if (!widget) return undefined;

  const updated = updateWidgetTimestamp({ ...widget, enabled: enabled ?? !widget.enabled });
  widgets.set(id, updated);
  return updated;
}

export function pinWidget(id: string, pinned = true) {
  const widget = widgets.get(id);
  if (!widget) return undefined;

  const updated = updateWidgetTimestamp({ ...widget, pinned });
  widgets.set(id, updated);
  return updated;
}

export function favoriteWidget(id: string, favorite = true) {
  const widget = widgets.get(id);
  if (!widget) return undefined;

  const updated = updateWidgetTimestamp({ ...widget, favorite });
  widgets.set(id, updated);
  return updated;
}

export function clearWidgets() {
  widgets.clear();
}
