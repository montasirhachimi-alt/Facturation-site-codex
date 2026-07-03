import type { InvoiceSort, InvoiceStatus } from "./invoice.types";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = Object.freeze({
  draft: "Brouillon",
  issued: "Émise",
  paid: "Payée",
  partially_paid: "Partiellement payée",
  cancelled: "Annulée",
  overdue: "En retard"
});

export const DEFAULT_INVOICE_SORT: InvoiceSort = Object.freeze({
  field: "issueDate",
  direction: "desc"
});
