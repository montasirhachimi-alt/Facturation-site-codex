import type { UniversalSearchItem } from "./universal-search.types";
import { createCommandCenterHistoryItem, getCommandCenterHistoryId } from "./command-center-history.utils";
import { COMMAND_CENTER_FAVORITES_LIMIT, readCommandCenterFavorites, writeCommandCenterFavorites } from "./command-center-history.storage";

export const COMMAND_CENTER_FAVORITES_CHANGED_EVENT = "bosiaco:command-center-favorites-changed";

export function isCommandCenterFavorite(item: UniversalSearchItem) {
  const id = item.historyId ?? getCommandCenterHistoryId(item);
  if (!id) return false;
  return readCommandCenterFavorites().some((favorite) => favorite.id === id);
}

export function toggleCommandCenterFavorite(item: UniversalSearchItem) {
  const existingId = item.historyId ?? getCommandCenterHistoryId(item);
  if (!existingId) return false;

  const current = readCommandCenterFavorites();
  const exists = current.some((favorite) => favorite.id === existingId);

  if (exists) {
    writeCommandCenterFavorites(current.filter((favorite) => favorite.id !== existingId));
    notifyCommandCenterFavoritesChanged();
    return false;
  }

  const snapshot = createCommandCenterHistoryItem(item, Date.now());
  if (!snapshot) return false;

  writeCommandCenterFavorites([snapshot, ...current.filter((favorite) => favorite.id !== snapshot.id)].slice(0, COMMAND_CENTER_FAVORITES_LIMIT));
  notifyCommandCenterFavoritesChanged();
  return true;
}

export function notifyCommandCenterFavoritesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COMMAND_CENTER_FAVORITES_CHANGED_EVENT));
}
