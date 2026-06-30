import { activityService } from "@/core/activity";
import type { ActivityCategory, ActivityInput, ActivitySeverity } from "@/core/activity";

export class ActivityService {
  track(input: ActivityInput) {
    return activityService.register(input);
  }

  getTimeline(limit?: number) {
    return activityService.getRecent(limit);
  }

  getByCategory(category: ActivityCategory) {
    return activityService.getByCategory(category);
  }

  getBySeverity(severity: ActivitySeverity) {
    return activityService.getBySeverity(severity);
  }

  pin(id: string, pinned?: boolean) {
    return activityService.pin(id, pinned);
  }

  favorite(id: string, favorite?: boolean) {
    return activityService.favorite(id, favorite);
  }
}
