import { EventRegistry } from "./platform-event-registry";
import type {
  EventSubscriber,
  EventSubscription,
  PlatformEvent,
  PlatformEventInput,
  PlatformEventMatcher,
  PlatformEventPayload
} from "./platform-event.types";

export class PlatformEventRuntime {
  private readonly registry = new EventRegistry();

  emit<TPayload extends PlatformEventPayload = PlatformEventPayload>(
    eventInput: PlatformEventInput<TPayload>
  ): PlatformEvent<TPayload> {
    const event: PlatformEvent<TPayload> = {
      ...eventInput,
      id: eventInput.id ?? createEventId(),
      timestamp: eventInput.timestamp ?? new Date().toISOString()
    };

    for (const subscription of this.registry.getAll()) {
      if (!matchesEvent(subscription.matcher, event)) continue;

      try {
        subscription.subscriber(event);
      } catch {
        // Subscribers must not break event delivery for other runtime consumers.
      }

      if (subscription.once) {
        this.registry.remove(subscription.id);
      }
    }

    return event;
  }

  subscribe(matcher: PlatformEventMatcher, subscriber: EventSubscriber): EventSubscription {
    return this.registry.register(matcher, subscriber);
  }

  once(matcher: PlatformEventMatcher, subscriber: EventSubscriber): EventSubscription {
    return this.registry.register(matcher, subscriber, true);
  }

  unsubscribe(subscription: string | EventSubscription) {
    return this.registry.remove(typeof subscription === "string" ? subscription : subscription.id);
  }

  clearSubscriptions() {
    this.registry.clear();
  }
}

function createEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function matchesEvent(matcher: PlatformEventMatcher, event: PlatformEvent) {
  if (typeof matcher === "string") {
    return event.type === matcher;
  }

  if (matcher.type && matcher.type !== event.type) return false;
  if (matcher.category && matcher.category !== event.category) return false;
  if (matcher.workspaceId && matcher.workspaceId !== event.workspaceId) return false;
  if (matcher.resourceType && matcher.resourceType !== event.resourceType) return false;

  return true;
}

export const platformEventRuntime = new PlatformEventRuntime();
