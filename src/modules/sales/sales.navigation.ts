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
    { id: "sales.quotes", label: "Devis", route: "/sales/quotes", permission: "sales.quote.read" },
    { id: "sales.invoices", label: "Factures", route: "/sales/invoices", permission: "sales.invoice.read" }
  ] satisfies SalesNavigationItem[])
} satisfies SalesNavigationItem);
