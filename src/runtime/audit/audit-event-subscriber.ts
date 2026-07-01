import { AuditService } from "@/services/audit";
import { platformEventRuntime } from "@/runtime/platform-events";
import type { EventSubscription, PlatformEvent, PlatformEventRuntime } from "@/runtime/platform-events";
import { mapPlatformEventToAuditRecord, toAuditEventInput } from "./audit-event-mapper";
import type { AuditEventMapper, AuditEventSubscriberService } from "./audit-event-subscriber.types";

type AuditEventSubscriberOptions = {
  runtime?: PlatformEventRuntime;
  auditService?: AuditEventSubscriberService;
  mapper?: AuditEventMapper;
};

export class AuditEventSubscriber {
  private readonly runtime: PlatformEventRuntime;
  private readonly auditService: AuditEventSubscriberService;
  private readonly mapper: AuditEventMapper;
  private readonly processedEventIds = new Set<string>();
  private readonly createdAuditRecordIds = new Set<string>();
  private subscription: EventSubscription | null = null;

  constructor(options: AuditEventSubscriberOptions = {}) {
    this.runtime = options.runtime ?? platformEventRuntime;
    this.auditService = options.auditService ?? new AuditService();
    this.mapper = options.mapper ?? mapPlatformEventToAuditRecord;
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

      const record = this.mapper(event);
      if (!record) return;

      this.processedEventIds.add(event.id);

      if (this.hasAuditRecord(record.id)) return;

      this.auditService.log(toAuditEventInput(record));
      this.createdAuditRecordIds.add(record.id);
    } catch {
      // Audit subscribers must never interrupt platform event delivery.
    }
  };

  private hasAuditRecord(recordId: string) {
    if (this.createdAuditRecordIds.has(recordId)) return true;

    return Boolean(this.auditService.getRecent?.().some((record) => record.id === recordId));
  }
}

export const auditEventSubscriber = new AuditEventSubscriber();
