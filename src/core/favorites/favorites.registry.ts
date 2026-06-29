import type { FavoriteInput, FavoriteTargetType, HicoPilotFavorite } from "./favorites.types";
import { createFavorite, getFavoriteKey, sortFavorites } from "./favorites.utils";

const favorites = new Map<string, HicoPilotFavorite>();

export function registerFavorite(input: FavoriteInput) {
  const favorite = createFavorite(input, favorites.size);
  favorites.set(favorite.id, favorite);
  return favorite;
}

export function removeFavorite(id: string) {
  const favorite = favorites.get(id);
  favorites.delete(id);
  return favorite;
}

export function toggleFavorite(input: FavoriteInput) {
  const existing = getFavorites().find((favorite) => {
    return getFavoriteKey(favorite.targetType, favorite.targetId) === getFavoriteKey(input.targetType, input.targetId);
  });

  if (existing) {
    removeFavorite(existing.id);
    return { favorite: existing, active: false };
  }

  return { favorite: registerFavorite(input), active: true };
}

export function getFavorite(id: string) {
  return favorites.get(id);
}

export function getFavorites() {
  return sortFavorites([...favorites.values()]);
}

export function getFavoritesByModule(moduleId: string) {
  return getFavorites().filter((favorite) => favorite.moduleId === moduleId);
}

export function getFavoritesByType(targetType: FavoriteTargetType) {
  return getFavorites().filter((favorite) => favorite.targetType === targetType);
}

export function pinFavorite(id: string, pinned = true) {
  const favorite = favorites.get(id);
  if (!favorite) return undefined;

  const updated = { ...favorite, pinned };
  favorites.set(id, updated);
  return updated;
}

export function reorderFavorites(orderedIds: string[]) {
  orderedIds.forEach((id, order) => {
    const favorite = favorites.get(id);
    if (favorite) {
      favorites.set(id, { ...favorite, order });
    }
  });

  return getFavorites();
}

export function clearFavorites() {
  favorites.clear();
}
