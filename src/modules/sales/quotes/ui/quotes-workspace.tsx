"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, CircleDollarSign, FileText, Filter, Plus, Search, UserRound } from "lucide-react";
import { CompanyService } from "@/modules/crm/companies";
import { CRM_COMPANIES_WORKSPACE_ID, crmCompanySeed } from "@/modules/crm/companies/ui/companies.seed";
import { OpportunityService } from "@/modules/crm/opportunities";
import { crmOpportunitySeed } from "@/modules/crm/opportunities/ui/opportunities.seed";
import { EntityDialog, EntityHeader, EntityPageLayout, InfoCard, MetricCard, SectionCard, entityInputClassName } from "@/ui";
import { QUOTE_STATUS_LABELS } from "../quote.constants";
import { QuoteService } from "../quote.service";
import type { Quote, QuoteSort, QuoteStatus } from "../quote.types";
import { formatQuoteMoney, getQuoteTotals } from "../quote.utils";
import { SALES_QUOTES_USER_ID, SALES_QUOTES_WORKSPACE_ID, quoteSeed } from "../quotes.seed";

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
  const [service] = useState(() => new QuoteService({ seed: quoteSeed }));
  const [, setQuotesVersion] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [sort, setSort] = useState<QuoteSort>({ field: "issueDate", direction: "desc" });
  const [filters, setFilters] = useState<QuoteFilters>({ query: "", status: "all", companyId: "all", opportunityId: "all" });

  const quotes = service.listQuotes({
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

  function createDemoQuote() {
    const company = companies[0];
    const opportunity = opportunities[0];
    if (!company) return;

    service.createQuote({
      workspaceId: SALES_QUOTES_WORKSPACE_ID,
      customerName: company.displayName,
      companyId: company.id,
      opportunityId: opportunity?.id,
      validityDays: 30,
      currency: "MAD",
      ownerId: SALES_QUOTES_USER_ID,
      discountRate: 2,
      notes: "Devis créé depuis le workspace commercial.",
      items: [
        { id: "item-main", description: "Prestation commerciale", quantity: 1, unitPrice: 45000, taxRate: 20 },
        { id: "item-support", description: "Support et accompagnement", quantity: 3, unitPrice: 3500, taxRate: 20 }
      ]
    });
    setDialogOpen(false);
    setQuotesVersion((value) => value + 1);
    setPage(1);
  }

  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["Ventes", "Devis"]}
        title="Devis commerciaux"
        description="Créez, suivez et préparez les devis reliés aux sociétés, contacts et opportunités CRM."
        meta={<InfoCard>Espace actif : HicoPilot CRM</InfoCard>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" aria-label="Indicateurs devis">
        <MetricCard icon={FileText} label="Devis" value={String(quotes.length)} helper="Portefeuille visible" />
        <MetricCard icon={CircleDollarSign} label="Montant total" value={formatQuoteMoney(stats.totalValue, "MAD")} helper="Toutes lignes filtrées" />
        <MetricCard icon={CalendarClock} label="À relancer" value={String(stats.expiringSoon)} helper="Échéance proche" />
        <MetricCard icon={UserRound} label="Acceptés" value={String(stats.accepted)} helper="Conversion commerciale" />
        <MetricCard icon={Filter} label="Brouillons" value={String(stats.drafts)} helper="À finaliser" />
      </section>

      <SectionCard className="p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Recherche et filtres</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Filtrez par client, société, opportunité ou statut.</p>
          </div>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50"
          >
            <Plus size={17} />
            Créer un devis
          </button>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-5">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 xl:col-span-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
            <Search size={16} className="text-slate-400" />
            <input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} className="w-full bg-transparent text-sm outline-none dark:text-white" placeholder="Rechercher un devis..." />
          </label>
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

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
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

      <QuoteDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={createDemoQuote} />
    </EntityPageLayout>
  );
}

function QuotesTable({ onCreate, onSort, quotes, sort }: { onCreate: () => void; onSort: (field: QuoteSort["field"]) => void; quotes: readonly Quote[]; sort: QuoteSort }) {
  if (quotes.length === 0) {
    return (
      <SectionCard className="p-10 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-slate-50 text-hicotech-blue ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
          <FileText size={28} />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-hicotech-navy dark:text-white">Aucun devis trouvé</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">
          Les devis structurent la proposition commerciale avant commande ou facture.
        </p>
        <button type="button" onClick={onCreate} className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700">
          <Plus size={17} />
          Créer votre premier devis
        </button>
      </SectionCard>
    );
  }

  return (
    <SectionCard className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4 dark:border-hicotech-dark-border">
        <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Liste des devis</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Devis commerciaux reliés au CRM.</p>
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
                <th key={field} className="px-5 py-3 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                  {["company", "opportunity"].includes(field) ? label : (
                    <button type="button" onClick={() => onSort(field as QuoteSort["field"])} className="rounded-md focus:outline-none focus:ring-2 focus:ring-hicotech-blue/30">
                      {label}{sort.field === field ? sort.direction === "asc" ? " ↑" : " ↓" : ""}
                    </button>
                  )}
                </th>
              ))}
              <th className="px-5 py-3.5 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => {
              const totals = getQuoteTotals(quote);
              return (
                <tr key={quote.id} className="border-t border-slate-100 transition hover:bg-slate-50/90 dark:border-hicotech-dark-border dark:hover:bg-hicotech-dark-page/60">
                  <td className="px-5 py-4 font-bold text-hicotech-navy dark:text-white">{quote.number}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{quote.customerName}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{companyById.get(quote.companyId)?.displayName ?? "Non définie"}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{quote.opportunityId ? opportunityById.get(quote.opportunityId)?.title ?? "Opportunité" : "-"}</td>
                  <td className="px-5 py-4"><QuoteStatusBadge status={quote.status} /></td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(quote.issueDate)}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formatDate(quote.expirationDate)}</td>
                  <td className="px-5 py-4 font-bold text-hicotech-navy dark:text-white">{formatQuoteMoney(totals.total, totals.currency)}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{quote.ownerId}</td>
                  <td className="px-5 py-4">
                    <Link href={`/sales/quotes/${quote.id}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-hicotech-blue transition hover:bg-hicotech-sky dark:border-hicotech-dark-border">
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

function QuoteDialog({ onClose, onSubmit, open }: { onClose: () => void; onSubmit: () => void; open: boolean }) {
  return (
    <EntityDialog
      eyebrow="Ventes"
      title="Créer un devis"
      description="Structure du futur formulaire complet. La création utilise actuellement des données de démonstration en mémoire."
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      footer={
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold dark:border-hicotech-dark-border">Annuler</button>
          <button type="submit" className="rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white">Créer un devis</button>
        </div>
      }
    >
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <PreviewField label="Client" value={companies[0]?.displayName ?? "Client à sélectionner"} />
        <PreviewField label="Société" value={companies[0]?.displayName ?? "Société à sélectionner"} />
        <PreviewField label="Opportunité" value={opportunities[0]?.title ?? "Opportunité optionnelle"} />
        <PreviewField label="Validité" value="30 jours" />
        <PreviewField label="Devise" value="MAD" />
        <PreviewField label="Remise" value="2%" />
        <PreviewField label="Taxe" value="TVA 20%" />
        <PreviewField label="Notes" value="Notes internes préparées" />
      </div>
    </EntityDialog>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-hicotech-dark-border dark:bg-slate-900/30">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-sm font-bold text-hicotech-navy dark:text-white">{value}</p>
    </div>
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
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tones[status]}`}>{QUOTE_STATUS_LABELS[status]}</span>;
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
