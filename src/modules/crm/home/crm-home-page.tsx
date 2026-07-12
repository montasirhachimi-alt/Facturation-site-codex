"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  ContactRound,
  HandCoins,
  Layers3,
  MessageSquareText,
  NotebookPen,
  FileText,
  Receipt,
  Sparkles,
  ShieldCheck,
  Users
} from "lucide-react";
import { EntityPageLayout, MetricCard, SectionCard } from "@/ui";
import { CRM_COMPANIES_WORKSPACE_ID } from "../companies/ui/companies.seed";
import { crmCompanyLocalService, subscribeToCrmCompanyStore } from "../companies/ui/company-local-store";
import { CRM_CONTACTS_WORKSPACE_ID } from "../contacts/ui/contacts.seed";
import { crmContactLocalService, subscribeToCrmContactStore } from "../contacts/ui/contact-local-store";
import { CRM_MEETINGS_WORKSPACE_ID } from "../meetings/ui/meetings.seed";
import { crmMeetingLocalService, subscribeToCrmMeetingStore } from "../meetings/ui/meeting-local-store";
import { CRM_NOTES_WORKSPACE_ID } from "../notes/ui/notes.seed";
import { crmNoteLocalService, subscribeToCrmNoteStore } from "../notes/ui/note-local-store";
import { formatQuoteMoney, getQuoteTotals, quoteService, SALES_QUOTES_WORKSPACE_ID, subscribeToQuoteStore } from "@/modules/sales/quotes";
import { invoiceService, getInvoiceTotals } from "@/modules/sales/invoices";
import { subscribeToInvoiceStore } from "@/modules/sales/invoices";
import { paymentService, subscribeToPaymentStore } from "@/modules/sales/payments";
import { CRM_TASKS_WORKSPACE_ID } from "../tasks/ui/tasks.seed";
import { crmTaskLocalService, subscribeToCrmTaskStore } from "../tasks/ui/task-local-store";

const workspaceId = CRM_COMPANIES_WORKSPACE_ID;

type RecentSignal = Readonly<{
  id: string;
  title: string;
  description: string;
  date: string;
  badge: string;
}>;

function readCrmHomeSnapshot() {
  const companies = crmCompanyLocalService.listCompanies({ workspaceId, includeArchived: false }).companies;
  const contacts = crmContactLocalService.listContacts({ workspaceId: CRM_CONTACTS_WORKSPACE_ID, includeArchived: false }).contacts;
  const meetings = crmMeetingLocalService.listMeetings({ workspaceId: CRM_MEETINGS_WORKSPACE_ID }).meetings;
  const tasks = crmTaskLocalService.listTasks({ workspaceId: CRM_TASKS_WORKSPACE_ID }).tasks;
  const notes = crmNoteLocalService.listNotes({ workspaceId: CRM_NOTES_WORKSPACE_ID }).notes;
  const quotes = quoteService.listQuotes({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).quotes;
  const invoices = invoiceService.listInvoices({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).invoices;
  const payments = paymentService.listPayments({ workspaceId: SALES_QUOTES_WORKSPACE_ID, includeArchived: false }).payments;
  const openTasks = tasks.filter((task) => !["completed", "cancelled"].includes(task.status));
  const upcomingMeetings = meetings.filter((meeting) => ["planned", "confirmed"].includes(meeting.status));
  const primaryContacts = contacts.filter((contact) => contact.isPrimaryContact);
  const decisionMakers = contacts.filter((contact) => contact.isDecisionMaker);
  const recentSignals = buildRecentSignals({ meetings, notes, tasks });

  return {
    companies,
    contacts,
    decisionMakers,
    invoices,
    meetings,
    notes,
    openTasks,
    payments,
    primaryContacts,
    quotes,
    recentSignals,
    tasks,
    upcomingMeetings
  };
}

type CrmHomeSnapshot = ReturnType<typeof readCrmHomeSnapshot>;

function useCrmHomeSnapshot() {
  const [snapshot, setSnapshot] = useState(readCrmHomeSnapshot);

  useEffect(() => {
    const refresh = () => setSnapshot(readCrmHomeSnapshot());
    const unsubscribers = [
      subscribeToCrmCompanyStore(refresh),
      subscribeToCrmContactStore(refresh),
      subscribeToCrmMeetingStore(refresh),
      subscribeToCrmTaskStore(refresh),
      subscribeToCrmNoteStore(refresh),
      subscribeToQuoteStore(refresh),
      subscribeToInvoiceStore(refresh),
      subscribeToPaymentStore(refresh)
    ];

    refresh();
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  return snapshot;
}

function buildRecentSignals({
  meetings,
  notes,
  tasks
}: Pick<CrmHomeSnapshot, "meetings" | "notes" | "tasks">): readonly RecentSignal[] {
  return [
    ...meetings.map((meeting) => ({
      id: `meeting-${meeting.id}`,
      title: meeting.title,
      description: meeting.description || meeting.location || "Réunion CRM",
      date: meeting.updatedAt || meeting.startAt,
      badge: "Réunion"
    })),
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      description: task.description || "Action CRM à suivre",
      date: task.updatedAt || task.dueDate,
      badge: "Tâche"
    })),
    ...notes.map((note) => ({
      id: `note-${note.id}`,
      title: note.title,
      description: note.content,
      date: note.updatedAt || note.createdAt,
      badge: "Note"
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function CrmHomePage() {
  const data = useCrmHomeSnapshot();
  const { companies, contacts, invoices, meetings, notes, openTasks, payments, primaryContacts, quotes, recentSignals, upcomingMeetings, decisionMakers } = data;

  return (
    <EntityPageLayout>
      <CrmHero data={data} />
      <CrmCommandStrip data={data} />

      <section className="rounded-[1.4rem] border border-slate-200/80 bg-white/80 p-4 shadow-[0_16px_45px_rgba(10,30,63,0.07)] backdrop-blur dark:border-hicotech-dark-border dark:bg-hicotech-dark-card/80 dark:shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-hicotech-navy text-white shadow-sm shadow-slate-300/60 dark:bg-hicotech-blue dark:shadow-none">
              <Sparkles size={17} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Actions rapides</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">Les raccourcis CRM essentiels, prêts sans détour.</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10">
            CRM
          </span>
        </div>
        <div className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-5" aria-label="Actions rapides CRM">
          <QuickAction href="/crm/companies" icon={Building2} label="Nouvelle société" helper="Créer le compte central" />
          <QuickAction href="/crm/contacts" icon={ContactRound} label="Nouveau contact" helper="Ouvrir le workspace Contacts" />
          <QuickAction href="/crm/meetings" icon={CalendarCheck} label="Planifier une réunion" helper="Ouvrir le workspace Réunions" />
          <QuickAction href="/crm/tasks" icon={CheckCircle2} label="Nouvelle tâche" helper="Ouvrir le workspace Tâches" />
          <QuickAction href="/sales/quotes" icon={FileText} label="Créer un devis" helper="Ouvrir le workspace Devis" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7" aria-label="Indicateurs CRM">
        <MetricCard icon={Building2} label="Sociétés" value={String(companies.length)} helper="Comptes CRM suivis" />
        <MetricCard icon={ContactRound} label="Contacts" value={String(contacts.length)} helper="Reliés aux sociétés" />
        <MetricCard icon={FileText} label="Devis" value={String(quotes.length)} helper="Propositions commerciales" />
        <MetricCard icon={Receipt} label="Factures" value={String(invoices.length)} helper="Documents générés" />
        <MetricCard icon={HandCoins} label="Paiements" value={String(payments.length)} helper="Encaissements suivis" />
        <MetricCard icon={CalendarCheck} label="Réunions" value={String(meetings.length)} helper={`${upcomingMeetings.length} à venir`} />
        <MetricCard icon={ClipboardList} label="Tâches ouvertes" value={String(openTasks.length)} helper="À traiter depuis les contacts" />
        <MetricCard icon={NotebookPen} label="Notes" value={String(notes.length)} helper="Base de connaissance CRM" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <SectionCard className="p-4">
          <SectionTitle
            icon={Activity}
            title="Activité récente"
            description="Les derniers signaux issus des réunions, tâches et notes réelles."
          />
          <div className="mt-5 space-y-3">
            {recentSignals.slice(0, 4).map((item) => (
              <TimelineRow
                key={item.id}
                title={item.title}
                description={item.description}
                meta={formatDate(item.date)}
                badge={item.badge}
              />
            ))}
            {recentSignals.length === 0 && (
              <PurposeEmptyState title="Aucune activité récente" description="Les réunions, tâches et notes apparaîtront ici dès leur création." />
            )}
          </div>
        </SectionCard>

        <SectionCard className="p-4">
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
              <PurposeEmptyState title="Aucune réunion planifiée" description="Ouvrez le workspace Réunions pour préparer les prochains échanges." />
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <SectionCard className="p-4">
          <SectionTitle icon={ClipboardList} title="Tâches ouvertes" description="Les prochaines actions CRM à suivre." />
          <div className="mt-5 space-y-3">
            {openTasks.slice(0, 4).map((task) => (
              <CompactItem key={task.id} title={task.title} description={formatDate(task.dueDate)} badge={taskPriorityLabel(task.priority)} />
            ))}
          </div>
        </SectionCard>

        <SectionCard className="p-4">
          <SectionTitle icon={NotebookPen} title="Notes récentes" description="Contexte utile pour les prochains échanges." />
          <div className="mt-5 space-y-3">
            {notes.slice(0, 3).map((note) => (
              <CompactItem key={note.id} title={note.title} description={note.content} badge={noteVisibilityLabel(note.visibility)} />
            ))}
          </div>
        </SectionCard>

        <SectionCard className="p-4">
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

        <SectionCard className="p-4">
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

      <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <SectionCard className="p-4">
          <SectionTitle icon={Users} title="Vue contacts" description="Les contacts ont leur workspace et restent reliés aux sociétés." />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <ContactSummary label="Contacts principaux" value={primaryContacts.length} />
            <ContactSummary label="Décideurs" value={decisionMakers.length} />
            <ContactSummary label="Départements" value={new Set(contacts.map((contact) => contact.department).filter(Boolean)).size} />
            <ContactSummary label="Langues" value={new Set(contacts.map((contact) => contact.preferredLanguage).filter(Boolean)).size} />
          </div>
        </SectionCard>

        <SectionCard className="p-4">
          <SectionTitle
            icon={MessageSquareText}
            title="Repères de navigation CRM"
            description="Chaque entrée ouvre son propre workspace, avec les liens de contexte conservés."
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <NavigationHint title="Sociétés" description="Comptes, détails et relations commerciales." href="/crm/companies" />
            <NavigationHint title="Contacts" description="Répertoire CRM indépendant avec liens société." href="/crm/contacts" />
            <NavigationHint title="Réunions, tâches et notes" description="Workspaces dédiés pour suivre le contexte relationnel." href="/crm/meetings" />
            <NavigationHint title="Devis et factures" description="Les documents commerciaux restent reliés aux sociétés." href="/sales/quotes" />
          </div>
        </SectionCard>
      </div>

      <SectionCard className="p-4">
        <SectionTitle icon={Building2} title="Sociétés ajoutées récemment" description="Accédez au workspace société pour approfondir." />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {companies.slice(0, 4).map((company) => (
            <Link
              key={company.id}
              href={`/crm/companies/${company.id}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60 transition hover:-translate-y-1 hover:border-hicotech-blue/30 hover:shadow-xl hover:shadow-slate-300/70 focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:bg-slate-900/30 dark:shadow-none dark:hover:bg-hicotech-dark-card"
            >
              <span className="absolute inset-x-0 top-0 h-1 bg-hicotech-blue/80" />
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-hicotech-navy text-sm font-bold text-white dark:bg-hicotech-blue">
                  {company.displayName.slice(0, 2).toUpperCase()}
                </div>
                <ArrowRight size={16} className="mt-1 text-slate-400 transition group-hover:text-hicotech-blue" />
              </div>
              <div className="mt-4 min-w-0">
                <p className="truncate text-base font-bold text-hicotech-navy dark:text-white">{company.displayName}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{company.city ?? "Ville non renseignée"} • {company.status}</p>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </EntityPageLayout>
  );
}

function CrmHero({ data }: { data: CrmHomeSnapshot }) {
  const { companies, contacts, openTasks, quotes, upcomingMeetings } = data;

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-hicotech-navy text-white shadow-[0_20px_58px_rgba(10,30,63,0.24)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <div className="relative p-5 sm:p-7">
          <div className="absolute right-7 top-7 hidden rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-50 backdrop-blur sm:block">
            CRM prêt pour la démo
          </div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-50">
            <ShieldCheck size={14} />
            Carte relationnelle
          </p>
          <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold leading-[1.04] md:text-5xl">
            Construire des relations client qui avancent.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-cyan-50/76">
            Une vue chaleureuse pour voir les sociétés, les interlocuteurs clés, les prochaines conversations et le revenu à défendre avant même d&apos;ouvrir une table.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/crm/companies"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-hicotech-navy shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-cyan-50 focus:outline-none focus:ring-4 focus:ring-white/30"
            >
              Ouvrir les sociétés
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/crm/contacts"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/20"
            >
              Voir les contacts
              <ContactRound size={16} />
            </Link>
          </div>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
            <HeroSignal label="Sociétés suivies" value={String(companies.length)} helper="comptes actifs" />
            <HeroSignal label="Contacts actifs" value={String(contacts.length)} helper="interlocuteurs clés" />
            <HeroSignal label="Priorités" value={String(openTasks.length + upcomingMeetings.length)} helper="actions à suivre" />
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/[0.06] p-5 backdrop-blur xl:border-l xl:border-t-0">
          <div className="rounded-[1.25rem] border border-white/10 bg-white p-4 text-hicotech-navy shadow-xl shadow-black/15">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">Relation du jour</p>
                <h2 className="mt-2 font-display text-2xl font-bold">Qui contacter en priorité</h2>
              </div>
              <span className="grid size-12 place-items-center rounded-2xl bg-hicotech-navy text-white">
                <Activity size={20} />
              </span>
            </div>
            <div className="mt-4 space-y-2.5">
              <HeroPriority icon={FileText} label="Devis récents" value={`${quotes.length} propositions`} />
              <HeroPriority icon={CalendarCheck} label="Réunions à venir" value={`${upcomingMeetings.length} échanges`} />
              <HeroPriority icon={ClipboardList} label="Tâches ouvertes" value={`${openTasks.length} actions`} />
            </div>
            <div className="mt-4 rounded-xl bg-hicotech-sky p-3.5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-hicotech-blue">Signal relationnel</p>
              <p className="mt-2 text-sm font-bold leading-6 text-hicotech-navy">
                {companies.length} société(s), {contacts.length} contact(s) et {quotes.length} devis à suivre depuis les workspaces CRM et Ventes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CrmCommandStrip({ data }: { data: CrmHomeSnapshot }) {
  const { contacts, invoices, openTasks } = data;

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1.15fr]" aria-label="Lecture rapide CRM">
      <CommandTile icon={Sparkles} label="Focus du jour" value={`${openTasks.length} actions`} description="Les tâches et réunions restent visibles avant les listes." />
      <CommandTile icon={Layers3} label="Relation client" value={`${contacts.length} contacts`} description="Les personnes clés restent attachées aux sociétés." />
      <CommandTile icon={Receipt} label="Facturation liée" value={`${invoices.length} factures`} description="Les documents commerciaux restent reliés aux sociétés." />
      <article className="rounded-[1.5rem] border border-hicotech-blue/20 bg-hicotech-sky p-5 shadow-[0_18px_55px_rgba(13,110,253,0.14)]">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-hicotech-blue">Prochaine meilleure lecture</p>
        <h2 className="mt-3 font-display text-xl font-bold text-hicotech-navy">Commencer par les sociétés actives.</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Les contacts, réunions, notes et documents de vente gardent leur contexte sans disperser la navigation.
        </p>
      </article>
    </section>
  );
}

function CommandTile({
  description,
  icon: Icon,
  label,
  value
}: {
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <article className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(10,30,63,0.08)] transition hover:-translate-y-1 hover:border-hicotech-blue/30 hover:shadow-[0_24px_70px_rgba(13,110,253,0.14)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-hicotech-navy text-white transition group-hover:bg-hicotech-blue">
          <Icon size={19} />
        </span>
        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10">
          CRM
        </span>
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.13em] text-slate-400">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>
    </article>
  );
}

function HeroSignal({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-3.5 shadow-md shadow-black/10">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-50/60">{label}</p>
      <p className="mt-1.5 font-display text-xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-cyan-50/65">{helper}</p>
    </div>
  );
}

function HeroPriority({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
      <span className="grid size-10 place-items-center rounded-xl bg-white text-hicotech-blue shadow-sm">
        <Icon size={18} />
      </span>
      <span>
        <span className="block text-sm font-bold text-hicotech-navy">{label}</span>
        <span className="block text-xs font-semibold text-slate-500">{value}</span>
      </span>
    </div>
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
      className="group flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/75 px-3.5 py-3 shadow-sm shadow-slate-200/35 transition duration-200 hover:-translate-y-0.5 hover:border-hicotech-blue/30 hover:bg-white hover:shadow-md hover:shadow-slate-200/60 focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:bg-slate-900/30 dark:shadow-none dark:hover:bg-hicotech-dark-card"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-hicotech-blue shadow-sm ring-1 ring-slate-200 transition group-hover:bg-hicotech-blue group-hover:text-white dark:bg-white/10 dark:ring-white/10">
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-5 text-hicotech-navy dark:text-white">{label}</span>
        <span className="mt-1 block text-xs font-medium leading-5 text-slate-500 dark:text-slate-300">{helper}</span>
      </span>
      <ArrowRight size={15} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-hicotech-blue" />
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
    <article className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm shadow-slate-200/50 transition hover:-translate-y-0.5 hover:border-hicotech-blue/25 hover:shadow-md hover:shadow-slate-200/70 dark:border-hicotech-dark-border dark:bg-slate-900/30 dark:shadow-none dark:hover:bg-hicotech-dark-card">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 dark:border-hicotech-dark-border dark:bg-slate-900/30 dark:shadow-none">
      <p className="font-display text-3xl font-bold text-hicotech-navy dark:text-white">{value}</p>
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
