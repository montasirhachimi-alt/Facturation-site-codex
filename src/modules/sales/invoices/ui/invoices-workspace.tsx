"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, CircleDollarSign, FileText, Filter, Sparkles, WalletCards } from "lucide-react";
import { CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import { crmCompanyLocalService, subscribeToCrmCompanyStore } from "@/modules/crm/companies/ui/company-local-store";
import { SALES_QUOTES_WORKSPACE_ID, formatQuoteMoney, quoteService, subscribeToQuoteStore } from "@/modules/sales/quotes";
import { getPlatformModifierLabel, useTableKeyboardNavigation, useWorkspaceCreateShortcut } from "@/platform/keyboard";
import { EntityPageLayout, EntitySearchBar, MetricCard, ProductHero, ProductSectionHeader, SectionCard, entityInputClassName, workspacePrimaryActionClassName, workspaceTableActionClassName } from "@/ui";
import { useEffect, useState } from "react";
import { INVOICE_STATUS_LABELS } from "../invoice.constants";
import { invoiceService, notifyInvoiceStoreUpdated, subscribeToInvoiceStore } from "../invoice.store";
import type { Invoice, InvoiceSort, InvoiceStatus } from "../invoice.types";
import { getInvoiceTotals } from "../invoice.utils";
import { InvoiceDialog } from "./invoice-dialog";

export function InvoicesWorkspace() {
  const router = useRouter();
  const createShortcutLabel = `${getPlatformModifierLabel()}N`;
  const [, setStoreVersion] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filters, setFilters] = useState({ query: "", status: "all" as InvoiceStatus | "all", companyId: "all" });
  const [sort, setSort] = useState<InvoiceSort>({ field: "issueDate", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const quotes = quoteService.listQuotes({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).quotes;
  const quoteById = new Map(quotes.map((quote) => [quote.id, quote]));
  const companies = crmCompanyLocalService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID, includeArchived: false }).companies;
  const companyById = new Map(companies.map((company) => [company.id, company]));
  const invoices = invoiceService.listInvoices({
    workspaceId: SALES_QUOTES_WORKSPACE_ID,
    query: filters.query,
    status: filters.status,
    companyId: filters.companyId === "all" ? "all" : filters.companyId as never
  }, sort).invoices;
  const totalPages = Math.max(1, Math.ceil(invoices.length / pageSize));
  const paginated = invoices.slice((page - 1) * pageSize, page * pageSize);
  const stats = buildInvoiceStats(invoices);

  useEffect(() => {
    const unsubscribeInvoices = subscribeToInvoiceStore(() => setStoreVersion((value) => value + 1));
    const unsubscribeQuotes = subscribeToQuoteStore(() => setStoreVersion((value) => value + 1));
    const unsubscribeCompanies = subscribeToCrmCompanyStore(() => setStoreVersion((value) => value + 1));
    return () => {
      unsubscribeInvoices();
      unsubscribeQuotes();
      unsubscribeCompanies();
    };
  }, []);

  function updateSort(field: InvoiceSort["field"]) {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc"
    }));
  }

  useWorkspaceCreateShortcut({
    label: "Créer une facture",
    onCreate: () => setDialogOpen(true)
  });

  return (
    <EntityPageLayout>
      <ProductHero
        eyebrow="Ventes / Revenu facturé"
        icon={Sparkles}
        personality="sales"
        title="Piloter le revenu émis, payé et à relancer."
        subtitle="La facturation met le chiffre d'affaires en mouvement : montant émis, cash encaissé, échéances et relances."
        actions={[
          { href: "/sales/quotes", icon: ArrowRight, label: "Créer depuis un devis" },
          { href: "/sales/payments", icon: WalletCards, label: "Voir les paiements", tone: "secondary" }
        ]}
        signals={[
          { label: "Factures", value: String(invoices.length), helper: "portefeuille visible" },
          { label: "Total TTC", value: formatQuoteMoney(stats.total, "MAD"), helper: "montant facturé" },
          { label: "Payé", value: formatQuoteMoney(stats.paid, "MAD"), helper: "encaissement actuel" },
          { label: "En retard", value: String(stats.overdue), helper: "à relancer" }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" aria-label="Signaux de revenu facturé">
        <MetricCard icon={FileText} label="Factures" value={String(invoices.length)} helper="Portefeuille visible" />
        <MetricCard icon={CircleDollarSign} label="Total TTC" value={formatQuoteMoney(stats.total, "MAD")} helper="Montant facturé" />
        <MetricCard icon={WalletCards} label="Payé" value={formatQuoteMoney(stats.paid, "MAD")} helper="Encaissement actuel" />
        <MetricCard icon={CalendarClock} label="En retard" value={String(stats.overdue)} helper="À relancer" />
        <MetricCard icon={Filter} label="Émises" value={String(stats.issued)} helper="À suivre" />
      </section>

      <SectionCard className="p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <ProductSectionHeader icon={Filter} title="Lecture du portefeuille facturé" description="Filtrez par client, société ou statut de paiement." />
          <button type="button" onClick={() => setDialogOpen(true)} className={workspacePrimaryActionClassName} aria-keyshortcuts="Meta+N Control+N">
            Créer une facture
            <span className="hidden rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-black sm:inline-flex">{createShortcutLabel}</span>
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="mt-4 grid gap-2 lg:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <EntitySearchBar value={filters.query} onChange={(value) => setFilters({ ...filters, query: value })} placeholder="Rechercher une facture..." />
          </div>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as InvoiceStatus | "all" })} className={entityInputClassName}>
            <option value="all">Tous statuts</option>
            {Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={filters.companyId} onChange={(event) => setFilters({ ...filters, companyId: event.target.value })} className={entityInputClassName}>
            <option value="all">Toutes sociétés</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.displayName}</option>)}
          </select>
        </div>
      </SectionCard>

      <InvoicesTable companyById={companyById} invoices={paginated} quoteById={quoteById} sort={sort} onCreate={() => setDialogOpen(true)} onSort={updateSort} />

      <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/50 md:flex-row md:items-center md:justify-between dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Page {page} sur {totalPages} • {invoices.length} facture(s)</p>
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className={entityInputClassName}>
            <option value={5}>5 par page</option>
            <option value={8}>8 par page</option>
            <option value={12}>12 par page</option>
          </select>
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-40 dark:border-hicotech-dark-border">Précédent</button>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-40 dark:border-hicotech-dark-border">Suivant</button>
        </div>
      </div>

      <InvoiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={(invoice) => {
          notifyInvoiceStoreUpdated();
          setDialogOpen(false);
          setPage(1);
          router.push(`/sales/invoices/${invoice.id}`);
        }}
      />
    </EntityPageLayout>
  );
}

function InvoicesTable({
  invoices,
  companyById,
  onCreate,
  onSort,
  quoteById,
  sort
}: {
  invoices: readonly Invoice[];
  companyById: ReadonlyMap<string, { displayName: string }>;
  onCreate: () => void;
  onSort: (field: InvoiceSort["field"]) => void;
  quoteById: ReadonlyMap<string, { number: string }>;
  sort: InvoiceSort;
}) {
  const router = useRouter();
  const tableNavigation = useTableKeyboardNavigation({
    items: invoices,
    onOpen: (invoice) => router.push(`/sales/invoices/${invoice.id}`)
  });

  if (invoices.length === 0) {
    return (
      <SectionCard className="p-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-50 text-hicotech-blue ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
          <FileText size={24} />
        </div>
        <h2 className="mt-4 font-display text-lg font-bold text-hicotech-navy dark:text-white">Aucune facture trouvée</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">
          Les factures sont générées depuis les devis acceptés.
        </p>
        <button type="button" onClick={onCreate} className={`${workspacePrimaryActionClassName} mt-5`}>
          Créer une facture
          <ArrowRight size={16} />
        </button>
      </SectionCard>
    );
  }

  return (
    <SectionCard className="overflow-hidden">
      <div className="relative overflow-hidden border-b border-slate-200 bg-hicotech-navy px-4 py-3.5 text-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="absolute right-0 top-0 h-full w-28 bg-white/5" />
        <h2 className="relative font-display text-lg font-bold text-white">Liste des factures</h2>
        <p className="relative mt-0.5 text-xs font-medium text-cyan-50/70">Factures commerciales issues des devis acceptés.</p>
      </div>
      <div className="overflow-x-auto" onKeyDown={tableNavigation.onKeyDown}>
        <table className="w-full min-w-[1220px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left dark:border-hicotech-dark-border dark:bg-hicotech-dark-page">
            <tr>
              {[
                ["number", "Numéro"],
                ["customerName", "Client"],
                ["company", "Société"],
                ["quote", "Devis"],
                ["issueDate", "Émission"],
                ["dueDate", "Échéance"],
                ["status", "Statut"],
                ["subtotal", "Montant HT"],
                ["tax", "TVA"],
                ["total", "Montant TTC"],
                ["ownerId", "Responsable"]
              ].map(([field, label]) => (
                <th key={field} className="px-4 py-2 font-display text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-300">
                  {["company", "quote", "subtotal", "tax"].includes(field) ? label : (
                    <button type="button" onClick={() => onSort(field as InvoiceSort["field"])}>{label}{sort.field === field ? sort.direction === "asc" ? " ↑" : " ↓" : ""}</button>
                  )}
                </th>
              ))}
              <th className="px-4 py-2 font-display text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice, index) => {
              const totals = getInvoiceTotals(invoice);
              return (
                <tr
                  key={invoice.id}
                  {...tableNavigation.getRowProps(index)}
                  className={`border-t border-slate-100 outline-none transition hover:bg-hicotech-sky/55 hover:shadow-[inset_4px_0_0_#0D6EFD] focus:bg-hicotech-sky/70 focus:shadow-[inset_4px_0_0_#0D6EFD] focus:ring-2 focus:ring-inset focus:ring-hicotech-blue/20 dark:border-hicotech-dark-border dark:hover:bg-hicotech-dark-page/60 ${index === tableNavigation.activeIndex ? "bg-hicotech-sky/55 shadow-[inset_4px_0_0_#0D6EFD] dark:bg-hicotech-blue/10" : ""}`}
                >
                  <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">{invoice.number}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{invoice.customerName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{companyById.get(invoice.companyId)?.displayName ?? "Non définie"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{invoice.quoteId ? quoteById.get(invoice.quoteId)?.number ?? "Devis" : "-"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(invoice.issueDate)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(invoice.dueDate)}</td>
                  <td className="px-4 py-3"><InvoiceStatusBadge status={invoice.status} /></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatQuoteMoney(totals.subtotal - totals.discount, totals.currency)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatQuoteMoney(totals.tax, totals.currency)}</td>
                  <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">{formatQuoteMoney(totals.total, totals.currency)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{invoice.ownerId}</td>
                  <td className="px-4 py-3">
                    <Link href={`/sales/invoices/${invoice.id}`} className={workspaceTableActionClassName}>
                      Voir
                      <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const tones: Record<InvoiceStatus, string> = {
    draft: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    issued: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200",
    paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
    partially_paid: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200",
    cancelled: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200",
    overdue: "bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-200"
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${tones[status]}`}><span className="size-1.5 rounded-full bg-current" />{INVOICE_STATUS_LABELS[status]}</span>;
}

function buildInvoiceStats(invoices: readonly Invoice[]) {
  return {
    issued: invoices.filter((invoice) => invoice.status === "issued").length,
    overdue: invoices.filter((invoice) => invoice.status === "overdue").length,
    paid: invoices.reduce((total, invoice) => total + invoice.paidAmount, 0),
    total: invoices.reduce((total, invoice) => total + getInvoiceTotals(invoice).total, 0)
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
