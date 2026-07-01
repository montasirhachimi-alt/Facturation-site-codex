import type {
  EventSubscriber,
  EventSubscription,
  EventSubscriptionRecord,
  PlatformEventMatcher
} from "./platform-event.types";

export class EventRegistry {
  private readonly subscriptions = new Map<string, EventSubscriptionRecord>();

  register(matcher: PlatformEventMatcher, subscriber: EventSubscriber, once = false): EventSubscription {
    const existingSubscription = [...this.subscriptions.values()].find((subscription) => {
      return subscription.subscriber === subscriber && subscription.once === once && matchersEqual(subscription.matcher, matcher);
    });

    if (existingSubscription) {
      return toPublicSubscription(existingSubscription);
    }

    const subscription: EventSubscriptionRecord = {
      id: createSubscriptionId(),
      matcher,
      subscriber,
      once,
      createdAt: new Date().toISOString()
    };

    this.subscriptions.set(subscription.id, subscription);
    return toPublicSubscription(subscription);
  }

  remove(subscriptionId: string) {
    return this.subscriptions.delete(subscriptionId);
  }

  getAll() {
    return [...this.subscriptions.values()];
  }

  clear() {
    this.subscriptions.clear();
  }
}

function createSubscriptionId() {
  return `evt_sub_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function matchersEqual(first: PlatformEventMatcher, second: PlatformEventMatcher) {
  if (typeof first === "string" || typeof second === "string") {
    return first === second;
  }

  return (
    first.type === second.type &&
    first.category === second.category &&
    first.workspaceId === second.workspaceId &&
    first.resourceType === second.resourceType
  );
}

function toPublicSubscription(subscription: EventSubscriptionRecord): EventSubscription {
  return {
    id: subscription.id,
    matcher: subscription.matcher,
    once: subscription.once,
    createdAt: subscription.createdAt
  };
}
