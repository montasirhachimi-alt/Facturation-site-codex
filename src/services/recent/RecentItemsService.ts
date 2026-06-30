import { recentItemsService } from "@/core/recent";
import type { RecentItemInput, RecentItemTargetType } from "@/core/recent";

export class RecentItemsService {
  add(input: RecentItemInput) {
    return recentItemsService.register(input);
  }

  remove(id: string) {
    return recentItemsService.remove(id);
  }

  clear() {
    recentItemsService.clear();
  }

  getAll() {
    return recentItemsService.getAll();
  }

  getByType(targetType: RecentItemTargetType) {
    return recentItemsService.getByType(targetType);
  }

  pin(id: string, pinned?: boolean) {
    return recentItemsService.pin(id, pinned);
  }

  favorite(id: string, favorite?: boolean) {
    return recentItemsService.favorite(id, favorite);
  }
}
