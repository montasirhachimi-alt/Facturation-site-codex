"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  ContactRound,
  HandCoins,
  MessageSquareText,
  NotebookPen,
  Plus,
  FileText,
  Users
} from "lucide-react";
import { EntityHeader, EntityPageLayout, InfoCard, MetricCard, SectionCard } from "@/ui";
import { ActivityService } from "../activities";
import { crmActivitySeed } from "../activities/ui/activities.seed";
import { CompanyService } from "../companies";
import { CRM_COMPANIES_WORKSPACE_ID, crmCompanySeed } from "../companies/ui/companies.seed";
import { ContactService } from "../contacts";
import { crmContactSeed } from "../contacts/ui/contacts.seed";
import { MeetingService } from "../meetings";
import { crmMeetingSeed } from "../meetings/ui/meetings.seed";
import { NoteService } from "../notes";
import { crmNoteSeed } from "../notes/ui/notes.seed";
import { OpportunityService, formatOpportunityValue } from "../opportunities";
import { crmOpportunitySeed } from "../opportunities/ui/opportunities.seed";
import { QuoteService, formatQuoteMoney, getQuoteTotals, quoteSeed, SALES_QUOTES_WORKSPACE_ID } from "@/modules/sales/quotes";
import { invoiceService, getInvoiceTotals } from "@/modules/sales/invoices";
import { TaskService } from "../tasks";
import { crmTaskSeed } from "../tasks/ui/tasks.seed";

const workspaceId = CRM_COMPANIES_WORKSPACE_ID;

const companyService = new CompanyService({ seed: crmCompanySeed });
const contactService = new ContactService({ seed: crmContactSeed });
const activityService = new ActivityService({ seed: crmActivitySeed });
const meetingService = new MeetingService({ seed: crmMeetingSeed });
const taskService = new TaskService({ seed: crmTaskSeed });
const noteService = new NoteService({ seed: crmNoteSeed });
const opportunityService = new OpportunityService({ seed: crmOpportunitySeed });
const quoteService = new QuoteService({ seed: quoteSeed });

const companies = companyService.listCompanies({ workspaceId }).companies;
const contacts = contactService.listContacts({ workspaceId }).contacts;
const activities = activityService.listActivities({ workspaceId }).activities;
const meetings = meetingService.listMeetings({ workspaceId }).meetings;
const tasks = taskService.listTasks({ workspaceId }).tasks;
const notes = noteService.listNotes({ workspaceId }).notes;
const opportunities = opportunityService.listOpportunities({ workspaceId }).opportunities;
const quotes = quoteService.listQuotes({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).quotes;
const invoices = invoiceService.listInvoices({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).invoices;

const openTasks = tasks.filter((task) => !["completed", "cancelled"].includes(task.status));
const openOpportunities = opportunities.filter((opportunity) => opportunity.status === "open");
const upcomingMeetings = meetings.filter((meeting) => ["planned", "confirmed"].includes(meeting.status));
const primaryContacts = contacts.filter((contact) => contact.isPrimaryContact);
const decisionMakers = contacts.filter((contact) => contact.isDecisionMaker);

export function CrmHomePage() {
  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["CRM", "Vue d'ensemble CRM"]}
        title="Centre de relation client"
        description="Un cockpit calme pour comprendre vos comptes, prioriser les échanges et garder le pipeline commercial lisible."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <InfoCard>Espace : HicoPilot CRM</InfoCard>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200">
              CRM opérationnel
            </span>
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" aria-label="Actions rapides CRM">
        <QuickAction href="/crm/companies" icon={Building2} label="Nouvelle société" helper="Créer le compte central" />
        <QuickAction href="/crm/companies" icon={ContactRound} label="Nouveau contact" helper="Depuis l'onglet Contacts d'une société" />
        <QuickAction href="/crm/contacts/contact-sara-amrani" icon={CalendarCheck} label="Planifier une réunion" helper="Depuis une fiche contact" />
        <QuickAction href="/crm/contacts/contact-sara-amrani" icon={CheckCircle2} label="Nouvelle tâche" helper="Depuis une fiche contact" />
        <QuickAction href="/crm/opportunities" icon={HandCoins} label="Pipeline commercial" helper="Dans Ventes" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7" aria-label="Indicateurs CRM">
        <MetricCard icon={Building2} label="Sociétés" value={String(companies.length)} helper="Données de démonstration" />
        <MetricCard icon={ContactRound} label="Contacts" value={String(contacts.length)} helper="Reliés aux sociétés" />
        <MetricCard icon={HandCoins} label="Pipeline commercial" value={String(openOpportunities.length)} helper={formatOpportunityValue(totalPipelineValue(openOpportunities))} />
        <MetricCard icon={CalendarCheck} label="Réunions" value={String(meetings.length)} helper={`${upcomingMeetings.length} à venir`} />
        <MetricCard icon={ClipboardList} label="Tâches ouvertes" value={String(openTasks.length)} helper="À traiter depuis les contacts" />
        <MetricCard icon={NotebookPen} label="Notes" value={String(notes.length)} helper="Base de connaissance CRM" />
        <MetricCard icon={Activity} label="Activités" value={String(activities.length)} helper="Historique commercial" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <SectionCard className="p-5">
          <SectionTitle
            icon={Activity}
            title="Activité récente"
            description="Les derniers signaux commerciaux enregistrés dans le CRM."
          />
          <div className="mt-5 space-y-3">
            {activities.slice(0, 4).map((item) => (
              <TimelineRow
                key={item.id}
                title={item.title}
                description={item.description}
                meta={formatDate(item.performedAt)}
                badge={activityLabel(item.type)}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard className="p-5">
          <SectionTitle
            icon={CalendarCheck}
            title="Réunions à venir"
            description="Préparez les prochains échanges depuis les fiches contact."
          />
          <div className="mt-5 space-y-3">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.slice(0, 3).map((meeting) => (
                <CompactItem
                  key={meeting.id}
                  title={meeting.title}
                  description={`${formatDate(meeting.startAt)} • ${meeting.location ?? "Lieu à confirmer"}`}
                  badge={meeting.status === "confirmed" ? "Confirmée" : "Planifiée"}
                />
              ))
            ) : (
              <PurposeEmptyState title="Aucune réunion planifiée" description="Planifiez une réunion depuis une fiche contact." />
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <SectionCard className="p-5">
          <SectionTitle icon={HandCoins} title="Pipeline commercial" description="Suivez les opportunités par étape, valeur et probabilité." />
          <div className="mt-5 space-y-3">
            {openOpportunities.slice(0, 4).map((opportunity) => (
              <CompactItem
                key={opportunity.id}
                title={opportunity.title}
                description={`${formatOpportunityValue(opportunity.estimatedValue)} • ${opportunity.probability}%`}
                badge={opportunityStageLabel(opportunity.stage)}
              />
            ))}
          </div>
          <Link
            href="/crm/opportunities"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-hicotech-blue transition hover:border-hicotech-blue/40 hover:bg-hicotech-sky focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:hover:bg-hicotech-blue/10"
          >
            Ouvrir le pipeline
            <ArrowRight size={14} />
          </Link>
        </SectionCard>

        <SectionCard className="p-5">
          <SectionTitle icon={ClipboardList} title="Tâches ouvertes" description="Les prochaines actions CRM à suivre." />
          <div className="mt-5 space-y-3">
            {openTasks.slice(0, 4).map((task) => (
              <CompactItem key={task.id} title={task.title} description={formatDate(task.dueDate)} badge={taskPriorityLabel(task.priority)} />
            ))}
          </div>
        </SectionCard>

        <SectionCard className="p-5">
          <SectionTitle icon={NotebookPen} title="Notes récentes" description="Contexte utile pour les prochains échanges." />
          <div className="mt-5 space-y-3">
            {notes.slice(0, 3).map((note) => (
              <CompactItem key={note.id} title={note.title} description={note.content} badge={noteVisibilityLabel(note.visibility)} />
            ))}
          </div>
        </SectionCard>

        <SectionCard className="p-5">
          <SectionTitle icon={FileText} title="Devis récents" description="Dernières propositions commerciales préparées." />
          <div className="mt-5 space-y-3">
            {quotes.slice(0, 3).map((quote) => {
              const totals = getQuoteTotals(quote);
              return (
                <Link key={quote.id} href={`/sales/quotes/${quote.id}`} className="block">
                  <CompactItem title={quote.number} description={`${quote.customerName} • ${formatQuoteMoney(totals.total, totals.currency)}`} badge="Devis" />
                </Link>
              );
            })}
          </div>
          <Link
            href="/sales/quotes"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-hicotech-blue transition hover:border-hicotech-blue/40 hover:bg-hicotech-sky focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:hover:bg-hicotech-blue/10"
          >
            Ouvrir les devis
            <ArrowRight size={14} />
          </Link>
        </SectionCard>

        <SectionCard className="p-5">
          <SectionTitle icon={FileText} title="Factures récentes" description="Factures générées depuis les devis acceptés." />
          <div className="mt-5 space-y-3">
            {invoices.slice(0, 3).map((invoice) => {
              const totals = getInvoiceTotals(invoice);
              return (
                <Link key={invoice.id} href={`/sales/invoices/${invoice.id}`} className="block">
                  <CompactItem title={invoice.number} description={`${invoice.customerName} • ${formatQuoteMoney(totals.total, totals.currency)}`} badge="Facture" />
                </Link>
              );
            })}
          </div>
          <Link
            href="/sales/invoices"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-hicotech-blue transition hover:border-hicotech-blue/40 hover:bg-hicotech-sky focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:hover:bg-hicotech-blue/10"
          >
            Ouvrir les factures
            <ArrowRight size={14} />
          </Link>
        </SectionCard>

      </div>

      <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <SectionCard className="p-5">
          <SectionTitle icon={Users} title="Vue contacts" description="Les contacts vivent dans les fiches société." />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <ContactSummary label="Contacts principaux" value={primaryContacts.length} />
            <ContactSummary label="Décideurs" value={decisionMakers.length} />
            <ContactSummary label="Départements" value={new Set(contacts.map((contact) => contact.department).filter(Boolean)).size} />
            <ContactSummary label="Langues" value={new Set(contacts.map((contact) => contact.preferredLanguage).filter(Boolean)).size} />
          </div>
        </SectionCard>

        <SectionCard className="p-5">
          <SectionTitle
            icon={MessageSquareText}
            title="Repères de navigation CRM"
            description="Les espaces contextuels restent attachés à leur parent pour garder le CRM simple."
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <NavigationHint title="Sociétés" description="Point d'entrée central pour comptes, contacts et timeline." href="/crm/companies" />
            <NavigationHint title="Contacts" description="Ouvrez une société, puis l'onglet Contacts." href="/crm/companies" />
            <NavigationHint title="Réunions, tâches et notes" description="Ouvrez une fiche contact pour planifier, suivre et noter les échanges." href="/crm/contacts/contact-sara-amrani" />
            <NavigationHint title="Pipeline commercial" description="Ouvrez Ventes pour suivre toutes les opportunités." href="/crm/opportunities" />
          </div>
        </SectionCard>
      </div>

      <SectionCard className="p-5">
        <SectionTitle icon={Building2} title="Sociétés ajoutées récemment" description="Accédez au workspace société pour approfondir." />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {companies.slice(0, 4).map((company) => (
            <Link
              key={company.id}
              href={`/crm/companies/${company.id}`}
              className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-hicotech-blue/30 hover:bg-white focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:bg-slate-900/30 dark:hover:bg-hicotech-dark-card"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-hicotech-navy dark:text-white">{company.displayName}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-300">{company.city ?? "Ville non renseignée"} • {company.status}</p>
              </div>
              <ArrowRight size={16} className="text-slate-400 transition group-hover:text-hicotech-blue" />
            </Link>
          ))}
        </div>
      </SectionCard>
    </EntityPageLayout>
  );
}

function QuickAction({
  helper,
  href,
  icon: Icon,
  label
}: {
  helper: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-hicotech-blue/30 hover:shadow-lg hover:shadow-slate-200/70 focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-hicotech-sky text-hicotech-blue transition group-hover:bg-hicotech-blue group-hover:text-white dark:bg-hicotech-blue/20">
          <Icon size={19} />
        </span>
        <span className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition group-hover:border-hicotech-blue/30 group-hover:text-hicotech-blue dark:border-hicotech-dark-border">
          <Plus size={16} />
        </span>
      </div>
      <p className="mt-4 text-sm font-bold text-hicotech-navy dark:text-white">{label}</p>
      <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-300">{helper}</p>
    </Link>
  );
}

function SectionTitle({
  description,
  icon: Icon,
  title
}: {
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20">
        <Icon size={19} />
      </div>
      <div>
        <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>
      </div>
    </div>
  );
}

function TimelineRow({ badge, description, meta, title }: { badge: string; description?: string; meta: string; title: string }) {
  return (
    <article className="relative rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-hicotech-blue/25 hover:bg-white dark:border-hicotech-dark-border dark:bg-slate-900/30 dark:hover:bg-hicotech-dark-card">
      <span className="absolute left-0 top-4 h-8 w-1 rounded-r-full bg-hicotech-blue/70" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="pl-2">
          <p className="text-sm font-bold text-hicotech-navy dark:text-white">{title}</p>
          {description && <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>}
        </div>
        <span className="w-fit rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-hicotech-blue ring-1 ring-slate-200 dark:bg-hicotech-dark-card dark:ring-hicotech-dark-border">
          {badge}
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-400">{meta}</p>
    </article>
  );
}

function CompactItem({ badge, description, title }: { badge: string; description?: string; title: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 transition hover:border-hicotech-blue/25 hover:bg-white dark:border-hicotech-dark-border dark:bg-slate-900/30 dark:hover:bg-hicotech-dark-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-hicotech-navy dark:text-white">{title}</p>
          {description && <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500 dark:text-slate-300">{description}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-hicotech-dark-card dark:text-slate-200 dark:ring-hicotech-dark-border">
          {badge}
        </span>
      </div>
    </article>
  );
}

function ContactSummary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-hicotech-dark-border dark:bg-slate-900/30">
      <p className="font-display text-2xl font-bold text-hicotech-navy dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</p>
    </div>
  );
}

function NavigationHint({ description, href, title }: { description: string; href: string; title: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-hicotech-blue/30 hover:bg-white focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:bg-slate-900/30 dark:hover:bg-hicotech-dark-card"
    >
      <p className="text-sm font-bold text-hicotech-navy dark:text-white">{title}</p>
      <p className="mt-2 text-xs font-medium leading-5 text-slate-500 dark:text-slate-300">{description}</p>
    </Link>
  );
}

function PurposeEmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm dark:border-hicotech-dark-border dark:bg-slate-900/30">
      <p className="font-bold text-hicotech-navy dark:text-white">{title}</p>
      <p className="mt-1 leading-6 text-slate-500 dark:text-slate-300">{description}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function activityLabel(type: string) {
  const labels: Record<string, string> = {
    call: "Appel",
    email: "Email",
    meeting: "Réunion",
    note: "Note",
    task: "Tâche"
  };
  return labels[type] ?? "Activité";
}

function taskPriorityLabel(priority: string) {
  const labels: Record<string, string> = {
    urgent: "Urgent",
    high: "Haute",
    medium: "Moyenne",
    low: "Basse"
  };
  return labels[priority] ?? "Priorité";
}

function noteVisibilityLabel(visibility: string) {
  const labels: Record<string, string> = {
    private: "Privée",
    team: "Équipe",
    company: "Société"
  };
  return labels[visibility] ?? "Note";
}

function opportunityStageLabel(stage: string) {
  const labels: Record<string, string> = {
    lead: "Lead",
    qualified: "Qualifiée",
    proposal: "Proposition",
    negotiation: "Négociation",
    won: "Gagnée",
    lost: "Perdue"
  };
  return labels[stage] ?? "Pipeline";
}

function totalPipelineValue(items: typeof openOpportunities) {
  return {
    amount: items.reduce((total, item) => total + item.estimatedValue.amount, 0),
    currency: "MAD" as const
  };
}
