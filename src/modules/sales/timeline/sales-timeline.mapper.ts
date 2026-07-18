import { INVOICE_STATUS_LABELS } from "@/modules/sales/invoices/invoice.constants";
import type { Invoice } from "@/modules/sales/invoices/invoice.types";
import { SALES_ORDER_STATUS_LABELS } from "@/modules/sales/orders/order.constants";
import type { SalesOrder } from "@/modules/sales/orders/order.types";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/modules/sales/payments/payment.constants";
import type { Payment } from "@/modules/sales/payments/payment.types";
import { QUOTE_STATUS_LABELS } from "@/modules/sales/quotes/quote.constants";
import type { Quote } from "@/modules/sales/quotes/quote.types";
import type { TimelineEvent, TimelineQuery } from "@/runtime/timeline";
import {
  createSalesTimelineEventId,
  createSalesTimelineLink,
  getSalesTimelineDocumentType,
  isCanonicalDate,
  isLaterThan
} from "./sales-timeline.utils";
import type { SalesTimelineDocumentType, SalesTimelineEntityType } from "./sales-timeline.types";

export function mapSalesQuoteTimelineEvents(rootType: SalesTimelineEntityType, query: TimelineQuery, quote: Quote): readonly TimelineEvent[] {
  const source = createSource("quote", quote.id, quote.number);
  const events = [
    createEvent(rootType, query, source, "sales.quote.created", quote.createdAt, `Devis ${quote.number} créé`, quote.customerName, "info", quote.ownerId),
    isLaterThan(quote.updatedAt, quote.createdAt)
      ? createEvent(rootType, query, source, "sales.quote.updated", quote.updatedAt, `Devis ${quote.number} mis à jour`, `Statut actuel : ${QUOTE_STATUS_LABELS[quote.status]}.`, "neutral", quote.ownerId)
      : undefined,
    isLaterThan(quote.updatedAt, quote.createdAt) && quote.status === "accepted"
      ? createEvent(rootType, query, source, "sales.quote.accepted", quote.updatedAt, `Devis ${quote.number} accepté`, quote.companyName ?? quote.customerName, "success", quote.ownerId)
      : undefined,
    isLaterThan(quote.updatedAt, quote.createdAt) && quote.status === "refused"
      ? createEvent(rootType, query, source, "sales.quote.refused", quote.updatedAt, `Devis ${quote.number} refusé`, quote.companyName ?? quote.customerName, "danger", quote.ownerId)
      : undefined,
    isLaterThan(quote.updatedAt, quote.createdAt) && quote.status === "expired"
      ? createEvent(rootType, query, source, "sales.quote.expired", quote.updatedAt, `Devis ${quote.number} expiré`, quote.companyName ?? quote.customerName, "warning", quote.ownerId)
      : undefined
  ];

  return freezeEvents(events);
}

export function mapSalesOrderTimelineEvents(rootType: SalesTimelineEntityType, query: TimelineQuery, order: SalesOrder): readonly TimelineEvent[] {
  const source = createSource("order", order.id, order.number);
  const events = [
    createEvent(rootType, query, source, "sales.order.created", order.createdAt, `Commande ${order.number} créée`, order.companyName, "info", order.ownerId),
    isCanonicalDate(order.orderDate) && isConfirmedOrderStatus(order.status)
      ? createEvent(rootType, query, source, "sales.order.confirmed", order.orderDate, `Commande ${order.number} datée`, `Statut actuel : ${SALES_ORDER_STATUS_LABELS[order.status]}.`, "neutral", order.ownerId)
      : undefined,
    isLaterThan(order.updatedAt, order.createdAt)
      ? createEvent(rootType, query, source, "sales.order.updated", order.updatedAt, `Commande ${order.number} mise à jour`, `Statut actuel : ${SALES_ORDER_STATUS_LABELS[order.status]}.`, statusToTimelineStatus(order.status), order.ownerId)
      : undefined,
    order.sourceQuoteId
      ? createEvent(rootType, query, source, "sales.quote.converted", order.createdAt, `Devis converti en commande ${order.number}`, order.sourceQuoteNumber ? `Depuis ${order.sourceQuoteNumber}.` : undefined, "success", order.ownerId)
      : undefined
  ];

  return freezeEvents(events);
}

export function mapSalesInvoiceTimelineEvents(rootType: SalesTimelineEntityType, query: TimelineQuery, invoice: Invoice): readonly TimelineEvent[] {
  const source = createSource("invoice", invoice.id, invoice.number);
  const events = [
    createEvent(rootType, query, source, "sales.invoice.created", invoice.createdAt, `Facture ${invoice.number} créée`, invoice.companyName ?? invoice.customerName, "info", invoice.ownerId),
    invoice.status !== "draft" && isCanonicalDate(invoice.issueDate)
      ? createEvent(rootType, query, source, "sales.invoice.issued", invoice.issueDate, `Facture ${invoice.number} émise`, `Statut actuel : ${INVOICE_STATUS_LABELS[invoice.status]}.`, "neutral", invoice.ownerId)
      : undefined,
    isLaterThan(invoice.updatedAt, invoice.createdAt)
      ? createEvent(rootType, query, source, "sales.invoice.updated", invoice.updatedAt, `Facture ${invoice.number} mise à jour`, `Statut actuel : ${INVOICE_STATUS_LABELS[invoice.status]}.`, invoiceStatusToTimelineStatus(invoice.status), invoice.ownerId)
      : undefined
  ];

  return freezeEvents(events);
}

export function mapSalesPaymentTimelineEvents(rootType: SalesTimelineEntityType, query: TimelineQuery, payment: Payment): readonly TimelineEvent[] {
  const source = createSource("payment", payment.id, payment.number);
  const events = [
    createEvent(
      rootType,
      query,
      source,
      "sales.payment.recorded",
      payment.receivedAt,
      `Paiement ${payment.number} enregistré`,
      `${PAYMENT_METHOD_LABELS[payment.method]} · ${payment.invoiceNumber}`,
      payment.status === "cancelled" ? "danger" : "success",
      payment.ownerId
    ),
    isLaterThan(payment.updatedAt, payment.createdAt)
      ? createEvent(rootType, query, source, "sales.payment.updated", payment.updatedAt, `Paiement ${payment.number} mis à jour`, `Statut actuel : ${PAYMENT_STATUS_LABELS[payment.status]}.`, payment.status === "cancelled" ? "danger" : "neutral", payment.ownerId)
      : undefined,
    payment.archivedAt && payment.status === "cancelled"
      ? createEvent(rootType, query, source, "sales.payment.cancelled", payment.archivedAt, `Paiement ${payment.number} annulé`, payment.invoiceNumber, "danger", payment.ownerId)
      : undefined
  ];

  return freezeEvents(events);
}

function createEvent(
  rootType: SalesTimelineEntityType,
  query: TimelineQuery,
  source: Readonly<{ type: SalesTimelineDocumentType; id: string; number: string }>,
  eventType: string,
  date: string,
  title: string,
  description: string | undefined,
  status: TimelineEvent["status"],
  ownerId: string
): TimelineEvent | undefined {
  if (!isCanonicalDate(date)) return undefined;

  const event = {
    id: createSalesTimelineEventId(rootType, query.entityId, source.type, source.id, eventType, date),
    entityType: query.entityType,
    entityId: query.entityId,
    eventType,
    title,
    description,
    date,
    actor: ownerId ? { id: ownerId, name: ownerId } : undefined,
    status,
    link: createSalesTimelineLink(source.type, source.id)
      ? { href: createSalesTimelineLink(source.type, source.id) as string, label: source.number }
      : undefined,
    metadata: {
      providerId: "sales.timeline",
      rootType,
      sourceEntityType: getSalesTimelineDocumentType(rootType) === source.type ? rootType : `sales.${source.type}`,
      sourceEntityId: source.id,
      sourceDocumentNumber: source.number,
      sourceDocumentType: source.type
    }
  } satisfies TimelineEvent;

  return Object.freeze(event);
}

function createSource(type: SalesTimelineDocumentType, id: string, number: string) {
  return Object.freeze({ type, id, number });
}

function freezeEvents(events: readonly (TimelineEvent | undefined)[]) {
  return Object.freeze(events.filter((event): event is TimelineEvent => Boolean(event)));
}

function statusToTimelineStatus(status: SalesOrder["status"]): TimelineEvent["status"] {
  if (status === "cancelled" || status === "archived") return "danger";
  if (status === "delivered" || status === "reserved") return "success";
  if (status === "partially_delivered" || status === "partially_reserved") return "warning";
  return "neutral";
}

function isConfirmedOrderStatus(status: SalesOrder["status"]) {
  return status === "confirmed" || status === "partially_reserved" || status === "reserved" || status === "partially_delivered" || status === "delivered";
}

function invoiceStatusToTimelineStatus(status: Invoice["status"]): TimelineEvent["status"] {
  if (status === "cancelled" || status === "overdue") return "danger";
  if (status === "paid") return "success";
  if (status === "partially_paid") return "warning";
  return "neutral";
}
