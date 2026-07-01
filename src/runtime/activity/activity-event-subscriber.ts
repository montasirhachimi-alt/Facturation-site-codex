import { ActivityService } from "@/services/activity";
import { platformEventRuntime } from "@/runtime/platform-events";
import type { EventSubscription, PlatformEvent, PlatformEventRuntime } from "@/runtime/platform-events";
import { mapPlatformEventToActivity, toActivityInput } from "./activity-event-mapper";
import type { ActivityEventMapper, ActivityEventSubscriberService } from "./activity-event-subscriber.types";

type ActivityEventSubscriberOptions = {
  runtime?: PlatformEventRuntime;
  activityService?: ActivityEventSubscriberService;
  mapper?: ActivityEventMapper;
};

export class ActivityEventSubscriber {
  private readonly runtime: PlatformEventRuntime;
  private readonly activityService: ActivityEventSubscriberService;
  private readonly mapper: ActivityEventMapper;
  private readonly processedEventIds = new Set<string>();
  private readonly createdActivityIds = new Set<string>();
  private subscription: EventSubscription | null = null;

  constructor(options: ActivityEventSubscriberOptions = {}) {
    this.runtime = options.runtime ?? platformEventRuntime;
    this.activityService = options.activityService ?? new ActivityService();
    this.mapper = options.mapper ?? mapPlatformEventToActivity;
  }

  start() {
    if (this.subscription) return this.subscription;

    this.subscription = this.runtime.subscribe({}, this.handleEvent);
    return this.subscription;
  }

  stop() {
    if (!this.subscription) return false;

    const removed = this.runtime.unsubscribe(this.subscription);
    this.subscription = null;
    return removed;
  }

  isStarted() {
    return Boolean(this.subscription);
  }

  private readonly handleEvent = (event: PlatformEvent) => {
    try {
      if (this.processedEventIds.has(event.id)) return;

      const model = this.mapper(event);
      if (!model) return;

      this.processedEventIds.add(event.id);

      if (this.hasActivity(model.id)) return;

      this.activityService.track(toActivityInput(model));
      this.createdActivityIds.add(model.id);
    } catch {
      // Activity subscribers must never interrupt platform event delivery.
    }
  };

  private hasActivity(activityId: string) {
    if (this.createdActivityIds.has(activityId)) return true;

    return Boolean(this.activityService.getTimeline?.().some((activity) => activity.id === activityId));
  }
}

export const activityEventSubscriber = new ActivityEventSubscriber();
