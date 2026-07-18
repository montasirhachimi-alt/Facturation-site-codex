import { invoiceService } from "@/modules/sales/invoices";
import type { InvoiceId } from "@/modules/sales/invoices/invoice.types";
import { salesOrderService, SALES_ORDERS_WORKSPACE_ID } from "@/modules/sales/orders";
import type { SalesOrderId } from "@/modules/sales/orders/order.types";
import { paymentService } from "@/modules/sales/payments";
import type { PaymentId } from "@/modules/sales/payments/payment.types";
import { quoteService } from "@/modules/sales/quotes";
import { SALES_QUOTES_WORKSPACE_ID } from "@/modules/sales/quotes/quotes.seed";
import type { QuoteId } from "@/modules/sales/quotes/quote.types";
import type { SalesTimelineDataSource } from "./sales-timeline.types";

export function createDefaultSalesTimelineDataSource(): SalesTimelineDataSource {
  return Object.freeze({
    getQuote: (id: QuoteId) => quoteService.getQuote(id, SALES_QUOTES_WORKSPACE_ID),
    listQuotes: () => quoteService.listQuotes({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).quotes,
    getOrder: (id: SalesOrderId) => salesOrderService.getOrder(id, SALES_ORDERS_WORKSPACE_ID),
    listOrders: () => salesOrderService.listOrders({ workspaceId: SALES_ORDERS_WORKSPACE_ID, includeArchived: true }).orders,
    getInvoice: (id: InvoiceId) => invoiceService.getInvoice(id, SALES_QUOTES_WORKSPACE_ID),
    listInvoices: () => invoiceService.listInvoices({ workspaceId: SALES_QUOTES_WORKSPACE_ID, includeArchived: true }).invoices,
    getPayment: (id: PaymentId) => paymentService.getPayment(id, SALES_QUOTES_WORKSPACE_ID),
    listPayments: () => paymentService.listPayments({ workspaceId: SALES_QUOTES_WORKSPACE_ID, includeArchived: true }).payments
  });
}
