import type { SalesRouteDefinition } from "./sales.types";

export const salesRoutes = Object.freeze([
  defineRoute("sales", "/sales", "sales.read", "Sales module entry route."),
  defineRoute("sales.quotes", "/sales/quotes", "sales.quote.read", "Sales quotes workspace route."),
  defineRoute("sales.quote.details", "/sales/quotes/[quoteId]", "sales.quote.read", "Sales quote details route."),
  defineRoute("sales.invoices", "/sales/invoices", "sales.invoice.read", "Sales invoices workspace route."),
  defineRoute("sales.invoice.details", "/sales/invoices/[invoiceId]", "sales.invoice.read", "Sales invoice details route."),
  defineRoute("sales.orders", "/sales/orders", "sales.order.read", "Sales orders workspace route."),
  defineRoute("sales.order.details", "/sales/orders/[orderId]", "sales.order.read", "Sales order details route."),
  defineRoute("sales.delivery-notes", "/sales/delivery-notes", "sales.delivery-note.read", "Sales delivery notes workspace route."),
  defineRoute("sales.delivery-note.details", "/sales/delivery-notes/[deliveryNoteId]", "sales.delivery-note.read", "Sales delivery note details route."),
  defineRoute("sales.shipments", "/sales/shipments", "sales.shipment.read", "Sales shipments workspace route."),
  defineRoute("sales.shipment.details", "/sales/shipments/[shipmentId]", "sales.shipment.read", "Sales shipment details route."),
  defineRoute("sales.payments", "/sales/payments", "sales.payment.read", "Sales payments workspace route."),
  defineRoute("sales.payment.details", "/sales/payments/[paymentId]", "sales.payment.read", "Sales payment details route.")
] satisfies SalesRouteDefinition[]);

function defineRoute(id: SalesRouteDefinition["id"], path: string, permission: string, description: string): SalesRouteDefinition {
  return Object.freeze({
    id,
    path,
    permission,
    description,
    lazy: true
  });
}
