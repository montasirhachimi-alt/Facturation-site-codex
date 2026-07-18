import { salesRoutes } from "@/modules/sales/sales.routes";
import type { TimelineQuery } from "@/runtime/timeline";
import type { SalesTimelineDocumentType, SalesTimelineEntityType } from "./sales-timeline.types";

const ENTITY_ALIASES = Object.freeze({
  quote: "sales.quote",
  Quote: "sales.quote",
  "sales.quote": "sales.quote",
  salesQuote: "sales.quote",
  SalesQuote: "sales.quote",
  order: "sales.order",
  Order: "sales.order",
  salesOrder: "sales.order",
  SalesOrder: "sales.order",
  "sales.order": "sales.order",
  invoice: "sales.invoice",
  Invoice: "sales.invoice",
  salesInvoice: "sales.invoice",
  SalesInvoice: "sales.invoice",
  "sales.invoice": "sales.invoice",
  payment: "sales.payment",
  Payment: "sales.payment",
  salesPayment: "sales.payment",
  SalesPayment: "sales.payment",
  "sales.payment": "sales.payment"
} satisfies Record<string, SalesTimelineEntityType>);

export function normalizeSalesTimelineEntityType(entityType: string): SalesTimelineEntityType | undefined {
  return ENTITY_ALIASES[entityType.trim() as keyof typeof ENTITY_ALIASES];
}

export function isSalesTimelineQuery(query: TimelineQuery) {
  return Boolean(normalizeSalesTimelineEntityType(query.entityType));
}

export function getSalesTimelineDocumentType(entityType: SalesTimelineEntityType): SalesTimelineDocumentType {
  switch (entityType) {
    case "sales.quote":
      return "quote";
    case "sales.order":
      return "order";
    case "sales.invoice":
      return "invoice";
    case "sales.payment":
      return "payment";
  }
}

export function createSalesTimelineEventId(
  rootType: SalesTimelineEntityType,
  rootId: string,
  sourceType: SalesTimelineDocumentType,
  sourceId: string,
  eventType: string,
  canonicalTimestamp: string
) {
  return ["sales-timeline", rootType, rootId, sourceType, sourceId, eventType, canonicalTimestamp].join(":");
}

export function createSalesTimelineLink(sourceType: SalesTimelineDocumentType, sourceId: string) {
  const routeId = {
    invoice: "sales.invoice.details",
    order: "sales.order.details",
    payment: "sales.payment.details",
    quote: "sales.quote.details"
  }[sourceType] as (typeof salesRoutes)[number]["id"];
  const route = salesRoutes.find((definition) => definition.id === routeId);

  if (!route) return undefined;

  return route.path
    .replace("[quoteId]", sourceId)
    .replace("[orderId]", sourceId)
    .replace("[invoiceId]", sourceId)
    .replace("[paymentId]", sourceId);
}

export function isCanonicalDate(value: string | undefined) {
  return Boolean(value && !Number.isNaN(Date.parse(value)));
}

export function isLaterThan(first: string | undefined, second: string | undefined) {
  if (!isCanonicalDate(first) || !isCanonicalDate(second)) return false;
  return Date.parse(first as string) > Date.parse(second as string);
}
