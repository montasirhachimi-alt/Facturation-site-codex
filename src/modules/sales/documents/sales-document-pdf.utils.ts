import type { PdfLayoutDocument, PdfLineItem, PdfParty } from "@/components/pdf-templates/PdfLayout";
import { createPdfLayoutDocument } from "@/lib/pdf";
import { activeCompanyProfile } from "@/lib/demo-data";
import type { Company } from "@/modules/crm/companies";
import type { Contact } from "@/modules/crm/contacts";
import type { Invoice } from "@/modules/sales/invoices/invoice.types";
import { getInvoiceTotals } from "@/modules/sales/invoices/invoice.utils";
import type { Quote, QuoteItem } from "@/modules/sales/quotes/quote.types";
import { getQuoteTotals } from "@/modules/sales/quotes/quote.utils";
import type { SalesDocumentPdfMode } from "./sales-document-pdf.types";

type SalesPdfContext = Readonly<{
  company?: Company;
  contact?: Contact;
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
    internalReference: quote.opportunityId,
    recipient: buildRecipient(quote.customerName, context),
    lines: buildPdfLines(quote.items),
    discount: calculatePdfDiscountAdjustment(quote.items, totals.total),
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
    recipient: buildRecipient(invoice.customerName, context),
    lines: buildPdfLines(invoice.items),
    discount: calculatePdfDiscountAdjustment(invoice.items, totals.total),
    paidAmount: roundMoney(invoice.paidAmount),
    notes: invoice.notes,
    paymentTerms: "Règlement selon les conditions commerciales convenues.",
    filename: sanitizeFileName(`Facture-${invoice.number}`),
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

export function formatPdfMoney(amount: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0
  }).format(amount);
}

function buildRecipient(customerName: string, context: SalesPdfContext): PdfParty {
  const company = context.company;
  const contact = context.contact;

  return {
    label: "Client",
    name: contact?.fullName ?? customerName,
    company: company?.displayName ?? company?.legalName,
    address: company?.address,
    city: [company?.city, company?.country].filter(Boolean).join(", ") || undefined,
    ice: company?.taxNumber,
    phone: contact?.mobilePhone ?? contact?.officePhone ?? company?.phone,
    email: contact?.email ?? company?.email
  };
}

function buildPdfLines(items: readonly QuoteItem[]): PdfLineItem[] {
  return items.map((item, index) => ({
    reference: item.id || `L${index + 1}`,
    designation: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    vat: item.taxRate
  }));
}

function calculatePdfDiscountAdjustment(items: readonly QuoteItem[], salesTotal: number) {
  const subtotal = items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const rawTax = items.reduce((total, item) => total + item.quantity * item.unitPrice * (item.taxRate / 100), 0);
  return roundMoney(Math.max(0, subtotal + rawTax - salesTotal));
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
