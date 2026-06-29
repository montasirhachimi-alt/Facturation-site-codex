import type {
  ActivityCategory,
  ActivityInput,
  ActivitySeverity,
  HicoPilotActivity
} from "./activity.types";
import { createActivity, sortActivitiesByDate, sortActivitiesByPriority } from "./activity.utils";

const activities = new Map<string, HicoPilotActivity>();

export function registerActivity(input: ActivityInput) {
  const activity = createActivity(input);
  activities.set(activity.id, activity);
  return activity;
}

export function getActivity(id: string) {
  return activities.get(id);
}

export function getActivities() {
  return sortActivitiesByPriority([...activities.values()]);
}

export function getRecentActivities(limit = 10) {
  return sortActivitiesByDate([...activities.values()]).slice(0, limit);
}

export function getActivitiesByModule(moduleId: string) {
  return getActivities().filter((activity) => activity.moduleId === moduleId);
}

export function getActivitiesByCategory(category: ActivityCategory) {
  return getActivities().filter((activity) => activity.category === category);
}

export function getActivitiesBySeverity(severity: ActivitySeverity) {
  return getActivities().filter((activity) => activity.severity === severity);
}

export function pinActivity(id: string, pinned = true) {
  const activity = activities.get(id);
  if (!activity) return undefined;

  const updated = { ...activity, pinned };
  activities.set(id, updated);
  return updated;
}

export function favoriteActivity(id: string, favorite = true) {
  const activity = activities.get(id);
  if (!activity) return undefined;

  const updated = { ...activity, favorite };
  activities.set(id, updated);
  return updated;
}

export function clearActivities() {
  activities.clear();
}
