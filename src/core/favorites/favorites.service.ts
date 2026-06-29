import {
  getFavorite,
  getFavorites,
  getFavoritesByModule,
  getFavoritesByType,
  pinFavorite,
  registerFavorite,
  removeFavorite,
  reorderFavorites,
  toggleFavorite
} from "./favorites.registry";
import type { FavoriteInput, FavoriteTargetType } from "./favorites.types";

export const favoritesService = {
  register(input: FavoriteInput) {
    return registerFavorite(input);
  },

  remove(id: string) {
    return removeFavorite(id);
  },

  toggle(input: FavoriteInput) {
    return toggleFavorite(input);
  },

  getById(id: string) {
    return getFavorite(id);
  },

  getAll() {
    return getFavorites();
  },

  getByModule(moduleId: string) {
    return getFavoritesByModule(moduleId);
  },

  getByType(targetType: FavoriteTargetType) {
    return getFavoritesByType(targetType);
  },

  pin(id: string, pinned?: boolean) {
    return pinFavorite(id, pinned);
  },

  reorder(orderedIds: string[]) {
    return reorderFavorites(orderedIds);
  }
};
