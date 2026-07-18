import { businessTimelineRuntime } from "@/runtime/timeline";
import type { TimelineProvider, TimelineQuery } from "@/runtime/timeline";
import { ensureDefaultTimelineProvidersRegistered } from "./timeline-provider.bootstrap";

export class TimelineService {
  constructor() {
    ensureDefaultTimelineProvidersRegistered();
  }

  registerProvider(provider: TimelineProvider) {
    return businessTimelineRuntime.registerProvider(provider);
  }

  unregisterProvider(providerId: string) {
    return businessTimelineRuntime.unregisterProvider(providerId);
  }

  listProviders() {
    return businessTimelineRuntime.listProviders();
  }

  getTimeline(query: TimelineQuery) {
    return businessTimelineRuntime.getTimeline(query);
  }
}
