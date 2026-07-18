import type { SearchProvider, SearchQuery, SearchResult } from "@/runtime/search";
import { DELIVERY_NOTES_WORKSPACE_ID, deliveryNoteService } from "@/modules/sales/delivery-notes";
import { invoiceService } from "@/modules/sales/invoices";
import { paymentService } from "@/modules/sales/payments";
import { quoteService, SALES_QUOTES_WORKSPACE_ID } from "@/modules/sales/quotes";
import { SALES_ORDERS_WORKSPACE_ID, salesOrderService } from "@/modules/sales/orders";
import {
  mapDeliveryNoteToSearchResult,
  mapInvoiceToSearchResult,
  mapPaymentToSearchResult,
  mapQuoteToSearchResult,
  mapSalesOrderToSearchResult
} from "./sales-search.mapper";

export const salesSearchProviders: readonly SearchProvider[] = Object.freeze([
  Object.freeze({
    moduleId: "sales.quotes",
    label: "Sales Quotes Search Provider",
    search: async (query: SearchQuery) =>
      Object.freeze(
        quoteService
          .listQuotes({ workspaceId: SALES_QUOTES_WORKSPACE_ID })
          .quotes.map((quote) => mapQuoteToSearchResult(quote, query.text))
          .filter(isSearchResult)
      )
  }),
  Object.freeze({
    moduleId: "sales.invoices",
    label: "Sales Invoices Search Provider",
    search: async (query: SearchQuery) =>
      Object.freeze(
        invoiceService
          .listInvoices({ workspaceId: SALES_QUOTES_WORKSPACE_ID, includeArchived: false })
          .invoices.map((invoice) => mapInvoiceToSearchResult(invoice, query.text))
          .filter(isSearchResult)
      )
  }),
  Object.freeze({
    moduleId: "sales.orders",
    label: "Sales Orders Search Provider",
    search: async (query: SearchQuery) =>
      Object.freeze(
        salesOrderService
          .listOrders({ workspaceId: SALES_ORDERS_WORKSPACE_ID, includeArchived: false })
          .orders.map((order) => mapSalesOrderToSearchResult(order, query.text))
          .filter(isSearchResult)
      )
  }),
  Object.freeze({
    moduleId: "sales.delivery-notes",
    label: "Sales Delivery Notes Search Provider",
    search: async (query: SearchQuery) =>
      Object.freeze(
        deliveryNoteService
          .listDeliveryNotes({ workspaceId: DELIVERY_NOTES_WORKSPACE_ID, includeArchived: false })
          .deliveryNotes.map((note) => mapDeliveryNoteToSearchResult(note, query.text))
          .filter(isSearchResult)
      )
  }),
  Object.freeze({
    moduleId: "sales.payments",
    label: "Sales Payments Search Provider",
    search: async (query: SearchQuery) =>
      Object.freeze(
        paymentService
          .listPayments({ workspaceId: SALES_QUOTES_WORKSPACE_ID, includeArchived: false })
          .payments.map((payment) => mapPaymentToSearchResult(payment, query.text))
          .filter(isSearchResult)
      )
  })
]);

export const salesSearchProvider = salesSearchProviders[0];

function isSearchResult(result: SearchResult | undefined): result is SearchResult {
  return Boolean(result);
}
