import { InvoiceService } from "./invoice.service";
import { invoiceSeed } from "./invoices.seed";

export const invoiceStoreEventName = "hicopilot-invoices-updated";
export const invoiceService = new InvoiceService({ seed: invoiceSeed });

export function notifyInvoiceStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(invoiceStoreEventName));
}

export function subscribeToInvoiceStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(invoiceStoreEventName, listener);
  return () => window.removeEventListener(invoiceStoreEventName, listener);
}
