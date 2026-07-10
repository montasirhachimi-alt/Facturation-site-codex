"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CommandCenterHistoryItem } from "../command-center-history.types";
import { createCommandCenterHistoryItem, getCommandCenterHistoryId } from "../command-center-history.utils";
import {
  COMMAND_CENTER_FAVORITES_LIMIT,
  COMMAND_CENTER_RECENT_LIMIT,
  readCommandCenterFavorites,
  readCommandCenterRecent,
  writeCommandCenterFavorites,
  writeCommandCenterRecent
} from "../command-center-history.storage";
import type { UniversalSearchItem } from "../universal-search.types";

export function useCommandCenterHistory() {
  const [hydrated, setHydrated] = useState(false);
  const [favorites, setFavorites] = useState<readonly CommandCenterHistoryItem[]>([]);
  const [recent, setRecent] = useState<readonly CommandCenterHistoryItem[]>([]);

  useEffect(() => {
    setFavorites(readCommandCenterFavorites());
    setRecent(readCommandCenterRecent());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeCommandCenterFavorites(favorites);
  }, [favorites, hydrated]);

  useEffect(() => {
    if (hydrated) writeCommandCenterRecent(recent);
  }, [hydrated, recent]);

  const favoriteIds = useMemo(() => new Set(favorites.map((item) => item.id)), [favorites]);

  const isFavorite = useCallback((item: UniversalSearchItem) => {
    const id = item.historyId ?? getCommandCenterHistoryId(item);
    return Boolean(id && favoriteIds.has(id));
  }, [favoriteIds]);

  const toggleFavorite = useCallback((item: UniversalSearchItem) => {
    const existingId = item.historyId ?? getCommandCenterHistoryId(item);
    if (!existingId) return;

    setFavorites((current) => {
      if (current.some((favorite) => favorite.id === existingId)) {
        return current.filter((favorite) => favorite.id !== existingId);
      }

      const snapshot = createCommandCenterHistoryItem(item, Date.now());
      if (!snapshot) return current;
      return [snapshot, ...current.filter((favorite) => favorite.id !== snapshot.id)].slice(0, COMMAND_CENTER_FAVORITES_LIMIT);
    });
  }, []);

  const recordRecent = useCallback((item: UniversalSearchItem) => {
    const snapshot = createCommandCenterHistoryItem(item, Date.now());
    if (!snapshot) return;

    setRecent((current) => [snapshot, ...current.filter((recentItem) => recentItem.id !== snapshot.id)].slice(0, COMMAND_CENTER_RECENT_LIMIT));
  }, []);

  return {
    favorites,
    recent,
    isFavorite,
    recordRecent,
    toggleFavorite
  };
}
