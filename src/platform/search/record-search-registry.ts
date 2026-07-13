import {
  BriefcaseBusiness,
  Building2,
  ContactRound,
  CalendarCheck,
  Boxes,
  PackageCheck,
  Receipt,
  ScrollText,
  WalletCards,
  HandCoins
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import { crmCompanyLocalService } from "@/modules/crm/companies/ui/company-local-store";
import { CRM_CONTACTS_WORKSPACE_ID } from "@/modules/crm/contacts/ui/contacts.seed";
import { crmContactLocalService } from "@/modules/crm/contacts/ui/contact-local-store";
import { CRM_MEETINGS_WORKSPACE_ID } from "@/modules/crm/meetings/ui/meetings.seed";
import { crmMeetingLocalService } from "@/modules/crm/meetings/ui/meeting-local-store";
import { CRM_TASKS_WORKSPACE_ID } from "@/modules/crm/tasks/ui/tasks.seed";
import { crmTaskLocalService } from "@/modules/crm/tasks/ui/task-local-store";
import { SALES_QUOTES_WORKSPACE_ID } from "@/modules/sales/quotes/quotes.seed";
import { quoteService } from "@/modules/sales/quotes/quote.store";
import { QUOTE_STATUS_LABELS } from "@/modules/sales/quotes/quote.constants";
import { formatQuoteMoney, getQuoteTotals } from "@/modules/sales/quotes/quote.utils";
import { invoiceService } from "@/modules/sales/invoices/invoice.store";
import { INVOICE_STATUS_LABELS } from "@/modules/sales/invoices/invoice.constants";
import { getInvoiceTotals } from "@/modules/sales/invoices/invoice.utils";
import { paymentService } from "@/modules/sales/payments/payment.store";
import { PAYMENT_STATUS_LABELS } from "@/modules/sales/payments/payment.constants";
import { getCurrentAlphaActivation } from "@/platform/modules/module-activation.current";
import { PRODUCTS_WORKSPACE_ID } from "@/modules/products";
import { productLocalService } from "@/modules/products/ui/product-local-store";
import { inventoryLocalService } from "@/modules/inventory/inventory-local-store";
import { GOODS_RECEIPT_STATUS_LABELS, PROCUREMENT_WORKSPACE_ID, procurementLocalService, PURCHASE_ORDER_STATUS_LABELS } from "@/modules/procurement";
import { calculatePurchaseOrderTotals, formatProcurementMoney } from "@/modules/procurement";
import type { ModuleActivationResult } from "@/platform/modules/module-activation.types";
import type { UniversalSearchItem, UniversalSearchSection } from "./universal-search.types";

export type RecordSearchResult = Readonly<{
  id: string;
  title: string;
  type: string;
  description: string;
  href: string;
  icon: LucideIcon;
  keywords: readonly string[];
}>;

export class RecordSearchRegistry {
  private readonly records = new Map<string, RecordSearchResult>();

  register(record: RecordSearchResult) {
    this.records.set(record.id, record);
    return this;
  }

  registerMany(records: readonly RecordSearchResult[]) {
    records.forEach((record) => this.register(record));
    return this;
  }

  search(query: string) {
    const normalizedQuery = normalizeRecordText(query);
    const records = Array.from(this.records.values());

    if (!normalizedQuery) return records.slice(0, 8);

    return records
      .map((record) => ({
        record,
        score: scoreRecord(record, normalizedQuery)
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.record.title.localeCompare(b.record.title, "fr"))
      .map((result) => result.record)
      .slice(0, 12);
  }
}

export function createRecordSearchRegistry(activation: ModuleActivationResult = getCurrentAlphaActivation()) {
  const registry = new RecordSearchRegistry()
    .registerMany(buildCompanyRecords())
    .registerMany(buildContactRecords())
    .registerMany(buildMeetingRecords())
    .registerMany(buildTaskRecords())
    .registerMany(buildQuoteRecords())
    .registerMany(buildInvoiceRecords())
    .registerMany(buildPaymentRecords());

  if (activation.activeModuleIdSet.has("sales.products")) {
    registry.registerMany(buildProductRecords());
  }
  if (activation.activeModuleIdSet.has("inventory.stock")) {
    registry.registerMany(buildWarehouseRecords());
  }
  if (activation.activeModuleIdSet.has("procurement.suppliers")) {
    registry.registerMany(buildSupplierRecords());
  }
  if (activation.activeModuleIdSet.has("procurement.purchase-orders")) {
    registry.registerMany(buildPurchaseOrderRecords());
  }
  if (activation.activeModuleIdSet.has("procurement.goods-receipts")) {
    registry.registerMany(buildGoodsReceiptRecords());
  }

  return registry;
}

function buildGoodsReceiptRecords(): readonly RecordSearchResult[] {
  return procurementLocalService.listGoodsReceipts({ workspaceId: PROCUREMENT_WORKSPACE_ID }).goodsReceipts.map((receipt) => ({
    id: `record.goods-receipt.${receipt.id}`,
    title: receipt.number,
    type: "Réception fournisseur",
    description: `${receipt.supplierName} · ${receipt.purchaseOrderNumber} · ${GOODS_RECEIPT_STATUS_LABELS[receipt.status]}`,
    href: "/procurement/goods-receipts",
    icon: PackageCheck,
    keywords: [receipt.number, receipt.supplierName, receipt.purchaseOrderNumber, receipt.status, receipt.reference, receipt.notes, ...receipt.lines.flatMap((line) => [line.productSku, line.productName, line.description])].filter(Boolean) as string[]
  }));
}

function buildSupplierRecords(): readonly RecordSearchResult[] {
  return procurementLocalService.listSuppliers({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: false }).suppliers.map((supplier) => ({
    id: `record.supplier.${supplier.id}`,
    title: supplier.companyName,
    type: "Fournisseur",
    description: `${supplier.country} · ${supplier.currency} · ${supplier.paymentTerms ?? "Conditions non renseignées"}`,
    href: "/procurement/suppliers",
    icon: Building2,
    keywords: [supplier.companyName, supplier.tradeName, supplier.ice, supplier.taxId, supplier.rc, supplier.phone, supplier.email, supplier.country].filter(Boolean) as string[]
  }));
}

function buildPurchaseOrderRecords(): readonly RecordSearchResult[] {
  return procurementLocalService.listPurchaseOrders({ workspaceId: PROCUREMENT_WORKSPACE_ID }).purchaseOrders.map((order) => {
    const totals = calculatePurchaseOrderTotals(order);
    return {
      id: `record.purchase-order.${order.id}`,
      title: order.number,
      type: "Commande fournisseur",
      description: `${order.supplierName} · ${formatProcurementMoney(totals.total, order.currency)} · ${PURCHASE_ORDER_STATUS_LABELS[order.status]}`,
      href: "/procurement/purchase-orders",
      icon: HandCoins,
      keywords: [order.number, order.supplierName, order.status, order.reference, order.notes, ...order.lines.flatMap((line) => [line.productSku, line.productName, line.description])].filter(Boolean) as string[]
    };
  });
}

export function getRecordSearchSection(query: string, activation: ModuleActivationResult = getCurrentAlphaActivation()): UniversalSearchSection {
  const items = createRecordSearchRegistry(activation).search(query).map(recordToSearchItem);

  return {
    id: "records",
    title: "Données",
    description: query ? "Résultats métier issus des données locales." : "Sociétés, contacts, devis, factures et paiements.",
    emptyTitle: "Aucune donnée trouvée",
    emptyDescription: "Essayez un nom, un code de devis, une facture, un paiement ou une société.",
    items
  };
}

function buildCompanyRecords(): readonly RecordSearchResult[] {
  return crmCompanyLocalService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: false }).companies.map((company) => ({
    id: `record.company.${company.id}`,
    title: company.displayName,
    type: "Société",
    description: `${formatCompanyStatus(company.status)} · ${company.industry} · ${company.city ?? "Ville non renseignée"}`,
    href: `/crm/companies/${company.id}`,
    icon: Building2,
    keywords: [
      company.displayName,
      company.legalName,
      company.email,
      company.phone,
      company.industry,
      company.city,
      company.country,
      company.status,
      ...(company.tags ?? [])
    ].filter(Boolean) as string[]
  }));
}

function buildContactRecords(): readonly RecordSearchResult[] {
  const companyById = getCompanyMap();
  return crmContactLocalService.listContacts({ workspaceId: CRM_CONTACTS_WORKSPACE_ID, includeArchived: false }).contacts.map((contact) => {
    const company = companyById.get(contact.companyId);

    return {
      id: `record.contact.${contact.id}`,
      title: contact.fullName,
      type: "Contact",
      description: `${company?.displayName ?? "Société inconnue"} · ${contact.jobTitle ?? contact.department ?? "Contact CRM"}`,
      href: `/crm/contacts/${contact.id}`,
      icon: ContactRound,
      keywords: [
        contact.fullName,
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.mobilePhone,
        contact.jobTitle,
        contact.department,
        contact.role,
        company?.displayName,
        ...(contact.tags ?? [])
      ].filter(Boolean) as string[]
    };
  });
}

function buildMeetingRecords(): readonly RecordSearchResult[] {
  const companyById = getCompanyMap();
  return crmMeetingLocalService.listMeetings({ workspaceId: CRM_MEETINGS_WORKSPACE_ID, includeCancelled: false }).meetings.map((meeting) => {
    const company = companyById.get(meeting.companyId);
    return {
      id: `record.meeting.${meeting.id}`,
      title: meeting.title,
      type: "Réunion",
      description: `${company?.displayName ?? "Société inconnue"} · ${formatSearchDate(meeting.startAt)} · ${meeting.status}`,
      href: "/crm/meetings",
      icon: CalendarCheck,
      keywords: [meeting.title, meeting.description, meeting.location, meeting.status, meeting.meetingType, company?.displayName, ...meeting.tags].filter(Boolean) as string[]
    };
  });
}

function buildTaskRecords(): readonly RecordSearchResult[] {
  const companyById = getCompanyMap();
  return crmTaskLocalService.listTasks({ workspaceId: CRM_TASKS_WORKSPACE_ID, includeCancelled: false }).tasks.map((task) => {
    const company = companyById.get(task.companyId);
    return {
      id: `record.task.${task.id}`,
      title: task.title,
      type: "Tâche",
      description: `${company?.displayName ?? "Société inconnue"} · ${formatSearchDate(task.dueDate)} · ${task.status}`,
      href: "/crm/tasks",
      icon: ScrollText,
      keywords: [task.title, task.description, task.status, task.priority, task.taskType, company?.displayName, ...task.tags].filter(Boolean) as string[]
    };
  });
}

function buildQuoteRecords(): readonly RecordSearchResult[] {
  return quoteService.listQuotes({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).quotes.map((quote) => {
    const totals = getQuoteTotals(quote);

    return {
      id: `record.quote.${quote.id}`,
      title: quote.number,
      type: "Devis",
      description: `${quote.companyName ?? quote.customerName} · ${formatQuoteMoney(totals.total, totals.currency)} · ${QUOTE_STATUS_LABELS[quote.status]}`,
      href: `/sales/quotes/${quote.id}`,
      icon: BriefcaseBusiness,
      keywords: [
        quote.number,
        quote.customerName,
        quote.status,
        quote.notes,
        quote.companyId,
        quote.companyName,
        quote.contactId,
        quote.contactName,
        quote.opportunityId,
        quote.opportunityName
      ].filter(Boolean) as string[]
    };
  });
}

function buildInvoiceRecords(): readonly RecordSearchResult[] {
  return invoiceService.listInvoices({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).invoices.map((invoice) => {
    const totals = getInvoiceTotals(invoice);

    return {
      id: `record.invoice.${invoice.id}`,
      title: invoice.number,
      type: "Facture",
      description: `${invoice.companyName ?? invoice.customerName} · ${formatQuoteMoney(totals.total, totals.currency)} · ${INVOICE_STATUS_LABELS[invoice.status]}`,
      href: `/sales/invoices/${invoice.id}`,
      icon: Receipt,
      keywords: [
        invoice.number,
        invoice.customerName,
        invoice.status,
        invoice.notes,
        invoice.quoteId,
        invoice.companyId,
        invoice.companyName,
        invoice.contactId,
        invoice.contactName,
        invoice.opportunityId,
        invoice.opportunityName
      ].filter(Boolean) as string[]
    };
  });
}

function buildPaymentRecords(): readonly RecordSearchResult[] {
  const companyById = getCompanyMap();
  return paymentService.listPayments({ workspaceId: SALES_QUOTES_WORKSPACE_ID, includeArchived: false }).payments.map((payment) => {
    const companyName = companyById.get(payment.companyId)?.displayName ?? payment.customerName;

    return {
      id: `record.payment.${payment.id}`,
      title: payment.number,
      type: "Paiement",
      description: `${companyName} · ${formatQuoteMoney(payment.amount, payment.currency)} · ${PAYMENT_STATUS_LABELS[payment.status]}`,
      href: `/sales/payments/${payment.id}`,
      icon: WalletCards,
      keywords: [payment.number, payment.invoiceNumber, companyName, payment.customerName, payment.status, payment.method, payment.reference, payment.companyId].filter(Boolean) as string[]
    };
  });
}

function buildProductRecords(): readonly RecordSearchResult[] {
  return productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, includeArchived: false }).products.map((product) => ({
    id: `record.product.${product.id}`,
    title: product.name,
    type: "Produit",
    description: `${product.sku} · ${product.categoryName ?? "Non classé"} · ${formatProductMoney(product.sellingPrice, product.currency)} HT`,
    href: "/sales/products",
    icon: PackageCheck,
    keywords: [
      product.sku,
      product.barcode,
      product.name,
      product.description,
      product.shortDescription,
      product.brand,
      product.categoryName,
      product.unit,
      product.currency
    ].filter(Boolean) as string[]
  }));
}

function buildWarehouseRecords(): readonly RecordSearchResult[] {
  return inventoryLocalService.getSnapshot().warehouses.map((warehouse) => ({
    id: `record.inventory-warehouse.${warehouse.id}`,
    title: warehouse.name,
    type: "Entrepôt",
    description: `${warehouse.code} · ${warehouse.active ? "Actif" : "Archivé"}${warehouse.isDefault ? " · Par défaut" : ""}`,
    href: "/inventory",
    icon: Boxes,
    keywords: [warehouse.name, warehouse.code, warehouse.description, warehouse.active ? "actif" : "archivé", warehouse.isDefault ? "par défaut" : undefined].filter(Boolean) as string[]
  }));
}

function formatProductMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function getCompanyMap() {
  return new Map(crmCompanyLocalService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: false }).companies.map((company) => [company.id, company]));
}

function recordToSearchItem(record: RecordSearchResult): UniversalSearchItem {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    badge: record.type,
    eyebrow: record.type,
    icon: record.icon,
    iconKey: iconKeyForRecordType(record.type),
    href: record.href,
    keywords: record.keywords
  };
}

function iconKeyForRecordType(type: string) {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes("soci")) return "company";
  if (normalizedType.includes("contact")) return "contact";
  if (normalizedType.includes("réunion") || normalizedType.includes("reunion")) return "calendar";
  if (normalizedType.includes("tâche") || normalizedType.includes("tache")) return "task";
  if (normalizedType.includes("devis")) return "quote";
  if (normalizedType.includes("facture")) return "invoice";
  if (normalizedType.includes("paiement")) return "payment";
  if (normalizedType.includes("entrepôt") || normalizedType.includes("entrepot")) return "warehouse";
  return "default";
}

function formatSearchDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short" }).format(new Date(value));
}

function scoreRecord(record: RecordSearchResult, normalizedQuery: string) {
  const values = [record.title, record.type, record.description, record.href, ...record.keywords].map(normalizeRecordText);
  let bestScore = 0;

  for (const value of values) {
    if (!value) continue;
    if (value === normalizedQuery) bestScore = Math.max(bestScore, 130);
    if (value.startsWith(normalizedQuery)) bestScore = Math.max(bestScore, 100);
    if (value.includes(normalizedQuery)) bestScore = Math.max(bestScore, 70);

    if (value.split(" ").some((word) => word.startsWith(normalizedQuery))) {
      bestScore = Math.max(bestScore, 90);
    }
  }

  return bestScore;
}

function normalizeRecordText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCompanyStatus(status: string) {
  const labels: Record<string, string> = {
    active: "Actif",
    archived: "Archivé",
    inactive: "Inactif",
    lead: "Prospect"
  };

  return labels[status] ?? status;
}
