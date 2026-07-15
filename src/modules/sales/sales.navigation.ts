import type { SalesNavigationItem } from "./sales.types";

export const salesNavigation = Object.freeze({
  id: "sales",
  label: "Ventes",
  route: "/sales",
  permission: "sales.read",
  metadata: {
    module: "sales",
    placement: "business-suite"
  },
  children: Object.freeze([
    {
      id: "sales.quotes",
      label: "Devis",
      route: "/sales/quotes",
      permission: "sales.quote.read",
      metadata: { icon: "FileText", permissionModule: "quotes", activePath: "/sales/quotes" }
    },
    {
      id: "sales.invoices",
      label: "Factures",
      route: "/sales/invoices",
      permission: "sales.invoice.read",
      metadata: { icon: "Receipt", permissionModule: "invoices", activePath: "/sales/invoices" }
    },
    {
      id: "sales.orders",
      label: "Commandes clients",
      route: "/sales/orders",
      permission: "sales.order.read",
      metadata: { icon: "ClipboardCheck", permissionModule: "orders", activePath: "/sales/orders" }
    },
    {
      id: "sales.payments",
      label: "Paiements",
      route: "/sales/payments",
      permission: "sales.payment.read",
      metadata: { icon: "WalletCards", permissionModule: "payments", activePath: "/sales/payments" }
    }
  ] satisfies SalesNavigationItem[])
} satisfies SalesNavigationItem);
