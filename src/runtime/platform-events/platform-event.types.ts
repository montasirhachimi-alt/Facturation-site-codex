export type PlatformEventCategory =
  | `workspace.${string}`
  | `dashboard.${string}`
  | `widget.${string}`
  | `preferences.${string}`
  | `notification.${string}`
  | `activity.${string}`
  | `audit.${string}`
  | `plugin.${string}`
  | `crm.${string}`
  | `sales.${string}`
  | `inventory.${string}`
  | `finance.${string}`
  | `security.${string}`
  | `ai.${string}`
  | (string & {});

export type PlatformEventType =
  | "workspace.changed"
  | "dashboard.loaded"
  | "widget.refreshed"
  | "preferences.changed"
  | "notification.created"
  | "activity.recorded"
  | "audit.logged"
  | "plugin.executed"
  | "crm.changed"
  | "sales.changed"
  | "inventory.changed"
  | "finance.changed"
  | "security.detected"
  | "ai.suggested"
  | (string & {});

export type PlatformEventPayload = Record<string, unknown>;

export type PlatformEventMetadata = Record<string, string | number | boolean | null | undefined>;

export type PlatformEvent<TPayload extends PlatformEventPayload = PlatformEventPayload> = {
  id: string;
  type: PlatformEventType;
  category: PlatformEventCategory;
  timestamp: string;
  workspaceId?: string;
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  payload?: TPayload;
  metadata?: PlatformEventMetadata;
};

export type PlatformEventInput<TPayload extends PlatformEventPayload = PlatformEventPayload> = Omit<
  PlatformEvent<TPayload>,
  "id" | "timestamp"
> & {
  id?: string;
  timestamp?: string;
};

export type PlatformEventMatcher =
  | PlatformEventType
  | {
      type?: PlatformEventType;
      category?: PlatformEventCategory;
      workspaceId?: string;
      resourceType?: string;
    };

export type EventSubscriber<TEvent extends PlatformEvent = PlatformEvent> = (event: TEvent) => void;

export type EventSubscription = {
  id: string;
  matcher: PlatformEventMatcher;
  once: boolean;
  createdAt: string;
};

export type EventSubscriptionRecord = EventSubscription & {
  subscriber: EventSubscriber;
};

export type EventEmitter = {
  emit: <TPayload extends PlatformEventPayload = PlatformEventPayload>(
    event: PlatformEventInput<TPayload>
  ) => PlatformEvent<TPayload>;
};
