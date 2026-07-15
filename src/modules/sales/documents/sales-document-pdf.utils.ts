import type { PdfLayoutDocument, PdfLineItem, PdfParty } from "@/components/pdf-templates/PdfLayout";
import { createPdfLayoutDocument } from "@/lib/pdf";
import { activeCompanyProfile } from "@/lib/demo-data";
import type { Company } from "@/modules/crm/companies";
import type { Contact } from "@/modules/crm/contacts";
import type { Invoice } from "@/modules/sales/invoices/invoice.types";
import { getInvoiceTotals } from "@/modules/sales/invoices/invoice.utils";
import type { SalesOrder } from "@/modules/sales/orders";
import { calculateSalesOrderTotals } from "@/modules/sales/orders";
import type { Quote, QuoteItem } from "@/modules/sales/quotes/quote.types";
import { getQuoteTotals } from "@/modules/sales/quotes/quote.utils";
import type { SalesDocumentPdfMode } from "./sales-document-pdf.types";

type SalesPdfContext = Readonly<{
  company?: Company;
  companyName?: string;
  contact?: Contact;
  contactName?: string;
  sourceQuoteNumber?: string;
}>;

export function buildQuotePdfDocument(quote: Quote, context: SalesPdfContext = {}): PdfLayoutDocument {
  const totals = getQuoteTotals(quote);

  return {
    title: "DEVIS",
    number: quote.number,
    date: formatPdfDate(quote.issueDate),
    dueDate: formatPdfDate(quote.expirationDate),
    status: normalizeStatus(quote.status),
    internalReference: quote.opportunityName ?? quote.opportunityId,
    currency: quote.currency,
    recipient: buildRecipient(quote.customerName, context),
    lines: buildPdfLines(quote.items),
    discount: totals.discount,
    totals: {
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total
    },
    notes: quote.notes,
    paymentTerms: "Validité du devis selon la date d'expiration indiquée.",
    filename: sanitizeFileName(`Devis-${quote.number}`),
    company: activeCompanyProfile
  };
}

export function buildInvoicePdfDocument(invoice: Invoice, context: SalesPdfContext = {}): PdfLayoutDocument {
  const totals = getInvoiceTotals(invoice);

  return {
    title: "FACTURE",
    number: invoice.number,
    date: formatPdfDate(invoice.issueDate),
    dueDate: formatPdfDate(invoice.dueDate),
    status: normalizeStatus(invoice.status),
    internalReference: context.sourceQuoteNumber ?? invoice.quoteId,
    currency: invoice.currency,
    recipient: buildRecipient(invoice.customerName, context),
    lines: buildPdfLines(invoice.items),
    discount: totals.discount,
    paidAmount: roundMoney(invoice.paidAmount),
    totals: {
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      paid: roundMoney(invoice.paidAmount),
      remaining: roundMoney(Math.max(0, totals.total - invoice.paidAmount))
    },
    notes: invoice.notes,
    paymentTerms: "Règlement selon les conditions commerciales convenues.",
    filename: sanitizeFileName(`Facture-${invoice.number}`),
    company: activeCompanyProfile
  };
}

export function buildSalesOrderPdfDocument(order: SalesOrder): PdfLayoutDocument {
  const totals = calculateSalesOrderTotals(order);
  return {
    title: "BON DE COMMANDE",
    number: order.number,
    date: formatPdfDate(order.orderDate),
    dueDate: order.expectedDeliveryDate ? formatPdfDate(order.expectedDeliveryDate) : undefined,
    status: normalizeStatus(order.status),
    internalReference: order.sourceQuoteNumber ?? order.internalReference,
    currency: order.currency,
    recipient: buildRecipient(order.companyName, { companyName: order.companyName, contactName: order.contactName }),
    lines: order.lines.map((line) => ({
      reference: line.productSku ?? line.productId ?? line.id,
      designation: line.description,
      quantity: line.quantityOrdered,
      unitPrice: line.unitPrice,
      vat: line.taxRate
    })),
    discount: totals.discount,
    totals: {
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total
    },
    notes: order.notes,
    paymentTerms: "Commande client confirmée selon les conditions commerciales convenues.",
    filename: sanitizeFileName(`Commande-client-${order.number}`),
    company: activeCompanyProfile
  };
}

export async function downloadSalesDocumentPdf(document: PdfLayoutDocument) {
  await createPdfLayoutDocument(document, "save");
}

export async function printSalesDocumentPdf(document: PdfLayoutDocument) {
  await createPdfLayoutDocument(document, "print");
}

export async function exportSalesDocumentPdf(document: PdfLayoutDocument, mode: SalesDocumentPdfMode) {
  await createPdfLayoutDocument(document, mode);
}

export function calculatePdfPreviewTotals(document: PdfLayoutDocument) {
  if (document.totals) {
    const paid = document.totals.paid ?? document.paidAmount ?? 0;
    const remaining = document.totals.remaining ?? Math.max(0, document.totals.total - paid);
    return {
      subtotal: roundMoney(document.totals.subtotal),
      discount: roundMoney(document.totals.discount),
      tax: roundMoney(document.totals.tax),
      total: roundMoney(document.totals.total),
      paid: roundMoney(paid),
      remaining: roundMoney(remaining)
    };
  }

  const subtotal = document.lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0);
  const discount = document.discount ?? 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = document.lines.reduce((total, line) => total + line.quantity * line.unitPrice * (line.vat / 100), 0);
  const total = taxable + tax;
  const paid = document.paidAmount ?? 0;

  return {
    subtotal: roundMoney(subtotal),
    discount: roundMoney(discount),
    tax: roundMoney(tax),
    total: roundMoney(total),
    paid: roundMoney(paid),
    remaining: roundMoney(Math.max(0, total - paid))
  };
}

export function formatPdfMoney(amount: number, currency = "MAD") {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function buildRecipient(customerName: string, context: SalesPdfContext): PdfParty {
  const company = context.company;
  const contact = context.contact;
  const companyName = company?.displayName ?? company?.legalName ?? context.companyName ?? customerName;
  const attentionName = contact?.fullName ?? context.contactName;
  const name = attentionName ? `À l'attention : ${attentionName}` : companyName;
  const city = [company?.city, company?.country].filter(Boolean).join(", ") || undefined;

  return {
    label: "Société",
    name,
    company: isSamePdfText(companyName, name) ? undefined : companyName,
    address: company?.address,
    city: isSamePdfText(city, company?.address) ? undefined : city,
    ice: company?.taxNumber,
    phone: contact?.mobilePhone ?? contact?.officePhone ?? company?.phone,
    email: contact?.email ?? company?.email
  };
}

function isSamePdfText(left: string | undefined, right: string | undefined) {
  return Boolean(left && right && normalizePdfText(left) === normalizePdfText(right));
}

function normalizePdfText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildPdfLines(items: readonly QuoteItem[]): PdfLineItem[] {
  return items.map((item, index) => ({
    reference: item.productSku ?? item.id ?? `L${index + 1}`,
    designation: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    vat: item.taxRate
  }));
}

function formatPdfDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function normalizeStatus(status: string) {
  return status.replace(/_/g, " ").toUpperCase();
}

function sanitizeFileName(value: string) {
  return value.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
