import { favoritesService } from "@/core/favorites";
import type { FavoriteInput, FavoriteTargetType } from "@/core/favorites";

export class FavoritesService {
  add(input: FavoriteInput) {
    return favoritesService.register(input);
  }

  remove(id: string) {
    return favoritesService.remove(id);
  }

  toggle(input: FavoriteInput) {
    return favoritesService.toggle(input);
  }

  getAll() {
    return favoritesService.getAll();
  }

  getByType(targetType: FavoriteTargetType) {
    return favoritesService.getByType(targetType);
  }

  reorder(orderedIds: string[]) {
    return favoritesService.reorder(orderedIds);
  }

  pin(id: string, pinned?: boolean) {
    return favoritesService.pin(id, pinned);
  }
}
