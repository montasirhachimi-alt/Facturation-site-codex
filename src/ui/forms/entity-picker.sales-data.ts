import { FileText, PackageCheck, Receipt } from "lucide-react";
import type { EntityPickerItem } from "./entity-picker.types";
import { SALES_QUOTES_WORKSPACE_ID } from "@/modules/sales/quotes/quotes.seed";
import { quoteService } from "@/modules/sales/quotes/quote.store";
import { formatQuoteMoney, getQuoteTotals } from "@/modules/sales/quotes/quote.utils";
import { invoiceService } from "@/modules/sales/invoices/invoice.store";
import { getInvoiceTotals } from "@/modules/sales/invoices/invoice.utils";
import { products as fallbackProducts } from "@/lib/demo-data";
import { readProductsFromStorage } from "@/lib/product-tools";

export function getQuotePickerItems(): readonly EntityPickerItem[] {
  return quoteService.listQuotes({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).quotes.map((quote) => {
    const totals = getQuoteTotals(quote);

    return {
      id: quote.id,
      title: quote.number,
      type: "quote",
      typeLabel: "Quote",
      metadata: `${quote.companyName ?? quote.customerName} · ${formatQuoteMoney(totals.total, totals.currency)} · ${quote.status}`,
      icon: FileText,
      keywords: [quote.number, quote.customerName, quote.status, quote.notes, quote.companyId, quote.companyName, quote.contactId, quote.contactName, quote.opportunityId, quote.opportunityName].filter(Boolean) as string[]
    };
  });
}

export function getInvoicePickerItems(): readonly EntityPickerItem[] {
  return invoiceService.listInvoices({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).invoices.map((invoice) => {
    const totals = getInvoiceTotals(invoice);

    return {
      id: invoice.id,
      title: invoice.number,
      type: "invoice",
      typeLabel: "Invoice",
      metadata: `${invoice.companyName ?? invoice.customerName} · ${formatQuoteMoney(totals.total, totals.currency)} · ${invoice.status}`,
      icon: Receipt,
      keywords: [invoice.number, invoice.customerName, invoice.status, invoice.notes, invoice.quoteId, invoice.companyId, invoice.companyName, invoice.contactId, invoice.contactName, invoice.opportunityId, invoice.opportunityName].filter(Boolean) as string[]
    };
  });
}

export function getProductPickerItems(): readonly EntityPickerItem[] {
  return readProductsFromStorage(fallbackProducts).map((product) => ({
    id: product.id,
    title: product.designation,
    type: "product",
    typeLabel: "Produit",
    metadata: `${product.reference} · ${product.category} · ${formatQuoteMoney(product.salePrice, "MAD")} HT · TVA ${product.vat}%`,
    icon: PackageCheck,
    keywords: [product.reference, product.designation, product.description, product.category, product.unit].filter(Boolean)
  }));
}
