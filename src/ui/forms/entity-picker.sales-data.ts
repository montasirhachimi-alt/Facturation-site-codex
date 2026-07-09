import { FileText, PackageCheck, Receipt } from "lucide-react";
import type { EntityPickerItem } from "./entity-picker.types";
import { quoteSeed } from "@/modules/sales/quotes/quotes.seed";
import { formatQuoteMoney, getQuoteTotals } from "@/modules/sales/quotes/quote.utils";
import { invoiceSeed } from "@/modules/sales/invoices/invoices.seed";
import { getInvoiceTotals } from "@/modules/sales/invoices/invoice.utils";

export function getQuotePickerItems(): readonly EntityPickerItem[] {
  return quoteSeed.map((quote) => {
    const totals = getQuoteTotals(quote);

    return {
      id: quote.id,
      title: quote.number,
      type: "quote",
      typeLabel: "Quote",
      metadata: `${quote.customerName} · ${formatQuoteMoney(totals.total, totals.currency)} · ${quote.status}`,
      icon: FileText,
      keywords: [quote.number, quote.customerName, quote.status, quote.notes, quote.companyId, quote.contactId, quote.opportunityId].filter(Boolean) as string[]
    };
  });
}

export function getInvoicePickerItems(): readonly EntityPickerItem[] {
  return invoiceSeed.map((invoice) => {
    const totals = getInvoiceTotals(invoice);

    return {
      id: invoice.id,
      title: invoice.number,
      type: "invoice",
      typeLabel: "Invoice",
      metadata: `${invoice.customerName} · ${formatQuoteMoney(totals.total, totals.currency)} · ${invoice.status}`,
      icon: Receipt,
      keywords: [invoice.number, invoice.customerName, invoice.status, invoice.notes, invoice.quoteId, invoice.companyId, invoice.contactId].filter(Boolean) as string[]
    };
  });
}

export function getProductPickerItems(): readonly EntityPickerItem[] {
  return [
    {
      id: "products-unavailable",
      title: "Produits non disponibles",
      type: "product",
      typeLabel: "Product",
      metadata: "Aucune source locale réutilisable n'est exposée pour le moment.",
      icon: PackageCheck,
      disabled: true,
      keywords: ["product", "produit", "stock", "catalogue"]
    }
  ];
}
