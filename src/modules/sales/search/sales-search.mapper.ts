import type { DeliveryNote } from "@/modules/sales/delivery-notes";
import { DELIVERY_NOTE_STATUS_LABELS } from "@/modules/sales/delivery-notes";
import type { Invoice } from "@/modules/sales/invoices";
import { INVOICE_STATUS_LABELS } from "@/modules/sales/invoices";
import type { Payment } from "@/modules/sales/payments";
import { PAYMENT_STATUS_LABELS } from "@/modules/sales/payments";
import type { Quote } from "@/modules/sales/quotes";
import { QUOTE_STATUS_LABELS } from "@/modules/sales/quotes";
import type { SalesOrder } from "@/modules/sales/orders";
import { SALES_ORDER_STATUS_LABELS } from "@/modules/sales/orders";
import type { SearchResult } from "@/runtime/search";
import { scoreSearchFields } from "@/runtime/search";

export function mapQuoteToSearchResult(quote: Quote, queryText: string): SearchResult | undefined {
  const score = scoreSearchFields(queryText, [
    { value: quote.id, weight: "identifier" },
    { value: quote.number, weight: "identifier" },
    { value: quote.customerName, weight: "title" },
    { value: quote.companyName, weight: "title" },
    { value: quote.contactName, weight: "secondary" },
    { value: quote.opportunityName, weight: "secondary" },
    { value: quote.status, weight: "metadata" },
    { value: QUOTE_STATUS_LABELS[quote.status], weight: "metadata" },
    { value: quote.notes, weight: "metadata" }
  ]);

  if (score <= 0) return undefined;

  return createSalesResult({
    id: `sales:quote:${quote.id}`,
    entityType: "sales.quote",
    entityId: quote.id,
    moduleId: "sales.quotes",
    title: quote.number,
    subtitle: quote.companyName ?? quote.customerName,
    description: [QUOTE_STATUS_LABELS[quote.status], quote.contactName, quote.opportunityName].filter(Boolean).join(" · "),
    keywords: [quote.id, quote.number, quote.customerName, quote.companyName, quote.contactName, quote.opportunityName, quote.status, quote.notes],
    icon: "FileText",
    url: `/sales/quotes/${quote.id}`,
    score,
    status: quote.status,
    workspaceId: quote.workspaceId
  });
}

export function mapInvoiceToSearchResult(invoice: Invoice, queryText: string): SearchResult | undefined {
  const score = scoreSearchFields(queryText, [
    { value: invoice.id, weight: "identifier" },
    { value: invoice.number, weight: "identifier" },
    { value: invoice.customerName, weight: "title" },
    { value: invoice.companyName, weight: "title" },
    { value: invoice.contactName, weight: "secondary" },
    { value: invoice.quoteId, weight: "secondary" },
    { value: invoice.status, weight: "metadata" },
    { value: INVOICE_STATUS_LABELS[invoice.status], weight: "metadata" },
    { value: invoice.notes, weight: "metadata" }
  ]);

  if (score <= 0) return undefined;

  return createSalesResult({
    id: `sales:invoice:${invoice.id}`,
    entityType: "sales.invoice",
    entityId: invoice.id,
    moduleId: "sales.invoices",
    title: invoice.number,
    subtitle: invoice.companyName ?? invoice.customerName,
    description: [INVOICE_STATUS_LABELS[invoice.status], invoice.contactName, invoice.quoteId].filter(Boolean).join(" · "),
    keywords: [invoice.id, invoice.number, invoice.customerName, invoice.companyName, invoice.contactName, invoice.quoteId, invoice.status, invoice.notes],
    icon: "Receipt",
    url: `/sales/invoices/${invoice.id}`,
    score,
    status: invoice.status,
    workspaceId: invoice.workspaceId
  });
}

export function mapSalesOrderToSearchResult(order: SalesOrder, queryText: string): SearchResult | undefined {
  const score = scoreSearchFields(queryText, [
    { value: order.id, weight: "identifier" },
    { value: order.number, weight: "identifier" },
    { value: order.sourceQuoteNumber, weight: "identifier" },
    { value: order.companyName, weight: "title" },
    { value: order.contactName, weight: "secondary" },
    { value: order.customerReference, weight: "secondary" },
    { value: order.internalReference, weight: "secondary" },
    { value: order.status, weight: "metadata" },
    { value: SALES_ORDER_STATUS_LABELS[order.status], weight: "metadata" },
    { value: order.notes, weight: "metadata" }
  ]);

  if (score <= 0) return undefined;

  return createSalesResult({
    id: `sales:order:${order.id}`,
    entityType: "sales.order",
    entityId: order.id,
    moduleId: "sales.orders",
    title: order.number,
    subtitle: order.companyName,
    description: [SALES_ORDER_STATUS_LABELS[order.status], order.sourceQuoteNumber, order.customerReference].filter(Boolean).join(" · "),
    keywords: [order.id, order.number, order.companyName, order.contactName, order.sourceQuoteNumber, order.customerReference, order.internalReference, order.status, order.notes],
    icon: "ClipboardCheck",
    url: `/sales/orders/${order.id}`,
    score,
    status: order.status,
    workspaceId: order.workspaceId
  });
}

export function mapDeliveryNoteToSearchResult(note: DeliveryNote, queryText: string): SearchResult | undefined {
  const score = scoreSearchFields(queryText, [
    { value: note.id, weight: "identifier" },
    { value: note.number, weight: "identifier" },
    { value: note.salesOrderNumber, weight: "identifier" },
    { value: note.companyName, weight: "title" },
    { value: note.contactName, weight: "secondary" },
    { value: note.customerReference, weight: "secondary" },
    { value: note.warehouseName, weight: "secondary" },
    { value: note.status, weight: "metadata" },
    { value: DELIVERY_NOTE_STATUS_LABELS[note.status], weight: "metadata" },
    { value: note.notes, weight: "metadata" }
  ]);

  if (score <= 0) return undefined;

  return createSalesResult({
    id: `sales:delivery-note:${note.id}`,
    entityType: "sales.delivery-note",
    entityId: note.id,
    moduleId: "sales.delivery-notes",
    title: note.number,
    subtitle: note.companyName,
    description: [DELIVERY_NOTE_STATUS_LABELS[note.status], note.salesOrderNumber, note.warehouseName].filter(Boolean).join(" · "),
    keywords: [note.id, note.number, note.companyName, note.contactName, note.salesOrderNumber, note.customerReference, note.warehouseName, note.status, note.notes],
    icon: "Truck",
    url: `/sales/delivery-notes/${note.id}`,
    score,
    status: note.status,
    workspaceId: note.workspaceId
  });
}

export function mapPaymentToSearchResult(payment: Payment, queryText: string): SearchResult | undefined {
  const score = scoreSearchFields(queryText, [
    { value: payment.id, weight: "identifier" },
    { value: payment.number, weight: "identifier" },
    { value: payment.invoiceNumber, weight: "identifier" },
    { value: payment.reference, weight: "identifier" },
    { value: payment.customerName, weight: "title" },
    { value: payment.status, weight: "metadata" },
    { value: PAYMENT_STATUS_LABELS[payment.status], weight: "metadata" },
    { value: payment.method, weight: "metadata" },
    { value: payment.notes, weight: "metadata" }
  ]);

  if (score <= 0) return undefined;

  return createSalesResult({
    id: `sales:payment:${payment.id}`,
    entityType: "sales.payment",
    entityId: payment.id,
    moduleId: "sales.payments",
    title: payment.number,
    subtitle: payment.customerName,
    description: [PAYMENT_STATUS_LABELS[payment.status], payment.invoiceNumber, payment.reference].filter(Boolean).join(" · "),
    keywords: [payment.id, payment.number, payment.invoiceNumber, payment.reference, payment.customerName, payment.status, payment.method, payment.notes],
    icon: "WalletCards",
    url: `/sales/payments/${payment.id}`,
    score,
    status: payment.status,
    workspaceId: payment.workspaceId
  });
}

function createSalesResult(input: {
  id: string;
  entityType: string;
  entityId: string;
  moduleId: SearchResult["moduleId"];
  title: string;
  subtitle?: string;
  description?: string;
  keywords: readonly (string | undefined)[];
  icon: string;
  url: string;
  score: number;
  status: string;
  workspaceId: string;
}): SearchResult {
  return {
    id: input.id,
    entityType: input.entityType,
    entityId: input.entityId,
    moduleId: input.moduleId,
    title: input.title,
    subtitle: input.subtitle,
    description: input.description,
    keywords: input.keywords.filter(Boolean) as string[],
    icon: input.icon,
    url: input.url,
    score: input.score,
    metadata: {
      status: input.status,
      workspaceId: input.workspaceId
    }
  };
}
