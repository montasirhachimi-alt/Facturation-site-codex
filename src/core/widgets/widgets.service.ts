import {
  favoriteWidget,
  getEnabledWidgets,
  getFavoriteWidgets,
  getPinnedWidgets,
  getWidget,
  getWidgets,
  getWidgetsByCategory,
  getWidgetsByModule,
  getWidgetsByType,
  pinWidget,
  registerWidget,
  removeWidget,
  toggleWidget
} from "./widgets.registry";
import type { HicoPilotWidgetCategory, HicoPilotWidgetType, WidgetInput } from "./widgets.types";

export const widgetsService = {
  register(input: WidgetInput) {
    return registerWidget(input);
  },

  remove(id: string) {
    return removeWidget(id);
  },

  getById(id: string) {
    return getWidget(id);
  },

  getAll() {
    return getWidgets();
  },

  getByCategory(category: HicoPilotWidgetCategory) {
    return getWidgetsByCategory(category);
  },

  getByModule(moduleId: string) {
    return getWidgetsByModule(moduleId);
  },

  getByType(type: HicoPilotWidgetType) {
    return getWidgetsByType(type);
  },

  getEnabled() {
    return getEnabledWidgets();
  },

  getPinned() {
    return getPinnedWidgets();
  },

  getFavorites() {
    return getFavoriteWidgets();
  },

  toggle(id: string, enabled?: boolean) {
    return toggleWidget(id, enabled);
  },

  pin(id: string, pinned?: boolean) {
    return pinWidget(id, pinned);
  },

  favorite(id: string, favorite?: boolean) {
    return favoriteWidget(id, favorite);
  }
};
