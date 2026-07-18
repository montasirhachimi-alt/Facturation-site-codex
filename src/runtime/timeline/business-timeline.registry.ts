import type { TimelineProvider, TimelineProviderRegistration } from "./business-timeline.types";

export class TimelineRegistry {
  private readonly providers = new Map<string, TimelineProvider>();
  private readonly registeredAt = new Map<string, string>();
  private readonly now: () => string;

  constructor(now: () => string = () => new Date().toISOString()) {
    this.now = now;
  }

  register(provider: TimelineProvider): TimelineProviderRegistration {
    if (!provider.id.trim()) {
      throw new Error("Timeline provider id is required.");
    }

    if (this.providers.has(provider.id)) {
      throw new Error(`Timeline provider already registered: ${provider.id}`);
    }

    this.providers.set(provider.id, provider);
    this.registeredAt.set(provider.id, this.now());

    return this.toRegistration(provider);
  }

  unregister(providerId: string) {
    this.registeredAt.delete(providerId);
    return this.providers.delete(providerId);
  }

  find(providerId: string) {
    return this.providers.get(providerId);
  }

  list(): readonly TimelineProvider[] {
    return Object.freeze([...this.providers.values()]);
  }

  listRegistrations(): readonly TimelineProviderRegistration[] {
    return Object.freeze([...this.providers.values()].map((provider) => this.toRegistration(provider)));
  }

  clear() {
    this.providers.clear();
    this.registeredAt.clear();
  }

  private toRegistration(provider: TimelineProvider): TimelineProviderRegistration {
    return Object.freeze({
      id: provider.id,
      label: provider.label,
      registeredAt: this.registeredAt.get(provider.id) ?? this.now()
    });
  }
}
