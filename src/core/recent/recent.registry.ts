import type { HicoPilotRecentItem, RecentItemInput, RecentItemTargetType } from "./recent.types";
import { createRecentItem, getRecentKey, sortRecentItems } from "./recent.utils";

const recentItems = new Map<string, HicoPilotRecentItem>();

export function registerRecent(input: RecentItemInput) {
  const existing = getRecentItems().find((item) => {
    return getRecentKey(item.targetType, item.targetId) === getRecentKey(input.targetType, input.targetId);
  });

  if (existing) {
    const updated = {
      ...existing,
      ...input,
      lastOpened: input.lastOpened ?? new Date().toISOString(),
      openCount: (input.openCount ?? existing.openCount) + 1
    };
    recentItems.set(existing.id, updated);
    return updated;
  }

  const item = createRecentItem(input);
  recentItems.set(item.id, item);
  return item;
}

export function removeRecent(id: string) {
  const item = recentItems.get(id);
  recentItems.delete(id);
  return item;
}

export function clearRecent() {
  recentItems.clear();
}

export function clearModuleRecent(moduleId: string) {
  recentItems.forEach((item, id) => {
    if (item.moduleId === moduleId) {
      recentItems.delete(id);
    }
  });
}

export function getRecent(id: string) {
  return recentItems.get(id);
}

export function getRecentItems() {
  return sortRecentItems([...recentItems.values()]);
}

export function getRecentByModule(moduleId: string) {
  return getRecentItems().filter((item) => item.moduleId === moduleId);
}

export function getRecentByType(targetType: RecentItemTargetType) {
  return getRecentItems().filter((item) => item.targetType === targetType);
}

export function pinRecent(id: string, pinned = true) {
  const item = recentItems.get(id);
  if (!item) return undefined;

  const updated = { ...item, pinned };
  recentItems.set(id, updated);
  return updated;
}

export function favoriteRecent(id: string, favorite = true) {
  const item = recentItems.get(id);
  if (!item) return undefined;

  const updated = { ...item, favorite };
  recentItems.set(id, updated);
  return updated;
}
