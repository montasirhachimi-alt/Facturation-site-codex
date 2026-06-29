import type { CoreRegistryItem } from "../types";

export type ActivityEventType =
  | "invoice_created"
  | "payment_received"
  | "client_added"
  | "product_updated"
  | "user_login"
  | (string & {});

export type ActivityActor = {
  id: string;
  name: string;
  role?: string;
};

export type ActivityEventDefinition = CoreRegistryItem<{
  eventType: ActivityEventType;
}> & {
  eventType: ActivityEventType;
};

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  actor?: ActivityActor;
  companyId?: string;
  subjectId?: string;
  subjectType?: string;
  message: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};
