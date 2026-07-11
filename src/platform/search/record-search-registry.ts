import {
  BriefcaseBusiness,
  Building2,
  ContactRound,
  Receipt,
  UserRound,
  Users,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import { crmCompanyLocalService } from "@/modules/crm/companies/ui/company-local-store";
import { CRM_CONTACTS_WORKSPACE_ID } from "@/modules/crm/contacts/ui/contacts.seed";
import { crmContactLocalService } from "@/modules/crm/contacts/ui/contact-local-store";
import { CRM_CUSTOMERS_WORKSPACE_ID } from "@/modules/crm/customers/ui/customers.seed";
import { crmCustomerLocalService } from "@/modules/crm/customers/ui/customer-local-store";
import { crmOpportunitySeed } from "@/modules/crm/opportunities/ui/opportunities.seed";
import { SALES_QUOTES_WORKSPACE_ID } from "@/modules/sales/quotes/quotes.seed";
import { quoteService } from "@/modules/sales/quotes/quote.store";
import { QUOTE_STATUS_LABELS } from "@/modules/sales/quotes/quote.constants";
import { formatQuoteMoney, getQuoteTotals } from "@/modules/sales/quotes/quote.utils";
import { invoiceService } from "@/modules/sales/invoices/invoice.store";
import { INVOICE_STATUS_LABELS } from "@/modules/sales/invoices/invoice.constants";
import { getInvoiceTotals } from "@/modules/sales/invoices/invoice.utils";
import { paymentSeed } from "@/modules/sales/payments/payments.seed";
import { PAYMENT_STATUS_LABELS } from "@/modules/sales/payments/payment.constants";
import { OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STATUS_LABELS } from "@/modules/crm/opportunities/opportunity.constants";
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

export function createRecordSearchRegistry() {
  return new RecordSearchRegistry()
    .registerMany(buildCompanyRecords())
    .registerMany(buildContactRecords())
    .registerMany(buildCustomerRecords())
    .registerMany(buildQuoteRecords())
    .registerMany(buildInvoiceRecords())
    .registerMany(buildPaymentRecords())
    .registerMany(buildOpportunityRecords());
}

export function getRecordSearchSection(query: string): UniversalSearchSection {
  const items = createRecordSearchRegistry().search(query).map(recordToSearchItem);

  return {
    id: "records",
    title: "Records",
    description: query ? "Résultats métier issus des données locales." : "Sociétés, contacts, clients, devis, factures, paiements et opportunités.",
    emptyTitle: "Aucun record trouvé",
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

function buildCustomerRecords(): readonly RecordSearchResult[] {
  return crmCustomerLocalService.listCustomers({ workspaceId: CRM_CUSTOMERS_WORKSPACE_ID, includeArchived: false }).customers.map((customer) => ({
    id: `record.customer.${customer.id}`,
    title: customer.displayName,
    type: "Client",
    description: `${customer.companyName ?? "Sans société"} · ${formatCompanyStatus(customer.status)}`,
    href: "/clients",
    icon: Users,
    keywords: [
      customer.displayName,
      customer.companyName,
      customer.email,
      customer.phone,
      customer.status,
      customer.type,
      customer.source,
      ...(customer.tags ?? [])
    ].filter(Boolean) as string[]
  }));
}

function buildQuoteRecords(): readonly RecordSearchResult[] {
  return quoteService.listQuotes({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).quotes.map((quote) => {
    const totals = getQuoteTotals(quote);

    return {
      id: `record.quote.${quote.id}`,
      title: quote.number,
      type: "Devis",
      description: `${quote.customerName} · ${formatQuoteMoney(totals.total, totals.currency)} · ${QUOTE_STATUS_LABELS[quote.status]}`,
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
      description: `${invoice.customerName} · ${formatQuoteMoney(totals.total, totals.currency)} · ${INVOICE_STATUS_LABELS[invoice.status]}`,
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
  return paymentSeed.map((payment) => ({
    id: `record.payment.${payment.id}`,
    title: payment.number,
    type: "Paiement",
    description: `${payment.customerName} · ${formatQuoteMoney(payment.amount, payment.currency)} · ${PAYMENT_STATUS_LABELS[payment.status]}`,
    href: `/sales/payments/${payment.id}`,
    icon: WalletCards,
    keywords: [payment.number, payment.invoiceNumber, payment.customerName, payment.status, payment.method, payment.reference, payment.companyId].filter(Boolean) as string[]
  }));
}

function buildOpportunityRecords(): readonly RecordSearchResult[] {
  const companyById = getCompanyMap();
  return crmOpportunitySeed.map((opportunity) => {
    const company = companyById.get(opportunity.companyId);

    return {
      id: `record.opportunity.${opportunity.id}`,
      title: opportunity.title,
      type: "Opportunité",
      description: `${company?.displayName ?? "Société inconnue"} · ${formatQuoteMoney(opportunity.estimatedValue.amount, opportunity.estimatedValue.currency)} · ${OPPORTUNITY_STAGE_LABELS[opportunity.stage]} · ${OPPORTUNITY_STATUS_LABELS[opportunity.status]}`,
      href: "/crm/opportunities",
      icon: UserRound,
      keywords: [
        opportunity.title,
        opportunity.description,
        opportunity.stage,
        opportunity.status,
        opportunity.priority,
        company?.displayName,
        ...(opportunity.tags ?? [])
      ].filter(Boolean) as string[]
    };
  });
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
  if (normalizedType.includes("client")) return "customer";
  if (normalizedType.includes("devis")) return "quote";
  if (normalizedType.includes("facture")) return "invoice";
  if (normalizedType.includes("paiement")) return "payment";
  if (normalizedType.includes("opportun")) return "opportunity";
  return "default";
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
