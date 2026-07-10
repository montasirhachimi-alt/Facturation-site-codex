"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, CircleDollarSign, FileText, Filter, Plus, Sparkles, UserRound } from "lucide-react";
import { CompanyService } from "@/modules/crm/companies";
import { CRM_COMPANIES_WORKSPACE_ID, crmCompanySeed } from "@/modules/crm/companies/ui/companies.seed";
import { OpportunityService } from "@/modules/crm/opportunities";
import { crmOpportunitySeed } from "@/modules/crm/opportunities/ui/opportunities.seed";
import { EntityPageLayout, EntitySearchBar, MetricCard, ProductHero, ProductSectionHeader, SectionCard, entityInputClassName, workspacePrimaryActionClassName, workspaceTableActionClassName } from "@/ui";
import { QUOTE_STATUS_LABELS } from "../quote.constants";
import type { Quote, QuoteSort, QuoteStatus } from "../quote.types";
import { formatQuoteMoney, getQuoteTotals } from "../quote.utils";
import { notifyQuoteStoreUpdated, quoteService, subscribeToQuoteStore } from "../quote.store";
import { SALES_QUOTES_WORKSPACE_ID } from "../quotes.seed";
import { QuoteDialog } from "./quote-dialog";

const companyService = new CompanyService({ seed: crmCompanySeed });
const opportunityService = new OpportunityService({ seed: crmOpportunitySeed });
const companies = companyService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID }).companies;
const opportunities = opportunityService.listOpportunities({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).opportunities;
const companyById = new Map(companies.map((company) => [company.id, company]));
const opportunityById = new Map(opportunities.map((opportunity) => [opportunity.id, opportunity]));

type QuoteFilters = Readonly<{
  query: string;
  status: QuoteStatus | "all";
  companyId: string;
  opportunityId: string;
}>;

export function QuotesWorkspace() {
  const router = useRouter();
  const [, setQuotesVersion] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [sort, setSort] = useState<QuoteSort>({ field: "issueDate", direction: "desc" });
  const [filters, setFilters] = useState<QuoteFilters>({ query: "", status: "all", companyId: "all", opportunityId: "all" });

  useEffect(() => subscribeToQuoteStore(() => setQuotesVersion((value) => value + 1)), []);

  const quotes = quoteService.listQuotes({
      workspaceId: SALES_QUOTES_WORKSPACE_ID,
      query: filters.query,
      status: filters.status,
      companyId: filters.companyId === "all" ? "all" : filters.companyId as never,
      opportunityId: filters.opportunityId === "all" ? "all" : filters.opportunityId as never
    }, sort).quotes;

  const stats = useMemo(() => buildQuoteStats(quotes), [quotes]);
  const paginatedQuotes = quotes.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(quotes.length / pageSize));

  function updateSort(field: QuoteSort["field"]) {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc"
    }));
  }

  return (
    <EntityPageLayout>
      <ProductHero
        eyebrow="Ventes / Proposition"
        icon={Sparkles}
        personality="sales"
        title="Transformer l'élan commercial en revenu signé."
        subtitle="Chaque devis raconte où le revenu peut avancer : société, opportunité, montant, échéance et prochaine décision."
        actions={[
          { href: "/crm/companies", icon: UserRound, label: "Choisir une société" },
          { href: "/sales/invoices", icon: ArrowRight, label: "Voir les factures", tone: "secondary" }
        ]}
        signals={[
          { label: "Devis", value: String(quotes.length), helper: "portefeuille visible" },
          { label: "Montant", value: formatQuoteMoney(stats.totalValue, "MAD"), helper: "valeur filtrée" },
          { label: "Acceptés", value: String(stats.accepted), helper: "conversion commerciale" },
          { label: "À relancer", value: String(stats.expiringSoon), helper: "échéance proche" }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" aria-label="Signaux de proposition commerciale">
        <MetricCard icon={FileText} label="Devis" value={String(quotes.length)} helper="Portefeuille visible" />
        <MetricCard icon={CircleDollarSign} label="Montant total" value={formatQuoteMoney(stats.totalValue, "MAD")} helper="Toutes lignes filtrées" />
        <MetricCard icon={CalendarClock} label="À relancer" value={String(stats.expiringSoon)} helper="Échéance proche" />
        <MetricCard icon={UserRound} label="Acceptés" value={String(stats.accepted)} helper="Conversion commerciale" />
        <MetricCard icon={Filter} label="Brouillons" value={String(stats.drafts)} helper="À finaliser" />
      </section>

      <SectionCard className="p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <ProductSectionHeader icon={Filter} title="Qualification des propositions" description="Filtrez le portefeuille par client, société, opportunité ou statut." />
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className={workspacePrimaryActionClassName}
          >
            <Plus size={17} />
            Créer un devis
          </button>
        </div>
        <div className="mt-4 grid gap-2 lg:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <EntitySearchBar value={filters.query} onChange={(value) => setFilters({ ...filters, query: value })} placeholder="Rechercher un devis..." />
          </div>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as QuoteFilters["status"] })} className={entityInputClassName}>
            <option value="all">Tous statuts</option>
            {Object.entries(QUOTE_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={filters.companyId} onChange={(event) => setFilters({ ...filters, companyId: event.target.value })} className={entityInputClassName}>
            <option value="all">Toutes sociétés</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.displayName}</option>)}
          </select>
          <select value={filters.opportunityId} onChange={(event) => setFilters({ ...filters, opportunityId: event.target.value })} className={entityInputClassName}>
            <option value="all">Toutes opportunités</option>
            {opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>)}
          </select>
        </div>
      </SectionCard>

      <QuotesTable quotes={paginatedQuotes} sort={sort} onCreate={() => setDialogOpen(true)} onSort={updateSort} />

      <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/50 md:flex-row md:items-center md:justify-between dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Page {page} sur {totalPages} • {quotes.length} devis</p>
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

      <QuoteDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={(quote) => {
          notifyQuoteStoreUpdated();
          setDialogOpen(false);
          setPage(1);
          router.push(`/sales/quotes/${quote.id}`);
        }}
      />
    </EntityPageLayout>
  );
}

function QuotesTable({ onCreate, onSort, quotes, sort }: { onCreate: () => void; onSort: (field: QuoteSort["field"]) => void; quotes: readonly Quote[]; sort: QuoteSort }) {
  if (quotes.length === 0) {
    return (
      <SectionCard className="p-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-50 text-hicotech-blue ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
          <FileText size={24} />
        </div>
        <h2 className="mt-4 font-display text-lg font-bold text-hicotech-navy dark:text-white">Aucun devis trouvé</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">
          Les devis structurent la proposition commerciale avant commande ou facture.
        </p>
        <button type="button" onClick={onCreate} className={`${workspacePrimaryActionClassName} mt-5`}>
          <Plus size={17} />
          Créer votre premier devis
        </button>
      </SectionCard>
    );
  }

  return (
    <SectionCard className="overflow-hidden">
      <div className="relative overflow-hidden border-b border-slate-200 bg-hicotech-navy px-4 py-3.5 text-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="absolute right-0 top-0 h-full w-28 bg-white/5" />
        <h2 className="relative font-display text-lg font-bold text-white">Liste des devis</h2>
        <p className="relative mt-0.5 text-xs font-medium text-cyan-50/70">Devis commerciaux reliés au CRM.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left dark:border-hicotech-dark-border dark:bg-hicotech-dark-page">
            <tr>
              {[
                ["number", "Numéro"],
                ["customerName", "Client"],
                ["company", "Société"],
                ["opportunity", "Opportunité"],
                ["status", "Statut"],
                ["issueDate", "Émission"],
                ["expirationDate", "Expiration"],
                ["total", "Montant"],
                ["ownerId", "Responsable"]
              ].map(([field, label]) => (
                <th key={field} className="px-4 py-2 font-display text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-300">
                  {["company", "opportunity"].includes(field) ? label : (
                    <button type="button" onClick={() => onSort(field as QuoteSort["field"])} className="rounded-md focus:outline-none focus:ring-2 focus:ring-hicotech-blue/30">
                      {label}{sort.field === field ? sort.direction === "asc" ? " ↑" : " ↓" : ""}
                    </button>
                  )}
                </th>
              ))}
              <th className="px-4 py-2 font-display text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => {
              const totals = getQuoteTotals(quote);
              return (
                <tr key={quote.id} className="border-t border-slate-100 transition hover:bg-hicotech-sky/55 hover:shadow-[inset_4px_0_0_#0D6EFD] dark:border-hicotech-dark-border dark:hover:bg-hicotech-dark-page/60">
                  <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">{quote.number}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{quote.customerName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{companyById.get(quote.companyId)?.displayName ?? "Non définie"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{quote.opportunityId ? opportunityById.get(quote.opportunityId)?.title ?? "Opportunité" : "-"}</td>
                  <td className="px-4 py-3"><QuoteStatusBadge status={quote.status} /></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(quote.issueDate)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(quote.expirationDate)}</td>
                  <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">{formatQuoteMoney(totals.total, totals.currency)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{quote.ownerId}</td>
                  <td className="px-4 py-3">
                    <Link href={`/sales/quotes/${quote.id}`} className={workspaceTableActionClassName}>
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

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const tones: Record<QuoteStatus, string> = {
    draft: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    sent: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200",
    accepted: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
    refused: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200",
    expired: "bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-200"
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${tones[status]}`}><span className="size-1.5 rounded-full bg-current" />{QUOTE_STATUS_LABELS[status]}</span>;
}

function buildQuoteStats(quotes: readonly Quote[]) {
  return {
    accepted: quotes.filter((quote) => quote.status === "accepted").length,
    drafts: quotes.filter((quote) => quote.status === "draft").length,
    expiringSoon: quotes.filter((quote) => Date.parse(quote.expirationDate) <= Date.parse("2026-08-03T00:00:00.000Z")).length,
    totalValue: quotes.reduce((total, quote) => total + getQuoteTotals(quote).total, 0)
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
