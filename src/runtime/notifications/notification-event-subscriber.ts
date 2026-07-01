import { NotificationService } from "@/services/notifications";
import { platformEventRuntime } from "@/runtime/platform-events";
import type { EventSubscription, PlatformEvent, PlatformEventRuntime } from "@/runtime/platform-events";
import { mapPlatformEventToNotification, toNotificationInput } from "./notification-event-mapper";
import type { NotificationEventMapper, NotificationEventSubscriberService } from "./notification-event-subscriber.types";

type NotificationEventSubscriberOptions = {
  runtime?: PlatformEventRuntime;
  notificationService?: NotificationEventSubscriberService;
  mapper?: NotificationEventMapper;
};

export class NotificationEventSubscriber {
  private readonly runtime: PlatformEventRuntime;
  private readonly notificationService: NotificationEventSubscriberService;
  private readonly mapper: NotificationEventMapper;
  private readonly processedEventIds = new Set<string>();
  private readonly createdNotificationIds = new Set<string>();
  private subscription: EventSubscription | null = null;

  constructor(options: NotificationEventSubscriberOptions = {}) {
    this.runtime = options.runtime ?? platformEventRuntime;
    this.notificationService = options.notificationService ?? new NotificationService();
    this.mapper = options.mapper ?? mapPlatformEventToNotification;
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

      const request = this.mapper(event);
      if (!request) return;

      this.processedEventIds.add(event.id);

      if (this.hasNotification(request.id)) return;

      this.notificationService.notify(toNotificationInput(request));
      this.createdNotificationIds.add(request.id);
    } catch {
      // Notification subscribers must never interrupt platform event delivery.
    }
  };

  private hasNotification(notificationId: string) {
    if (this.createdNotificationIds.has(notificationId)) return true;

    return Boolean(this.notificationService.getAll?.().some((notification) => notification.id === notificationId));
  }
}

export const notificationEventSubscriber = new NotificationEventSubscriber();
