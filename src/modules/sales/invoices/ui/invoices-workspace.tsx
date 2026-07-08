"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, CircleDollarSign, FileText, Filter, Search, Sparkles, WalletCards } from "lucide-react";
import { CompanyService } from "@/modules/crm/companies";
import { CRM_COMPANIES_WORKSPACE_ID, crmCompanySeed } from "@/modules/crm/companies/ui/companies.seed";
import { QuoteService, quoteSeed, SALES_QUOTES_WORKSPACE_ID, formatQuoteMoney } from "@/modules/sales/quotes";
import { EntityPageLayout, MetricCard, ProductHero, ProductSectionHeader, SectionCard, entityInputClassName } from "@/ui";
import { useState } from "react";
import { INVOICE_STATUS_LABELS } from "../invoice.constants";
import { invoiceService } from "../invoice.store";
import type { Invoice, InvoiceSort, InvoiceStatus } from "../invoice.types";
import { getInvoiceTotals } from "../invoice.utils";

const companyService = new CompanyService({ seed: crmCompanySeed });
const quoteService = new QuoteService({ seed: quoteSeed });
const companies = companyService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID }).companies;
const quotes = quoteService.listQuotes({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).quotes;
const companyById = new Map(companies.map((company) => [company.id, company]));
const quoteById = new Map(quotes.map((quote) => [quote.id, quote]));

export function InvoicesWorkspace() {
  const [filters, setFilters] = useState({ query: "", status: "all" as InvoiceStatus | "all", companyId: "all" });
  const [sort, setSort] = useState<InvoiceSort>({ field: "issueDate", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const invoices = invoiceService.listInvoices({
    workspaceId: SALES_QUOTES_WORKSPACE_ID,
    query: filters.query,
    status: filters.status,
    companyId: filters.companyId === "all" ? "all" : filters.companyId as never
  }, sort).invoices;
  const totalPages = Math.max(1, Math.ceil(invoices.length / pageSize));
  const paginated = invoices.slice((page - 1) * pageSize, page * pageSize);
  const stats = buildInvoiceStats(invoices);

  function updateSort(field: InvoiceSort["field"]) {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc"
    }));
  }

  return (
    <EntityPageLayout>
      <ProductHero
        eyebrow="Ventes / Factures"
        icon={Sparkles}
        title="Voir ce qui est facturé, payé et à relancer."
        subtitle="Les factures donnent une lecture executive du revenu émis, du cash encaissé et des prochaines relances."
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={FileText} label="Factures" value={String(invoices.length)} helper="Portefeuille visible" />
        <MetricCard icon={CircleDollarSign} label="Total TTC" value={formatQuoteMoney(stats.total, "MAD")} helper="Montant facturé" />
        <MetricCard icon={WalletCards} label="Payé" value={formatQuoteMoney(stats.paid, "MAD")} helper="Encaissement actuel" />
        <MetricCard icon={CalendarClock} label="En retard" value={String(stats.overdue)} helper="À relancer" />
        <MetricCard icon={Filter} label="Émises" value={String(stats.issued)} helper="À suivre" />
      </section>

      <SectionCard className="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <ProductSectionHeader icon={Filter} title="Recherche et filtres" description="Filtrez par client, société ou statut de paiement." />
          <Link href="/sales/quotes" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-hicotech-blue px-5 py-3 text-sm font-bold text-white shadow-[0_16px_40px_rgba(13,110,253,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700">
            Créer depuis un devis
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/40 xl:col-span-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
            <Search size={16} className="text-slate-400" />
            <input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} className="w-full bg-transparent text-sm outline-none dark:text-white" placeholder="Rechercher une facture..." />
          </label>
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

      <InvoicesTable invoices={paginated} sort={sort} onSort={updateSort} />

      <div className="flex flex-col gap-3 rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(10,30,63,0.08)] md:flex-row md:items-center md:justify-between dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
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
    </EntityPageLayout>
  );
}

function InvoicesTable({ invoices, onSort, sort }: { invoices: readonly Invoice[]; onSort: (field: InvoiceSort["field"]) => void; sort: InvoiceSort }) {
  if (invoices.length === 0) {
    return (
      <SectionCard className="p-10 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-slate-50 text-hicotech-blue ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
          <FileText size={28} />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-hicotech-navy dark:text-white">Aucune facture trouvée</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">
          Les factures sont générées depuis les devis acceptés.
        </p>
        <Link href="/sales/quotes" className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700">
          Créer depuis un devis
          <ArrowRight size={16} />
        </Link>
      </SectionCard>
    );
  }

  return (
    <SectionCard className="overflow-hidden">
      <div className="relative overflow-hidden border-b border-slate-200 bg-hicotech-navy px-5 py-6 text-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="absolute right-0 top-0 h-full w-40 bg-white/5" />
        <h2 className="relative font-display text-2xl font-bold text-white">Liste des factures</h2>
        <p className="relative mt-1 text-sm font-medium text-cyan-50/70">Factures commerciales issues des devis acceptés.</p>
      </div>
      <div className="overflow-x-auto">
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
                <th key={field} className="px-5 py-3 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                  {["company", "quote", "subtotal", "tax"].includes(field) ? label : (
                    <button type="button" onClick={() => onSort(field as InvoiceSort["field"])}>{label}{sort.field === field ? sort.direction === "asc" ? " ↑" : " ↓" : ""}</button>
                  )}
                </th>
              ))}
              <th className="px-5 py-3 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
              const totals = getInvoiceTotals(invoice);
              return (
                <tr key={invoice.id} className="border-t border-slate-100 transition hover:bg-hicotech-sky/55 hover:shadow-[inset_4px_0_0_#0D6EFD] dark:border-hicotech-dark-border dark:hover:bg-hicotech-dark-page/60">
                  <td className="px-5 py-4 font-bold text-hicotech-navy dark:text-white">{invoice.number}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{invoice.customerName}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{companyById.get(invoice.companyId)?.displayName ?? "Non définie"}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{invoice.quoteId ? quoteById.get(invoice.quoteId)?.number ?? "Devis" : "-"}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(invoice.issueDate)}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(invoice.dueDate)}</td>
                  <td className="px-5 py-4"><InvoiceStatusBadge status={invoice.status} /></td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatQuoteMoney(totals.subtotal - totals.discount, totals.currency)}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatQuoteMoney(totals.tax, totals.currency)}</td>
                  <td className="px-5 py-4 font-bold text-hicotech-navy dark:text-white">{formatQuoteMoney(totals.total, totals.currency)}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{invoice.ownerId}</td>
                  <td className="px-5 py-4">
                    <Link href={`/sales/invoices/${invoice.id}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-hicotech-blue transition hover:bg-hicotech-sky dark:border-hicotech-dark-border">
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
