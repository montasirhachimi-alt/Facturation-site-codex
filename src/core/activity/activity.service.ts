import {
  favoriteActivity,
  getActivities,
  getActivitiesByCategory,
  getActivitiesByModule,
  getActivitiesBySeverity,
  getActivity,
  getRecentActivities,
  pinActivity,
  registerActivity
} from "./activity.registry";
import type { ActivityCategory, ActivityInput, ActivitySeverity } from "./activity.types";

export const activityService = {
  register(input: ActivityInput) {
    return registerActivity(input);
  },

  getById(id: string) {
    return getActivity(id);
  },

  getAll() {
    return getActivities();
  },

  getRecent(limit?: number) {
    return getRecentActivities(limit);
  },

  getByModule(moduleId: string) {
    return getActivitiesByModule(moduleId);
  },

  getByCategory(category: ActivityCategory) {
    return getActivitiesByCategory(category);
  },

  getBySeverity(severity: ActivitySeverity) {
    return getActivitiesBySeverity(severity);
  },

  pin(id: string, pinned?: boolean) {
    return pinActivity(id, pinned);
  },

  favorite(id: string, favorite?: boolean) {
    return favoriteActivity(id, favorite);
  }
};
