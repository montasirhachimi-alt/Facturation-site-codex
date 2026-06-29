import type { HicoPilotRecentItem, RecentItemInput } from "./recent.types";

export function createRecentItem(input: RecentItemInput): HicoPilotRecentItem {
  return {
    ...input,
    lastOpened: input.lastOpened ?? new Date().toISOString(),
    openCount: input.openCount ?? 1,
    pinned: input.pinned ?? false,
    favorite: input.favorite ?? false
  };
}

export function sortRecentItems(items: HicoPilotRecentItem[]) {
  return [...items].sort((first, second) => {
    if (first.pinned !== second.pinned) return first.pinned ? -1 : 1;
    if (first.favorite !== second.favorite) return first.favorite ? -1 : 1;

    return new Date(second.lastOpened).getTime() - new Date(first.lastOpened).getTime();
  });
}

export function getRecentKey(targetType: string, targetId: string) {
  return `${targetType}:${targetId}`;
}
