"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, CalendarClock, CheckCircle2, ClipboardCheck, Download, Eye, FileText, HandCoins, NotebookPen, Printer, Receipt, Send, XCircle } from "lucide-react";
import { persistCrmSalesRecord, transitionPersistedQuoteStatus } from "@/platform/persistence";
import { useModuleEnabled } from "@/platform/modules/module-activation.context";
import { CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import { crmCompanyLocalService, subscribeToCrmCompanyStore } from "@/modules/crm/companies/ui/company-local-store";
import { CRM_CONTACTS_WORKSPACE_ID } from "@/modules/crm/contacts/ui/contacts.seed";
import { crmContactLocalService, subscribeToCrmContactStore } from "@/modules/crm/contacts/ui/contact-local-store";
import { ContextualActionStrip, createContextualActionRegistry } from "@/platform/contextual-actions";
import { EntityEmptyState, EntityHeader, EntityPageLayout, InfoCard, MetricCard, SectionCard } from "@/ui";
import { SalesDocumentPreviewDialog, buildQuotePdfDocument, downloadSalesDocumentPdf, printSalesDocumentPdf } from "@/modules/sales/documents";
import type { QuoteId, QuoteStatus } from "../quote.types";
import { formatQuoteMoney, getQuoteTotals } from "../quote.utils";
import { quoteService, subscribeToQuoteStore } from "../quote.store";
import { SALES_QUOTES_WORKSPACE_ID } from "../quotes.seed";
import { QuoteStatusBadge } from "./quotes-workspace";
import { invoiceService, notifyInvoiceStoreUpdated } from "@/modules/sales/invoices";
import { SALES_ORDERS_WORKSPACE_ID, salesOrderService, notifySalesOrderStoreUpdated } from "@/modules/sales/orders";
import { QUOTE_STATUS_LABELS } from "../quote.constants";

export function QuoteDetailsWorkspace({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [, setStoreVersion] = useState(0);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [transitioningStatus, setTransitioningStatus] = useState<QuoteStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const salesOrdersEnabled = useModuleEnabled("sales.orders");
  const quote = quoteService.getQuote(quoteId as QuoteId, SALES_QUOTES_WORKSPACE_ID);

  useEffect(() => {
    const refresh = () => setStoreVersion((value) => value + 1);
    const unsubscribeQuotes = subscribeToQuoteStore(refresh);
    const unsubscribeCompanies = subscribeToCrmCompanyStore(refresh);
    const unsubscribeContacts = subscribeToCrmContactStore(refresh);
    return () => {
      unsubscribeQuotes();
      unsubscribeCompanies();
      unsubscribeContacts();
    };
  }, []);

  if (!quote) {
    return (
      <EntityPageLayout>
        <EntityEmptyState icon={FileText} title="Devis introuvable" description="Ce devis n'existe pas dans l'espace de travail actif." />
      </EntityPageLayout>
    );
  }

  const quoteValue = quote;
  const totals = getQuoteTotals(quoteValue);
  const companies = crmCompanyLocalService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: false }).companies;
  const contacts = crmContactLocalService.listContacts({ workspaceId: CRM_CONTACTS_WORKSPACE_ID, includeArchived: false }).contacts;
  const companyById = new Map(companies.map((company) => [company.id, company]));
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]));
  const company = companyById.get(quoteValue.companyId);
  const contact = quoteValue.contactId ? contactById.get(quoteValue.contactId) : undefined;
  const companyLabel = company?.displayName ?? quoteValue.companyName ?? "Non définie";
  const contactLabel = contact?.fullName ?? quoteValue.contactName ?? "Non lié";
  const validityLabel = quoteValue.validityDays ? `${quoteValue.validityDays} jours` : formatDate(quoteValue.expirationDate);
  const linkedInvoice = invoiceService.getInvoiceByQuote(quoteValue.id, quoteValue.workspaceId);
  const linkedSalesOrder = salesOrderService.getOrderByQuote(quoteValue.id, SALES_ORDERS_WORKSPACE_ID);
  const pdfDocument = buildQuotePdfDocument(quoteValue, { company, companyName: quoteValue.companyName, contact, contactName: quoteValue.contactName });
  const contextualActions = createContextualActionRegistry([
    {
      id: "quote.preview-pdf",
      entityType: "quote",
      label: "Aperçu PDF",
      description: "Vérifier la mise en page client avant export.",
      icon: Eye,
      priority: 5,
      tone: "neutral",
      onSelect: () => setPdfPreviewOpen(true)
    },
    {
      id: "quote.download-pdf",
      entityType: "quote",
      label: "Télécharger PDF",
      description: "Exporter ce devis au format PDF.",
      icon: Download,
      priority: 6,
      tone: "neutral",
      onSelect: () => void downloadSalesDocumentPdf(pdfDocument)
    },
    {
      id: "quote.print-pdf",
      entityType: "quote",
      label: "Imprimer",
      description: "Ouvrir l'impression du devis.",
      icon: Printer,
      priority: 7,
      tone: "neutral",
      onSelect: () => void printSalesDocumentPdf(pdfDocument)
    },
    {
      id: "quote.mark-sent",
      entityType: "quote",
      label: transitioningStatus === "sent" ? "Envoi..." : "Marquer comme envoyé",
      description: "Faire passer ce devis de brouillon à envoyé.",
      icon: Send,
      priority: 8,
      tone: "primary",
      onSelect: () => void transitionQuoteLifecycle("sent", "Marquer ce devis comme envoyé ?"),
      available: quoteValue.status === "draft",
      disabled: Boolean(transitioningStatus),
      disabledReason: "Une transition de statut est déjà en cours."
    },
    {
      id: "quote.mark-accepted",
      entityType: "quote",
      label: transitioningStatus === "accepted" ? "Acceptation..." : "Marquer comme accepté",
      description: "Valider ce devis pour permettre la commande client.",
      icon: CheckCircle2,
      priority: 8,
      tone: "success",
      onSelect: () => void transitionQuoteLifecycle("accepted", "Marquer ce devis comme accepté ?"),
      available: quoteValue.status === "sent",
      disabled: Boolean(transitioningStatus),
      disabledReason: "Une transition de statut est déjà en cours."
    },
    {
      id: "quote.mark-refused",
      entityType: "quote",
      label: transitioningStatus === "refused" ? "Refus..." : "Marquer comme refusé",
      description: "Clôturer ce devis comme refusé.",
      icon: XCircle,
      priority: 9,
      tone: "warning",
      onSelect: () => void transitionQuoteLifecycle("refused", "Marquer ce devis comme refusé ?"),
      available: quoteValue.status === "sent",
      disabled: Boolean(transitioningStatus),
      disabledReason: "Une transition de statut est déjà en cours."
    },
    {
      id: linkedSalesOrder ? "quote.open-sales-order" : "quote.convert-sales-order",
      entityType: "quote",
      label: linkedSalesOrder ? "Ouvrir la commande" : "Créer une commande client",
      description: linkedSalesOrder ? "Continuer depuis la commande client générée." : "Transformer ce devis en bon de commande client.",
      icon: ClipboardCheck,
      priority: 9,
      tone: linkedSalesOrder ? "neutral" : "primary",
      href: linkedSalesOrder ? `/sales/orders/${linkedSalesOrder.id}` : undefined,
      onSelect: linkedSalesOrder ? undefined : createSalesOrder,
      available: salesOrdersEnabled && quoteValue.status === "accepted"
    },
    {
      id: linkedInvoice ? "quote.open-invoice" : "quote.convert-invoice",
      entityType: "quote",
      label: linkedInvoice ? "Ouvrir la facture" : "Créer une facture",
      description: linkedInvoice ? "Continuer le suivi depuis la facture générée." : "Transformer ce devis accepté en facture.",
      icon: Receipt,
      priority: 10,
      tone: linkedInvoice ? "neutral" : "primary",
      href: linkedInvoice ? `/sales/invoices/${linkedInvoice.id}` : undefined,
      onSelect: linkedInvoice ? undefined : createInvoice,
      available: quoteValue.status === "accepted"
    },
    {
      id: "quote.open-company",
      entityType: "quote",
      label: "Ouvrir la société",
      description: "Revenir au compte CRM lié à ce devis.",
      icon: Building2,
      priority: 20,
      href: company ? `/crm/companies/${company.id}` : undefined,
      disabled: !company,
      disabledReason: "Aucune société CRM liée à ce devis."
    }
  ]).getAll();

  async function createInvoice() {
    const snapshot = invoiceService.listInvoices({ workspaceId: SALES_QUOTES_WORKSPACE_ID, includeArchived: true }).invoices;
    const invoice = invoiceService.createFromQuote(quoteValue);
    try {
      await persistCrmSalesRecord("invoice", invoice);
    } catch (error) {
      invoiceService.replaceInvoices(snapshot);
      setActionError(getActionErrorMessage(error, "Impossible de créer la facture depuis ce devis."));
      return;
    }
    setActionError(null);
    notifyInvoiceStoreUpdated();
    router.push(`/sales/invoices/${invoice.id}`);
  }

  async function createSalesOrder() {
    const snapshot = salesOrderService.listOrders({ workspaceId: SALES_ORDERS_WORKSPACE_ID, includeArchived: true }).orders;
    const result = salesOrderService.createFromQuote(quoteValue);
    if (!result.order) return;
    try {
      await persistCrmSalesRecord("salesOrder", result.order);
    } catch (error) {
      salesOrderService.replaceOrders(snapshot);
      setActionError(getActionErrorMessage(error, "Impossible de créer la commande client depuis ce devis."));
      return;
    }
    setActionError(null);
    notifySalesOrderStoreUpdated();
    router.push(`/sales/orders/${result.order.id}`);
  }

  async function transitionQuoteLifecycle(nextStatus: QuoteStatus, confirmation: string) {
    if (transitioningStatus) return;
    if (!window.confirm(confirmation)) return;
    setTransitioningStatus(nextStatus);
    setActionError(null);
    try {
      await transitionPersistedQuoteStatus(quoteValue.id, nextStatus);
    } catch (error) {
      setActionError(getActionErrorMessage(error, "Impossible de changer le statut du devis."));
    } finally {
      setTransitioningStatus(null);
    }
  }

  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["Ventes", "Devis", quote.number]}
        title={quote.number}
        description={`Devis commercial pour ${companyLabel}.`}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <InfoCard>{companyLabel}</InfoCard>
            <QuoteStatusBadge status={quote.status} />
            {quote.status === "accepted" && (
              linkedInvoice ? (
                <Link href={`/sales/invoices/${linkedInvoice.id}`} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">
                  Facture créée
                </Link>
              ) : (
                <InfoCard>Prêt à facturer</InfoCard>
              )
            )}
            <Link href="/sales/quotes" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-hicotech-blue dark:border-hicotech-dark-border">
              <ArrowLeft size={14} />
              Retour aux devis
            </Link>
          </div>
        }
      />

      <ContextualActionStrip actions={contextualActions} />
      {actionError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          {actionError}
        </div>
      )}
      <SalesDocumentPreviewDialog document={pdfDocument} open={pdfPreviewOpen} onClose={() => setPdfPreviewOpen(false)} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={HandCoins} label="Total TTC" value={formatQuoteMoney(totals.total, totals.currency)} helper="Montant proposé" />
        <MetricCard icon={Building2} label="Société" value={companyLabel} helper="Compte CRM" />
        <MetricCard icon={CalendarClock} label="Validité" value={validityLabel} helper={`Expire le ${formatDate(quote.expirationDate)}`} />
        <MetricCard icon={FileText} label="Lignes" value={String(quote.items.length)} helper="Articles devis" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-4">
          <SectionCard className="p-4">
            <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Informations commerciales</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <InfoRow label="Société" value={companyLabel} />
              <InfoRow label="À l'attention" value={contactLabel} />
              <InfoRow label="Responsable" value={quote.ownerId} />
              <InfoRow label="Statut" value={QUOTE_STATUS_LABELS[quote.status]} />
              <InfoRow label="Devise" value={quote.currency} />
              <InfoRow label="Émission" value={formatDate(quote.issueDate)} />
              <InfoRow label="Expiration" value={formatDate(quote.expirationDate)} />
            </div>
          </SectionCard>

          <SectionCard className="overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-hicotech-dark-border">
              <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Articles</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-left dark:bg-hicotech-dark-page">
                  <tr>
                    <th className="px-5 py-3 font-bold text-slate-500">Description</th>
                    <th className="px-5 py-3 font-bold text-slate-500">Quantité</th>
                    <th className="px-5 py-3 font-bold text-slate-500">Prix unitaire</th>
                    <th className="px-5 py-3 font-bold text-slate-500">TVA</th>
                    <th className="px-5 py-3 font-bold text-slate-500">Total ligne</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                      <td className="px-4 py-3 font-semibold text-hicotech-navy dark:text-white">
                        {item.description}
                        {item.productSku && <p className="mt-1 text-xs font-bold text-slate-400">{item.productSku} · {item.productName ?? "Produit catalogue"}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.quantity}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatQuoteMoney(item.unitPrice, quote.currency)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.taxRate}%</td>
                      <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">{formatQuoteMoney(item.quantity * item.unitPrice * (1 + item.taxRate / 100), quote.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </main>

        <aside className="space-y-4">
          <SectionCard className="p-4">
            <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Totaux</h2>
            <div className="mt-4 space-y-3">
              <InfoRow label="Sous-total" value={formatQuoteMoney(totals.subtotal, totals.currency)} />
              <InfoRow label="Remise" value={formatQuoteMoney(totals.discount, totals.currency)} />
              <InfoRow label="Taxe" value={formatQuoteMoney(totals.tax, totals.currency)} />
              <InfoRow label="Total" value={formatQuoteMoney(totals.total, totals.currency)} />
            </div>
          </SectionCard>
          <PlaceholderCard icon={CalendarClock} title="Timeline" description="Les événements du devis seront connectés aux activités commerciales." />
          <PlaceholderCard icon={NotebookPen} title="Notes internes" description={quote.notes ?? "Les notes internes seront enrichies dans un prochain sprint."} />
        </aside>
      </div>
    </EntityPageLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-hicotech-dark-border dark:bg-slate-900/30">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-sm font-bold text-hicotech-navy dark:text-white">{value}</p>
    </div>
  );
}

function PlaceholderCard({ description, icon: Icon, title }: { description: string; icon: typeof CalendarClock; title: string }) {
  return (
    <SectionCard className="p-4">
      <Icon size={19} className="text-hicotech-blue" />
      <h2 className="mt-3 font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>
    </SectionCard>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function getActionErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
