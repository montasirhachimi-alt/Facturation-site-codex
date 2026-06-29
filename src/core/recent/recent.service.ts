import {
  clearModuleRecent,
  clearRecent,
  favoriteRecent,
  getRecent,
  getRecentByModule,
  getRecentByType,
  getRecentItems,
  pinRecent,
  registerRecent,
  removeRecent
} from "./recent.registry";
import type { RecentItemInput, RecentItemTargetType } from "./recent.types";

export const recentItemsService = {
  register(input: RecentItemInput) {
    return registerRecent(input);
  },

  remove(id: string) {
    return removeRecent(id);
  },

  clear() {
    clearRecent();
  },

  clearModule(moduleId: string) {
    clearModuleRecent(moduleId);
  },

  getById(id: string) {
    return getRecent(id);
  },

  getAll() {
    return getRecentItems();
  },

  getByModule(moduleId: string) {
    return getRecentByModule(moduleId);
  },

  getByType(targetType: RecentItemTargetType) {
    return getRecentByType(targetType);
  },

  pin(id: string, pinned?: boolean) {
    return pinRecent(id, pinned);
  },

  favorite(id: string, favorite?: boolean) {
    return favoriteRecent(id, favorite);
  }
};
