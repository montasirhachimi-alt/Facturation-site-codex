import type { Invoice, InvoiceId } from "@/modules/sales/invoices/invoice.types";
import type { SalesOrder, SalesOrderId } from "@/modules/sales/orders/order.types";
import type { Payment, PaymentId } from "@/modules/sales/payments/payment.types";
import type { Quote, QuoteId } from "@/modules/sales/quotes/quote.types";

export type SalesTimelineEntityType = "sales.quote" | "sales.order" | "sales.invoice" | "sales.payment";

export type SalesTimelineDocumentType = "quote" | "order" | "invoice" | "payment";

export type SalesTimelineSourceDocument = Readonly<{
  type: SalesTimelineDocumentType;
  id: string;
  number: string;
}>;

export type SalesTimelineJourney = Readonly<{
  rootType: SalesTimelineEntityType;
  rootId: string;
  quotes: readonly Quote[];
  orders: readonly SalesOrder[];
  invoices: readonly Invoice[];
  payments: readonly Payment[];
}>;

export type SalesTimelineDataSource = Readonly<{
  getQuote(id: QuoteId): Quote | undefined;
  listQuotes(): readonly Quote[];
  getOrder(id: SalesOrderId): SalesOrder | undefined;
  listOrders(): readonly SalesOrder[];
  getInvoice(id: InvoiceId): Invoice | undefined;
  listInvoices(): readonly Invoice[];
  getPayment(id: PaymentId): Payment | undefined;
  listPayments(): readonly Payment[];
}>;
