import type { Invoice, InvoiceId } from "@/modules/sales/invoices/invoice.types";
import type { SalesOrder, SalesOrderId } from "@/modules/sales/orders/order.types";
import type { Payment, PaymentId } from "@/modules/sales/payments/payment.types";
import type { Quote, QuoteId } from "@/modules/sales/quotes/quote.types";
import type { TimelineEvent, TimelineProvider, TimelineQuery } from "@/runtime/timeline";
import { createDefaultSalesTimelineDataSource } from "./sales-timeline.data-source";
import {
  mapSalesInvoiceTimelineEvents,
  mapSalesOrderTimelineEvents,
  mapSalesPaymentTimelineEvents,
  mapSalesQuoteTimelineEvents
} from "./sales-timeline.mapper";
import type { SalesTimelineDataSource, SalesTimelineEntityType, SalesTimelineJourney } from "./sales-timeline.types";
import { isSalesTimelineQuery, normalizeSalesTimelineEntityType } from "./sales-timeline.utils";

export const SALES_TIMELINE_PROVIDER_ID = "sales.timeline";

export class SalesTimelineProvider implements TimelineProvider {
  readonly id = SALES_TIMELINE_PROVIDER_ID;
  readonly label = "Sales Timeline Provider";

  private readonly dataSource: SalesTimelineDataSource;

  constructor(dataSource: SalesTimelineDataSource = createDefaultSalesTimelineDataSource()) {
    this.dataSource = dataSource;
  }

  supports(query: TimelineQuery) {
    return isSalesTimelineQuery(query);
  }

  getEvents(query: TimelineQuery): readonly TimelineEvent[] {
    const rootType = normalizeSalesTimelineEntityType(query.entityType);
    if (!rootType) return Object.freeze([]);

    const journey = this.resolveJourney(rootType, query.entityId);
    if (!journey) return Object.freeze([]);

    const events = [
      ...journey.quotes.flatMap((quote) => mapSalesQuoteTimelineEvents(rootType, query, quote)),
      ...journey.orders.flatMap((order) => mapSalesOrderTimelineEvents(rootType, query, order)),
      ...journey.invoices.flatMap((invoice) => mapSalesInvoiceTimelineEvents(rootType, query, invoice)),
      ...journey.payments.flatMap((payment) => mapSalesPaymentTimelineEvents(rootType, query, payment))
    ];

    return Object.freeze(events);
  }

  private resolveJourney(rootType: SalesTimelineEntityType, rootId: string): SalesTimelineJourney | undefined {
    switch (rootType) {
      case "sales.quote":
        return this.resolveFromQuote(rootId as QuoteId);
      case "sales.order":
        return this.resolveFromOrder(rootId as SalesOrderId);
      case "sales.invoice":
        return this.resolveFromInvoice(rootId as InvoiceId);
      case "sales.payment":
        return this.resolveFromPayment(rootId as PaymentId);
    }
  }

  private resolveFromQuote(quoteId: QuoteId): SalesTimelineJourney | undefined {
    const quote = this.dataSource.getQuote(quoteId);
    if (!quote) return undefined;

    return this.createJourney("sales.quote", quote.id, [quote]);
  }

  private resolveFromOrder(orderId: SalesOrderId): SalesTimelineJourney | undefined {
    const order = this.dataSource.getOrder(orderId);
    if (!order) return undefined;

    const quote = order.sourceQuoteId ? this.dataSource.getQuote(order.sourceQuoteId) : undefined;
    return this.createJourney("sales.order", order.id, quote ? [quote] : [], [order]);
  }

  private resolveFromInvoice(invoiceId: InvoiceId): SalesTimelineJourney | undefined {
    const invoice = this.dataSource.getInvoice(invoiceId);
    if (!invoice) return undefined;

    const quote = invoice.quoteId ? this.dataSource.getQuote(invoice.quoteId) : undefined;
    return this.createJourney("sales.invoice", invoice.id, quote ? [quote] : [], [], [invoice]);
  }

  private resolveFromPayment(paymentId: PaymentId): SalesTimelineJourney | undefined {
    const payment = this.dataSource.getPayment(paymentId);
    if (!payment) return undefined;

    const invoice = this.dataSource.getInvoice(payment.invoiceId);
    const quote = invoice?.quoteId ? this.dataSource.getQuote(invoice.quoteId) : undefined;
    return this.createJourney("sales.payment", payment.id, quote ? [quote] : [], [], invoice ? [invoice] : [], [payment]);
  }

  private createJourney(
    rootType: SalesTimelineEntityType,
    rootId: string,
    quotes: readonly Quote[] = [],
    orders: readonly SalesOrder[] = [],
    invoices: readonly Invoice[] = [],
    payments: readonly Payment[] = []
  ): SalesTimelineJourney {
    const quoteIds = new Set(quotes.map((quote) => quote.id));
    const invoiceIds = new Set(invoices.map((invoice) => invoice.id));
    const relatedOrders = this.dataSource.listOrders().filter((order) => order.sourceQuoteId && quoteIds.has(order.sourceQuoteId));
    const relatedInvoices = this.dataSource.listInvoices().filter((invoice) => invoice.quoteId && quoteIds.has(invoice.quoteId));
    const allInvoices = uniqueById([...invoices, ...relatedInvoices]);
    const allInvoiceIds = new Set([...invoiceIds, ...allInvoices.map((invoice) => invoice.id)]);
    const relatedPayments = this.dataSource.listPayments().filter((payment) => allInvoiceIds.has(payment.invoiceId));

    return Object.freeze({
      rootType,
      rootId,
      quotes: uniqueById(quotes),
      orders: uniqueById([...orders, ...relatedOrders]),
      invoices: allInvoices,
      payments: uniqueById([...payments, ...relatedPayments])
    });
  }
}

function uniqueById<TRecord extends { readonly id: string }>(records: readonly TRecord[]): readonly TRecord[] {
  const byId = new Map<string, TRecord>();

  for (const record of records) {
    byId.set(record.id, record);
  }

  return Object.freeze([...byId.values()]);
}
