import jsPDF from "jspdf";
import type { BusinessClient, CompanyProfile, DeliveryNote, Invoice, Quote, SalesDocument } from "@/lib/types";
import { DeliveryNotePdfTemplate } from "@/components/pdf-templates/DeliveryNotePdfTemplate";
import { HrReportPdfTemplate, type HrReportPdfData } from "@/components/pdf-templates/HrReportPdfTemplate";
import { InvoicePdfTemplate } from "@/components/pdf-templates/InvoicePdfTemplate";
import type { PdfDocumentTitle, PdfLayoutDocument, PdfLineItem, PdfParty } from "@/components/pdf-templates/PdfLayout";
import { pdfTheme as colors } from "@/components/pdf-templates/PdfLayout";
import {
  CreditNotePdfTemplate,
  ProformaPdfTemplate,
  PurchaseOrderPdfTemplate,
  typedSalesTemplate
} from "@/components/pdf-templates/PurchaseOrderPdfTemplate";
import { QuotePdfTemplate } from "@/components/pdf-templates/QuotePdfTemplate";

type StoredPdfSettings = {
  showLogo?: boolean;
  showStamp?: boolean;
  showSignature?: boolean;
  paymentTerms?: string;
  legalNotice?: string;
  footer?: string;
};

type PdfOutputMode = "save" | "print";

const defaultCompany: Required<Pick<CompanyProfile, "name" | "address" | "city" | "phone" | "ice" | "taxId">> = {
  name: "HICOTECH",
  address: "N7, ILOT 14 - LOTISSEMENT FADALLAH",
  city: "MOHAMMEDIA, Maroc",
  phone: "0661144190",
  ice: "003390979000024",
  taxId: "60164052"
};

const defaultLogoUrl = "/hicotech-logo.png";

const margin = 14;
const pageWidth = 210;
const pageHeight = 297;
const contentWidth = pageWidth - margin * 2;
const footerY = 285;
const tableBottomY = 226;

export async function createSalesPdf(document: SalesDocument, companyProfile?: CompanyProfile, mode: PdfOutputMode = "save") {
  await renderPremiumPdf(typedSalesTemplate(document, normalizeSalesTitle(document.type), companyProfile), mode);
}

export async function createQuotePdf(quote: Quote, client: BusinessClient, companyProfile?: CompanyProfile, mode: PdfOutputMode = "save") {
  await renderPremiumPdf(QuotePdfTemplate(quote, client, companyProfile), mode);
}

export async function createInvoicePdf(invoice: Invoice, client: BusinessClient, companyProfile?: CompanyProfile, mode: PdfOutputMode = "save") {
  await renderPremiumPdf(InvoicePdfTemplate(invoice, client, companyProfile), mode);
}

export async function createDeliveryNotePdf(deliveryNote: DeliveryNote, client: BusinessClient, companyProfile?: CompanyProfile, mode: PdfOutputMode = "save") {
  await renderPremiumPdf(DeliveryNotePdfTemplate(deliveryNote, client, companyProfile), mode);
}

export async function createPurchaseOrderPdf(document: SalesDocument, companyProfile?: CompanyProfile, mode: PdfOutputMode = "save") {
  await renderPremiumPdf(PurchaseOrderPdfTemplate(document, companyProfile), mode);
}

export async function createProformaPdf(document: SalesDocument, companyProfile?: CompanyProfile, mode: PdfOutputMode = "save") {
  await renderPremiumPdf(ProformaPdfTemplate(document, companyProfile), mode);
}

export async function createCreditNotePdf(document: SalesDocument, companyProfile?: CompanyProfile, mode: PdfOutputMode = "save") {
  await renderPremiumPdf(CreditNotePdfTemplate(document, companyProfile), mode);
}

export async function createHrReportPdf(data: HrReportPdfData, companyProfile?: CompanyProfile, mode: PdfOutputMode = "save") {
  await renderPremiumPdf(HrReportPdfTemplate(data, companyProfile), mode);
}

function normalizeSalesTitle(title: SalesDocument["type"]): PdfDocumentTitle {
  if (title === "PROFORMA") return "FACTURE PROFORMA";
  return title;
}

async function renderPremiumPdf(document: PdfLayoutDocument, mode: PdfOutputMode) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const company = resolveCompanyProfile(document.company);
  const pdfSettings = resolvePdfSettings();
  const logo = await loadLogo(company.logoUrl);
  const totals = calculateTotals(document.lines, document.discount ?? 0, document.paidAmount ?? 0);
  const amountInWords = document.amountInWords || `${numberToFrench(Math.round(totals.ttc))} dirhams toutes taxes comprises.`;
  let page = 1;
  let y = drawPageHeader(pdf, document, page, company, logo, pdfSettings);

  y = drawProductsTableHeader(pdf, y);

  document.lines.forEach((line, index) => {
    if (y > tableBottomY) {
      drawFooter(pdf, page, company, pdfSettings);
      pdf.addPage();
      page += 1;
      y = drawPageHeader(pdf, document, page, company, logo, pdfSettings);
      y = drawProductsTableHeader(pdf, y);
    }
    y = drawProductRow(pdf, line, index, y);
  });

  if (y > 176) {
    drawFooter(pdf, page, company, pdfSettings);
    pdf.addPage();
    page += 1;
    y = drawPageHeader(pdf, document, page, company, logo, pdfSettings);
  }

  drawBottomBlocks(pdf, document, totals, amountInWords, y + 8, pdfSettings);
  drawFooter(pdf, page, company, pdfSettings);
  applyTotalPageCount(pdf);
  outputPdf(pdf, `${document.filename || document.number}.pdf`, mode);
}

function drawPageHeader(
  pdf: jsPDF,
  document: PdfLayoutDocument,
  currentPage: number,
  company: ReturnType<typeof resolveCompanyProfile>,
  logo: LoadedLogo | null,
  pdfSettings: StoredPdfSettings
) {
  pdf.setFillColor(...colors.white);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  pdf.setFillColor(...colors.navy);
  pdf.rect(0, 0, pageWidth, 7, "F");

  if (pdfSettings.showLogo !== false) {
    drawLogoPdf(pdf, margin, 14, logo);
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.navy);
  pdf.text(company.name, margin + 54, 19);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.8);
  pdf.setTextColor(...colors.muted);
  pdf.text(company.address, margin + 54, 25);
  pdf.text(company.city, margin + 54, 30);
  pdf.text(`Tél : ${company.phone}`, margin + 54, 35);
  pdf.text(`ICE : ${company.ice}   IF : ${company.taxId}`, margin + 54, 40);

  pdf.setTextColor(...colors.navy);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(document.title.length > 16 ? 19 : 24);
  pdf.text(document.title, pageWidth - margin, 22, { align: "right" });

  const metaX = pageWidth - margin - 66;
  let metaY = 34;
  drawMetaLine(pdf, metaX, metaY, "Numéro", document.number);
  metaY += 6;
  drawMetaLine(pdf, metaX, metaY, "Date", document.date);
  if (document.dueDate) {
    metaY += 6;
    drawMetaLine(pdf, metaX, metaY, "Échéance", document.dueDate);
  }
  if (document.status) {
    metaY += 6;
    drawMetaLine(pdf, metaX, metaY, "Statut", document.status);
  }
  if (document.internalReference) {
    metaY += 6;
    drawMetaLine(pdf, metaX, metaY, "Référence", document.internalReference);
  }

  drawRecipientBlock(pdf, document.recipient);

  pdf.setDrawColor(...colors.border);
  pdf.setLineWidth(0.25);
  pdf.line(margin, 96, pageWidth - margin, 96);

  if (currentPage > 1) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.muted);
    pdf.text(`Suite du document ${document.number}`, margin, 92);
  }

  return 102;
}

function drawLogoPdf(pdf: jsPDF, x: number, y: number, logo: LoadedLogo | null) {
  const boxWidth = 46;
  const boxHeight = 20;
  const padding = 1;

  if (!logo) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(...colors.navy);
    pdf.text("HICOTECH", x, y + 8);
    pdf.setFontSize(5.5);
    pdf.text("INFORMATIQUE SIMPLIFIEE", x, y + 14);
    return;
  }

  const availableWidth = boxWidth - padding * 2;
  const availableHeight = boxHeight - padding * 2;
  const scale = Math.min(availableWidth / logo.width, availableHeight / logo.height);
  const width = logo.width * scale;
  const height = logo.height * scale;
  const imageX = x + padding + (availableWidth - width) / 2;
  const imageY = y + padding + (availableHeight - height) / 2;

  pdf.addImage(logo.dataUrl, "PNG", imageX, imageY, width, height);
}

function drawMetaLine(pdf: jsPDF, x: number, y: number, label: string, value: string) {
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...colors.muted);
  pdf.text(`${label} :`, x, y);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...colors.navy);
  pdf.text(value, pageWidth - margin, y, { align: "right" });
}

function drawRecipientBlock(pdf: jsPDF, recipient: PdfParty) {
  const x = 116;
  const y = 58;
  pdf.setFillColor(...colors.lightBlue);
  pdf.roundedRect(x, y, 80, 30, 2, 2, "F");
  pdf.setDrawColor(...colors.border);
  pdf.roundedRect(x, y, 80, 30, 2, 2);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...colors.blue);
  pdf.text(recipient.label, x + 4, y + 7);
  pdf.setTextColor(...colors.navy);
  pdf.text(recipient.company || recipient.name, x + 4, y + 13, { maxWidth: 72 });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.8);
  pdf.setTextColor(...colors.ink);
  const lines = [
    recipient.name && recipient.name !== recipient.company ? recipient.name : "",
    recipient.address,
    recipient.city,
    recipient.ice ? `ICE : ${recipient.ice}` : "",
    recipient.phone ? `Tél : ${recipient.phone}` : ""
  ].filter((line): line is string => Boolean(line));
  pdf.text(lines.slice(0, 5), x + 4, y + 18);
}

function drawProductsTableHeader(pdf: jsPDF, y: number) {
  pdf.setFillColor(...colors.navy);
  pdf.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...colors.white);
  pdf.text("Désignation", 17, y + 6);
  pdf.text("Référence", 76, y + 6);
  pdf.text("Qté", 105, y + 6, { align: "right" });
  pdf.text("PU HT", 126, y + 6, { align: "right" });
  pdf.text("TVA", 145, y + 6, { align: "right" });
  pdf.text("Total HT", 169, y + 6, { align: "right" });
  pdf.text("Total TTC", 193, y + 6, { align: "right" });
  return y + 10;
}

function drawProductRow(pdf: jsPDF, line: PdfLineItem, index: number, y: number) {
  const ht = line.quantity * line.unitPrice;
  const vat = ht * (line.vat / 100);
  const ttc = ht + vat;
  const designationLines = pdf.splitTextToSize(line.designation, 55).slice(0, 2);
  const rowHeight = designationLines.length > 1 ? 12 : 9;

  if (index % 2 === 0) {
    pdf.setFillColor(...colors.zebra);
    pdf.rect(margin, y - 1, contentWidth, rowHeight, "F");
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.8);
  pdf.setTextColor(...colors.ink);
  pdf.text(designationLines, 17, y + 5);
  pdf.setTextColor(...colors.muted);
  pdf.text((line.reference || "-").slice(0, 16), 76, y + 5);
  pdf.setTextColor(...colors.ink);
  pdf.text(formatQty(line.quantity), 105, y + 5, { align: "right" });
  pdf.text(formatMoney(line.unitPrice), 126, y + 5, { align: "right" });
  pdf.text(`${formatQty(line.vat)}%`, 145, y + 5, { align: "right" });
  pdf.text(formatMoney(ht), 169, y + 5, { align: "right" });
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...colors.navy);
  pdf.text(formatMoney(ttc), 193, y + 5, { align: "right" });

  pdf.setDrawColor(...colors.border);
  pdf.setLineWidth(0.15);
  pdf.line(margin, y + rowHeight - 1, pageWidth - margin, y + rowHeight - 1);
  return y + rowHeight;
}

function drawBottomBlocks(
  pdf: jsPDF,
  document: PdfLayoutDocument,
  totals: ReturnType<typeof calculateTotals>,
  amountInWords: string,
  startY: number,
  pdfSettings: StoredPdfSettings
) {
  const y = Math.max(startY, 152);
  const leftW = 104;
  const totalsX = 126;
  const totalsW = 70;

  pdf.setFillColor(...colors.lightBlue);
  pdf.roundedRect(margin, y, leftW, 36, 2, 2, "F");
  pdf.setDrawColor(...colors.border);
  pdf.roundedRect(margin, y, leftW, 36, 2, 2);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...colors.navy);
  pdf.text("Montant en lettres", margin + 4, y + 7);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.8);
  pdf.setTextColor(...colors.ink);
  pdf.text(amountInWords, margin + 4, y + 14, { maxWidth: leftW - 8 });

  if (document.deliverySummary) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Résumé livraison", margin + 4, y + 25);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Articles : ${document.deliverySummary.totalItems}   Quantité livrée : ${document.deliverySummary.totalDelivered}`, margin + 4, y + 31);
  }

  drawTotalsBlock(pdf, totalsX, y, totalsW, totals);

  const termsY = y + 45;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...colors.navy);
  pdf.text("Conditions de paiement", margin, termsY);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.8);
  pdf.setTextColor(...colors.ink);
  pdf.text(pdfSettings.paymentTerms || document.paymentTerms || "Paiement selon accord commercial.", margin, termsY + 6, { maxWidth: 112 });

  const notes = [document.notes, pdfSettings.legalNotice].filter(Boolean).join("\n");
  if (notes) {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...colors.navy);
    pdf.text("Notes", margin, termsY + 18);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...colors.ink);
    pdf.text(notes, margin, termsY + 24, { maxWidth: 112 });
  }

  if (pdfSettings.showSignature !== false || pdfSettings.showStamp !== false) {
    drawSignatureBlocks(pdf, Math.max(termsY + 36, 235), pdfSettings);
  }
}

function drawTotalsBlock(pdf: jsPDF, x: number, y: number, width: number, totals: ReturnType<typeof calculateTotals>) {
  pdf.setFillColor(...colors.white);
  pdf.setDrawColor(...colors.border);
  pdf.roundedRect(x, y, width, 56, 2, 2, "FD");

  const rows = [
    ["Total HT", totals.ht],
    ["Total TVA", totals.vat],
    ["Remise", totals.discount],
    ["Montant payé", totals.paid],
    ["Reste à payer", totals.outstanding]
  ] as const;

  pdf.setFontSize(8);
  rows.forEach((row, index) => {
    const rowY = y + 7 + index * 8;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...colors.muted);
    pdf.text(row[0], x + 4, rowY);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...colors.navy);
    pdf.text(formatMoney(row[1]), x + width - 4, rowY, { align: "right" });
  });

  pdf.setFillColor(...colors.blue);
  pdf.roundedRect(x + 3, y + 43, width - 6, 10, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...colors.white);
  pdf.text("Total TTC", x + 7, y + 50);
  pdf.text(formatMoney(totals.ttc), x + width - 7, y + 50, { align: "right" });
}

function drawSignatureBlocks(pdf: jsPDF, y: number, pdfSettings: StoredPdfSettings) {
  const blockY = Math.min(y, 249);
  pdf.setDrawColor(...colors.border);
  pdf.setLineWidth(0.3);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...colors.navy);
  if (pdfSettings.showSignature !== false) {
    pdf.roundedRect(margin, blockY, 62, 22, 2, 2);
    pdf.text("Signature client", margin + 31, blockY + 13, { align: "center" });
  }
  if (pdfSettings.showStamp !== false) {
    pdf.roundedRect(pageWidth - margin - 62, blockY, 62, 22, 2, 2);
    pdf.text("Cachet et signature", pageWidth - margin - 31, blockY + 13, { align: "center" });
  }
}

function drawFooter(pdf: jsPDF, page: number, company: ReturnType<typeof resolveCompanyProfile>, pdfSettings: StoredPdfSettings) {
  pdf.setDrawColor(...colors.border);
  pdf.setLineWidth(0.25);
  pdf.line(margin, 279, pageWidth - margin, 279);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...colors.navy);
  pdf.text("HICOTECH ERP", margin, footerY);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...colors.muted);
  const footer = pdfSettings.footer || `www.hicotech.ma  |  Téléphone : ${company.phone}  |  ICE : ${company.ice}  |  IF : ${company.taxId}`;
  pdf.text(footer, margin + 24, footerY);
  pdf.text(`Page ${page} sur ${total_pages_count_string}`, pageWidth - margin, footerY, { align: "right" });
}

function resolveCompanyProfile(profile?: CompanyProfile) {
  const storedCompany = readStoredObject<CompanyProfile>("hicotech-settings-company");
  const resolvedProfile = { ...profile, ...storedCompany };
  return {
    name: resolvedProfile?.name?.trim() || defaultCompany.name,
    address: resolvedProfile?.address?.trim() || defaultCompany.address,
    city: resolvedProfile?.city?.trim() || defaultCompany.city,
    phone: resolvedProfile?.phone?.trim() || defaultCompany.phone,
    ice: resolvedProfile?.ice?.trim() || defaultCompany.ice,
    taxId: resolvedProfile?.taxId?.trim() || defaultCompany.taxId,
    rc: resolvedProfile?.rc?.trim() || "",
    logoUrl: resolvedProfile?.logoUrl?.trim() || defaultLogoUrl
  };
}

function resolvePdfSettings(): StoredPdfSettings {
  return readStoredObject<StoredPdfSettings>("hicotech-settings-pdf") ?? {};
}

function readStoredObject<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

type LoadedLogo = {
  dataUrl: string;
  width: number;
  height: number;
};

const logoCache = new Map<string, Promise<LoadedLogo | null>>();

function loadLogo(logoUrl: string): Promise<LoadedLogo | null> {
  if (!logoCache.has(logoUrl)) {
    logoCache.set(logoUrl, loadLogoUncached(logoUrl));
  }
  return logoCache.get(logoUrl)!;
}

async function loadLogoUncached(logoUrl: string): Promise<LoadedLogo | null> {
  if (typeof window === "undefined") return null;

  try {
    const dataUrl = await imageUrlToDataUrl(logoUrl);
    const dimensions = await getImageDimensions(dataUrl);
    return { dataUrl, ...dimensions };
  } catch {
    if (logoUrl !== defaultLogoUrl) {
      return loadLogo(defaultLogoUrl);
    }
    return null;
  }
}

async function imageUrlToDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Logo introuvable");
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getImageDimensions(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function applyTotalPageCount(pdf: jsPDF) {
  if (typeof pdf.putTotalPages === "function") {
    pdf.putTotalPages(total_pages_count_string);
  }
}

function outputPdf(pdf: jsPDF, fileName: string, mode: PdfOutputMode) {
  if (mode === "print") {
    pdf.autoPrint();
    const url = pdf.output("bloburl");
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  pdf.save(fileName);
}

function calculateTotals(lines: PdfLineItem[], discount: number, paid: number) {
  const ht = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const vat = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (line.vat / 100), 0);
  const ttcBeforeDiscount = ht + vat;
  const ttc = Math.max(0, ttcBeforeDiscount - discount);
  const outstanding = Math.max(0, ttc - paid);
  return { ht, vat, discount, paid, outstanding, ttc };
}

function formatMoney(value: number) {
  return `${value.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;
}

function formatQty(value: number) {
  return Number.isInteger(value) ? String(value) : value.toLocaleString("fr-MA", { maximumFractionDigits: 2 });
}

function numberToFrench(value: number): string {
  if (value === 0) return "zéro";
  if (value < 0) return `moins ${numberToFrench(Math.abs(value))}`;

  const units = [
    "",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize"
  ];

  function belowHundred(n: number): string {
    if (n < 17) return units[n];
    if (n < 20) return `dix-${units[n - 10]}`;
    if (n < 70) {
      const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];
      const ten = Math.floor(n / 10);
      const rest = n % 10;
      if (rest === 0) return tens[ten];
      if (rest === 1) return `${tens[ten]} et un`;
      return `${tens[ten]}-${units[rest]}`;
    }
    if (n < 80) return `soixante-${belowHundred(n - 60)}`;
    if (n === 80) return "quatre-vingts";
    return `quatre-vingt-${belowHundred(n - 80)}`;
  }

  function belowThousand(n: number): string {
    if (n < 100) return belowHundred(n);
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const hundredText = hundreds === 1 ? "cent" : `${units[hundreds]} cent`;
    if (rest === 0) return hundreds > 1 ? `${hundredText}s` : hundredText;
    return `${hundredText} ${belowHundred(rest)}`;
  }

  const parts: string[] = [];
  const millions = Math.floor(value / 1_000_000);
  const thousands = Math.floor((value % 1_000_000) / 1_000);
  const rest = value % 1_000;

  if (millions) parts.push(`${belowThousand(millions)} million${millions > 1 ? "s" : ""}`);
  if (thousands) parts.push(thousands === 1 ? "mille" : `${belowThousand(thousands)} mille`);
  if (rest) parts.push(belowThousand(rest));

  return parts.join(" ");
}

const total_pages_count_string = "{total_pages_count_string}";
