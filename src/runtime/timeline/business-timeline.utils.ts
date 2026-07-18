import type { TimelineEvent, TimelineQuery } from "./business-timeline.types";

export function normalizeTimelineQuery(query: TimelineQuery): TimelineQuery {
  return Object.freeze({
    ...query,
    entityType: query.entityType.trim(),
    entityId: query.entityId.trim(),
    eventTypes: query.eventTypes ? Object.freeze([...query.eventTypes]) : undefined
  });
}

export function validateTimelineQuery(query: TimelineQuery) {
  if (!query.entityType.trim()) {
    throw new Error("Timeline query requires an entityType.");
  }

  if (!query.entityId.trim()) {
    throw new Error("Timeline query requires an entityId.");
  }
}

export function normalizeTimelineEvents(events: readonly TimelineEvent[], query: TimelineQuery): readonly TimelineEvent[] {
  const unique = new Map<string, TimelineEvent>();

  for (const event of events) {
    if (!isTimelineEventForQuery(event, query)) continue;
    if (!isWithinTimelineRange(event, query)) continue;
    if (query.eventTypes?.length && !query.eventTypes.includes(event.eventType)) continue;

    unique.set(event.id, freezeTimelineEvent(event));
  }

  const sorted = [...unique.values()].sort(compareTimelineEvents);
  const limited = typeof query.limit === "number" && query.limit >= 0 ? sorted.slice(0, query.limit) : sorted;

  return Object.freeze(limited);
}

export function compareTimelineEvents(first: TimelineEvent, second: TimelineEvent) {
  const dateComparison = Date.parse(second.date) - Date.parse(first.date);
  if (dateComparison !== 0) return dateComparison;

  return first.id.localeCompare(second.id);
}

export function freezeTimelineEvent(event: TimelineEvent): TimelineEvent {
  return Object.freeze({
    ...event,
    actor: typeof event.actor === "object" && event.actor ? Object.freeze({ ...event.actor }) : event.actor,
    link: typeof event.link === "object" && event.link ? Object.freeze({ ...event.link }) : event.link,
    metadata: event.metadata ? Object.freeze({ ...event.metadata }) : undefined
  });
}

function isTimelineEventForQuery(event: TimelineEvent, query: TimelineQuery) {
  return event.entityType === query.entityType && event.entityId === query.entityId;
}

function isWithinTimelineRange(event: TimelineEvent, query: TimelineQuery) {
  const eventTime = Date.parse(event.date);

  if (Number.isNaN(eventTime)) return false;
  if (query.from && eventTime < Date.parse(query.from)) return false;
  if (query.to && eventTime > Date.parse(query.to)) return false;

  return true;
}
