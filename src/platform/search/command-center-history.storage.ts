import type { CommandCenterHistoryItem } from "./command-center-history.types";

const FAVORITES_KEY = "bosiaco.command-center.favorites.v1";
const RECENT_KEY = "bosiaco.command-center.recent.v1";
export const COMMAND_CENTER_RECENT_LIMIT = 10;
export const COMMAND_CENTER_FAVORITES_LIMIT = 24;

export function readCommandCenterFavorites() {
  return readHistoryItems(FAVORITES_KEY, COMMAND_CENTER_FAVORITES_LIMIT);
}

export function readCommandCenterRecent() {
  return readHistoryItems(RECENT_KEY, COMMAND_CENTER_RECENT_LIMIT);
}

export function writeCommandCenterFavorites(items: readonly CommandCenterHistoryItem[]) {
  writeHistoryItems(FAVORITES_KEY, items.slice(0, COMMAND_CENTER_FAVORITES_LIMIT));
}

export function writeCommandCenterRecent(items: readonly CommandCenterHistoryItem[]) {
  writeHistoryItems(RECENT_KEY, items.slice(0, COMMAND_CENTER_RECENT_LIMIT));
}

function readHistoryItems(key: string, limit: number): readonly CommandCenterHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return [];
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeHistoryItem)
      .filter((item): item is CommandCenterHistoryItem => Boolean(item))
      .slice(0, limit);
  } catch {
    return [];
  }
}

function writeHistoryItems(key: string, items: readonly CommandCenterHistoryItem[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(items.map(normalizeForStorage).filter(Boolean)));
  } catch {
    // Storage may be unavailable in private mode; command center behavior remains in-memory for the session.
  }
}

function normalizeHistoryItem(value: unknown): CommandCenterHistoryItem | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<Record<keyof CommandCenterHistoryItem, unknown>>;

  if (
    typeof candidate.id !== "string" ||
    (candidate.kind !== "navigation" && candidate.kind !== "record") ||
    typeof candidate.entityType !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.subtitle !== "string" ||
    typeof candidate.route !== "string" ||
    typeof candidate.iconKey !== "string" ||
    typeof candidate.searchValue !== "string" ||
    typeof candidate.timestamp !== "number" ||
    candidate.source !== "command-center"
  ) {
    return null;
  }

  if (!candidate.route.startsWith("/")) return null;

  return {
    id: candidate.id,
    kind: candidate.kind,
    entityType: candidate.entityType,
    title: candidate.title,
    subtitle: candidate.subtitle,
    route: candidate.route,
    iconKey: candidate.iconKey,
    searchValue: candidate.searchValue,
    timestamp: candidate.timestamp,
    source: "command-center"
  };
}

function normalizeForStorage(item: CommandCenterHistoryItem) {
  return normalizeHistoryItem(item);
}
