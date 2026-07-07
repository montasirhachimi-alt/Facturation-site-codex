"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Filter,
  GripVertical,
  HandCoins,
  MoreHorizontal,
  Search,
  Target,
  TrendingDown,
  UserRound
} from "lucide-react";
import { useMemo, useState } from "react";
import { CompanyService } from "@/modules/crm/companies";
import { CRM_COMPANIES_WORKSPACE_ID, crmCompanySeed } from "@/modules/crm/companies/ui/companies.seed";
import { ContactService } from "@/modules/crm/contacts";
import { crmContactSeed } from "@/modules/crm/contacts/ui/contacts.seed";
import { EntityHeader, EntityPageLayout, InfoCard, MetricCard, SectionCard, entityInputClassName } from "@/ui";
import { OpportunityService } from "../opportunity.service";
import type { Opportunity, OpportunityPriority, OpportunityStage, OpportunityStatus } from "../opportunity.types";
import { formatOpportunityValue } from "../opportunity.utils";
import { OPPORTUNITY_PRIORITY_LABELS, OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGES, OPPORTUNITY_STATUS_LABELS } from "../opportunity.constants";
import { CRM_OPPORTUNITIES_WORKSPACE_ID, crmOpportunitySeed } from "./opportunities.seed";
import { OpportunityQuoteAction } from "@/modules/sales/quotes/ui";
import { invoiceService } from "@/modules/sales/invoices";

const workspaceId = CRM_OPPORTUNITIES_WORKSPACE_ID;
const opportunityService = new OpportunityService({ seed: crmOpportunitySeed });
const companyService = new CompanyService({ seed: crmCompanySeed });
const contactService = new ContactService({ seed: crmContactSeed });

const allOpportunities = opportunityService.listOpportunities({ workspaceId, includeArchived: true }).opportunities;
const companies = companyService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID }).companies;
const contacts = contactService.listContacts({ workspaceId: CRM_COMPANIES_WORKSPACE_ID }).contacts;

const companyById = new Map(companies.map((company) => [company.id, company]));
const contactById = new Map(contacts.map((contact) => [contact.id, contact]));

type PipelineFilters = Readonly<{
  query: string;
  ownerId: string;
  companyId: string;
  priority: OpportunityPriority | "all";
  status: OpportunityStatus | "all";
  closeWindow: "all" | "next30" | "overdue";
}>;

export function OpportunitiesWorkspace() {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<PipelineFilters>({
    query: "",
    ownerId: "all",
    companyId: "all",
    priority: "all",
    status: "all",
    closeWindow: "all"
  });

  const filtered = useMemo(() => filterOpportunities(allOpportunities, filters), [filters]);
  const stats = useMemo(() => buildStats(filtered), [filtered]);
  const selectedOpportunity = filtered.find((opportunity) => opportunity.id === selectedId) ?? filtered[0];

  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["Ventes", "Pipeline commercial"]}
        title="Pipeline commercial"
        description="Suivez les opportunités depuis le premier signal jusqu'à la conclusion commerciale."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <InfoCard>Espace actif : HicoPilot CRM</InfoCard>
            <Link
              href="/crm"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-hicotech-navy transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white"
            >
              Vue d&apos;ensemble CRM
              <ArrowRight size={14} />
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6" aria-label="Résumé du pipeline">
        <MetricCard icon={HandCoins} label="Opportunités" value={String(filtered.length)} helper="Pipeline filtré" />
        <MetricCard icon={CircleDollarSign} label="Valeur pipeline" value={formatOpportunityValue({ amount: stats.totalValue, currency: "MAD" })} helper="Valeur estimée" />
        <MetricCard icon={CheckCircle2} label="Gagnées ce mois" value={String(stats.wonThisMonth)} helper="Démonstration juillet" />
        <MetricCard icon={TrendingDown} label="Perdues ce mois" value={String(stats.lostThisMonth)} helper="Démonstration juillet" />
        <MetricCard icon={Target} label="Probabilité moyenne" value={`${stats.averageProbability}%`} helper="Sur opportunités visibles" />
        <MetricCard icon={CalendarClock} label="Clôtures proches" value={String(stats.upcomingClosings)} helper="30 prochains jours" />
      </section>

      <SectionCard className="p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20">
              <Filter size={18} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Filtres du pipeline</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Affinez les opportunités par société, responsable, priorité, statut ou date de clôture.</p>
            </div>
          </div>
          <Link
            href="/crm/companies"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50"
          >
            Créer depuis une société
          </Link>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-6">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 xl:col-span-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
            <Search size={16} className="text-slate-400" />
            <input
              value={filters.query}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
              className="w-full bg-transparent text-sm outline-none dark:text-white"
              placeholder="Rechercher une opportunité..."
            />
          </label>
          <select value={filters.companyId} onChange={(event) => setFilters({ ...filters, companyId: event.target.value })} className={entityInputClassName}>
            <option value="all">Toutes sociétés</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.displayName}</option>
            ))}
          </select>
          <select value={filters.ownerId} onChange={(event) => setFilters({ ...filters, ownerId: event.target.value })} className={entityInputClassName}>
            <option value="all">Tous responsables</option>
            {Array.from(new Set(allOpportunities.map((opportunity) => opportunity.ownerId))).map((ownerId) => (
              <option key={ownerId} value={ownerId}>{ownerId}</option>
            ))}
          </select>
          <select value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value as PipelineFilters["priority"] })} className={entityInputClassName}>
            <option value="all">Toutes priorités</option>
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </select>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as PipelineFilters["status"] })} className={entityInputClassName}>
            <option value="all">Tous statuts</option>
            <option value="open">Ouverte</option>
            <option value="won">Gagnée</option>
            <option value="lost">Perdue</option>
          </select>
          <select value={filters.closeWindow} onChange={(event) => setFilters({ ...filters, closeWindow: event.target.value as PipelineFilters["closeWindow"] })} className={entityInputClassName}>
            <option value="all">Toutes clôtures</option>
            <option value="next30">30 prochains jours</option>
            <option value="overdue">En retard</option>
          </select>
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <PipelineBoard opportunities={filtered} selectedId={selectedOpportunity?.id} onSelect={setSelectedId} />
        <PipelineInspector opportunity={selectedOpportunity} />
      </div>
    </EntityPageLayout>
  );
}

function PipelineBoard({
  onSelect,
  opportunities,
  selectedId
}: {
  onSelect: (id: string) => void;
  opportunities: readonly Opportunity[];
  selectedId?: string;
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1120px] grid-cols-6 gap-4" aria-label="Pipeline commercial">
        {OPPORTUNITY_STAGES.map((stage) => {
          const stageItems = opportunities.filter((opportunity) => opportunity.stage === stage);
          const stageValue = stageItems.reduce((total, opportunity) => total + opportunity.estimatedValue.amount, 0);
          return (
            <section key={stage} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{OPPORTUNITY_STAGE_LABELS[stage]}</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">
                    {stageItems.length} opportunité(s) • {formatOpportunityValue({ amount: stageValue, currency: "MAD" })}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-hicotech-dark-card dark:ring-hicotech-dark-border">
                  {stageItems.length}
                </span>
              </div>
              <div className="space-y-3">
                {stageItems.length > 0 ? (
                  stageItems.map((opportunity) => (
                    <OpportunityPipelineCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      selected={opportunity.id === selectedId}
                      onSelect={() => onSelect(opportunity.id)}
                    />
                  ))
                ) : (
                  <PipelineEmptyState stage={stage} />
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function OpportunityPipelineCard({ onSelect, opportunity, selected }: { onSelect: () => void; opportunity: Opportunity; selected: boolean }) {
  const company = companyById.get(opportunity.companyId);
  const contact = contactById.get(opportunity.primaryContactId);
  const relatedInvoice = invoiceService.listInvoices({ workspaceId, includeArchived: true }).invoices.find((invoice) => invoice.opportunityId === opportunity.id);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full rounded-xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-hicotech-blue/35 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50 dark:bg-hicotech-dark-card ${
        selected ? "border-hicotech-blue ring-2 ring-hicotech-blue/20" : "border-slate-200 dark:border-hicotech-dark-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-sm font-bold leading-5 text-hicotech-navy dark:text-white">{opportunity.title}</h3>
        <GripVertical size={16} className="text-slate-300 transition group-hover:text-hicotech-blue" aria-label="Déplacement bientôt disponible" />
      </div>
      <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
        <Building2 size={14} />
        {company?.displayName ?? "Société non définie"}
      </p>
      <p className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
        <UserRound size={14} />
        {contact?.fullName ?? "Contact non défini"}
      </p>
      <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-500 dark:text-slate-300">
        <span>{formatOpportunityValue(opportunity.estimatedValue)}</span>
        <span>{opportunity.probability}% de probabilité</span>
        <span>{opportunity.expectedCloseDate ? `Clôture ${formatDate(opportunity.expectedCloseDate)}` : "Date à définir"}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge label={OPPORTUNITY_PRIORITY_LABELS[opportunity.priority]} tone={opportunity.priority} />
        <Badge label={OPPORTUNITY_STATUS_LABELS[opportunity.status]} />
        {opportunity.status === "won" || opportunity.stage === "won" ? (
          <Badge label={relatedInvoice ? "Facture créée" : "Facture en attente"} />
        ) : null}
        {opportunity.tags.slice(0, 2).map((tag) => <Badge key={tag} label={tag} />)}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-400">
        <span>{opportunity.ownerId}</span>
        <MoreHorizontal size={16} />
      </div>
    </button>
  );
}

function PipelineInspector({ opportunity }: { opportunity?: Opportunity }) {
  if (!opportunity) {
    return (
      <SectionCard className="p-5">
        <p className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Aucune opportunité sélectionnée</p>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">Sélectionnez une carte du pipeline pour voir le contexte commercial.</p>
      </SectionCard>
    );
  }

  const company = companyById.get(opportunity.companyId);
  const contact = contactById.get(opportunity.primaryContactId);
  const relatedInvoice = invoiceService.listInvoices({ workspaceId, includeArchived: true }).invoices.find((invoice) => invoice.opportunityId === opportunity.id);

  return (
    <aside className="space-y-4">
      <SectionCard className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">Détail opportunité</p>
        <h2 className="mt-2 font-display text-xl font-bold text-hicotech-navy dark:text-white">{opportunity.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{opportunity.description}</p>
        <div className="mt-5 space-y-3">
          <InspectorRow label="Société" value={company?.displayName ?? "Non définie"} href={company ? `/crm/companies/${company.id}` : undefined} />
          <InspectorRow label="Contact principal" value={contact?.fullName ?? "Non défini"} href={contact ? `/crm/contacts/${contact.id}` : undefined} />
          <InspectorRow label="Valeur estimée" value={formatOpportunityValue(opportunity.estimatedValue)} />
          <InspectorRow label="Probabilité" value={`${opportunity.probability}%`} />
          <InspectorRow label="Responsable" value={opportunity.ownerId} />
          <InspectorRow label="Clôture attendue" value={opportunity.expectedCloseDate ? formatDate(opportunity.expectedCloseDate) : "À définir"} />
          <InspectorRow label="Facturation" value={relatedInvoice ? `Facture créée : ${relatedInvoice.number}` : "Facture en attente"} href={relatedInvoice ? `/sales/invoices/${relatedInvoice.id}` : undefined} />
        </div>
        <div className="mt-5">
          <OpportunityQuoteAction opportunityId={opportunity.id} />
        </div>
      </SectionCard>

      <SectionCard className="p-5">
        <p className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Mouvement futur</p>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
          Le déplacement par glisser-déposer sera connecté dans un prochain sprint. Les cartes sont déjà structurées pour préparer ce comportement.
        </p>
      </SectionCard>
    </aside>
  );
}

function PipelineEmptyState({ stage }: { stage: OpportunityStage }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <p className="font-bold text-hicotech-navy dark:text-white">Aucune opportunité</p>
      <p className="mt-1 leading-6 text-slate-500 dark:text-slate-300">
        Les opportunités au stade {OPPORTUNITY_STAGE_LABELS[stage].toLowerCase()} apparaîtront ici.
      </p>
    </div>
  );
}

function InspectorRow({ href, label, value }: { href?: string; label: string; value: string }) {
  const content = (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-hicotech-dark-border dark:bg-slate-900/30">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-sm font-bold text-hicotech-navy dark:text-white">{value}</p>
    </div>
  );

  return href ? <Link href={href} className="block transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50">{content}</Link> : content;
}

function Badge({ label, tone }: { label: string; tone?: OpportunityPriority }) {
  const tones: Partial<Record<OpportunityPriority, string>> = {
    low: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    medium: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200",
    high: "bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-200",
    urgent: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200"
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${tone ? tones[tone] : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"}`}>{label}</span>;
}

function filterOpportunities(opportunities: readonly Opportunity[], filters: PipelineFilters) {
  const now = Date.parse("2026-07-02T00:00:00.000Z");
  const next30 = Date.parse("2026-08-01T00:00:00.000Z");
  const query = filters.query.trim().toLowerCase();

  return opportunities.filter((opportunity) => {
    const company = companyById.get(opportunity.companyId);
    const contact = contactById.get(opportunity.primaryContactId);
    const closeTime = opportunity.expectedCloseDate ? Date.parse(opportunity.expectedCloseDate) : undefined;
    const searchable = [opportunity.title, opportunity.description, company?.displayName, contact?.fullName, opportunity.ownerId, ...opportunity.tags].join(" ").toLowerCase();

    if (query && !searchable.includes(query)) return false;
    if (filters.ownerId !== "all" && opportunity.ownerId !== filters.ownerId) return false;
    if (filters.companyId !== "all" && opportunity.companyId !== filters.companyId) return false;
    if (filters.priority !== "all" && opportunity.priority !== filters.priority) return false;
    if (filters.status !== "all" && opportunity.status !== filters.status) return false;
    if (filters.closeWindow === "next30" && (!closeTime || closeTime < now || closeTime > next30)) return false;
    if (filters.closeWindow === "overdue" && (!closeTime || closeTime >= now || ["won", "lost"].includes(opportunity.status))) return false;
    return true;
  });
}

function buildStats(opportunities: readonly Opportunity[]) {
  const totalValue = opportunities.reduce((total, opportunity) => total + opportunity.estimatedValue.amount, 0);
  const wonThisMonth = opportunities.filter((opportunity) => opportunity.status === "won" && opportunity.updatedAt.startsWith("2026-07")).length;
  const lostThisMonth = opportunities.filter((opportunity) => opportunity.status === "lost" && opportunity.updatedAt.startsWith("2026-07")).length;
  const averageProbability = opportunities.length ? Math.round(opportunities.reduce((total, opportunity) => total + opportunity.probability, 0) / opportunities.length) : 0;
  const upcomingClosings = opportunities.filter((opportunity) => {
    const closeTime = opportunity.expectedCloseDate ? Date.parse(opportunity.expectedCloseDate) : 0;
    return closeTime >= Date.parse("2026-07-02T00:00:00.000Z") && closeTime <= Date.parse("2026-08-01T00:00:00.000Z");
  }).length;

  return { averageProbability, lostThisMonth, totalValue, upcomingClosings, wonThisMonth };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
