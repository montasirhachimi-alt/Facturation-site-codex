import { TimelineRegistry } from "./business-timeline.registry";
import type {
  TimelineEvent,
  TimelineProvider,
  TimelineProviderRegistration,
  TimelineQuery,
  TimelineServiceOptions
} from "./business-timeline.types";
import { normalizeTimelineEvents, normalizeTimelineQuery, validateTimelineQuery } from "./business-timeline.utils";

export class BusinessTimelineRuntime {
  private readonly registry: TimelineRegistry;
  private readonly now: () => string;

  constructor(options: TimelineServiceOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.registry = new TimelineRegistry(this.now);
  }

  registerProvider(provider: TimelineProvider): TimelineProviderRegistration {
    return this.registry.register(provider);
  }

  unregisterProvider(providerId: string) {
    return this.registry.unregister(providerId);
  }

  listProviders() {
    return this.registry.listRegistrations();
  }

  async getTimeline(queryInput: TimelineQuery): Promise<readonly TimelineEvent[]> {
    validateTimelineQuery(queryInput);

    const query = normalizeTimelineQuery(queryInput);
    const context = Object.freeze({ requestedAt: this.now() });
    const events: TimelineEvent[] = [];

    for (const provider of this.registry.list()) {
      if (!provider.supports(query)) continue;

      const providerEvents = await provider.getEvents(query, context);
      events.push(...providerEvents);
    }

    return normalizeTimelineEvents(events, query);
  }

  clearProviders() {
    this.registry.clear();
  }
}

export const businessTimelineRuntime = new BusinessTimelineRuntime();
