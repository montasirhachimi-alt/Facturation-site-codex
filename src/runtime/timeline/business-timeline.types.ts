export type TimelineEventStatus = "neutral" | "success" | "warning" | "danger" | "info";

export type TimelineEventMetadata = Readonly<Record<string, unknown>>;

export type TimelineEventActor = Readonly<{
  id?: string;
  name: string;
  role?: string;
}>;

export type TimelineEventLink = Readonly<{
  href: string;
  label?: string;
}>;

export type TimelineEvent = Readonly<{
  id: string;
  entityType: string;
  entityId: string;
  eventType: string;
  title: string;
  description?: string;
  date: string;
  actor?: string | TimelineEventActor;
  status?: TimelineEventStatus;
  link?: string | TimelineEventLink;
  metadata?: TimelineEventMetadata;
}>;

export type TimelineQuery = Readonly<{
  entityType: string;
  entityId: string;
  from?: string;
  to?: string;
  limit?: number;
  eventTypes?: readonly string[];
}>;

export type TimelineProviderContext = Readonly<{
  requestedAt: string;
}>;

export type TimelineProviderResult = readonly TimelineEvent[] | Promise<readonly TimelineEvent[]>;

export type TimelineProvider = Readonly<{
  id: string;
  label?: string;
  supports(query: TimelineQuery): boolean;
  getEvents(query: TimelineQuery, context: TimelineProviderContext): TimelineProviderResult;
}>;

export type TimelineProviderRegistration = Readonly<{
  id: string;
  label?: string;
  registeredAt: string;
}>;

export type TimelineServiceOptions = Readonly<{
  now?: () => string;
}>;
