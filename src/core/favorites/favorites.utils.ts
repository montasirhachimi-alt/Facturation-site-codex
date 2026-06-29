import type { FavoriteInput, HicoPilotFavorite } from "./favorites.types";

export function createFavorite(input: FavoriteInput, fallbackOrder = 0): HicoPilotFavorite {
  return {
    ...input,
    order: input.order ?? fallbackOrder,
    pinned: input.pinned ?? false,
    favoriteDate: input.favoriteDate ?? new Date().toISOString()
  };
}

export function sortFavorites(favorites: HicoPilotFavorite[]) {
  return [...favorites].sort((first, second) => {
    if (first.pinned !== second.pinned) return first.pinned ? -1 : 1;
    if (first.order !== second.order) return first.order - second.order;

    return new Date(second.favoriteDate).getTime() - new Date(first.favoriteDate).getTime();
  });
}

export function getFavoriteKey(targetType: string, targetId: string) {
  return `${targetType}:${targetId}`;
}
