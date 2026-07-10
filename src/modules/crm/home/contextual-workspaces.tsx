import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Activity, ArrowRight, Building2, CalendarCheck, CheckSquare2, ContactRound, FileText, MessageSquareText, UsersRound } from "lucide-react";
import { EntityPageLayout, MetricCard, ProductHero, ProductSectionHeader, SectionCard } from "@/ui";
import { crmActivitySeed } from "../activities/ui/activities.seed";
import type { ActivityPriority, ActivityStatus, ActivityType } from "../activities";
import { crmCompanySeed } from "../companies/ui/companies.seed";
import type { CompanyId } from "../companies";
import { crmContactSeed } from "../contacts/ui/contacts.seed";
import type { ContactId } from "../contacts";
import { crmMeetingSeed } from "../meetings/ui/meetings.seed";
import type { MeetingStatus, MeetingType } from "../meetings";
import { crmNoteSeed } from "../notes/ui/notes.seed";
import type { NoteVisibility } from "../notes";
import { crmTaskSeed } from "../tasks/ui/tasks.seed";
import type { TaskPriority, TaskStatus, TaskType } from "../tasks";

const companyById = new Map(crmCompanySeed.map((company) => [company.id, company]));
const contactById = new Map(crmContactSeed.map((contact) => [contact.id, contact]));

export function CrmContactsWorkspace() {
  const primaryContacts = crmContactSeed.filter((contact) => contact.isPrimaryContact).length;
  const decisionMakers = crmContactSeed.filter((contact) => contact.isDecisionMaker).length;
  const activeContacts = crmContactSeed.filter((contact) => contact.status === "active").length;

  return (
    <WorkspaceFrame
      eyebrow="CRM / Contacts"
      icon={ContactRound}
      title="Tous les interlocuteurs, sans détour."
      subtitle="Les contacts disposent de leur propre espace tout en conservant le lien naturel avec leur société."
      actions={[
        { href: "/crm/companies", icon: Building2, label: "Voir les sociétés" }
      ]}
      signals={[
        { label: "Contacts", value: String(crmContactSeed.length), helper: "interlocuteurs" },
        { label: "Actifs", value: String(activeContacts), helper: "à contacter" },
        { label: "Principaux", value: String(primaryContacts), helper: "référents" },
        { label: "Décideurs", value: String(decisionMakers), helper: "influence achat" }
      ]}
      sectionIcon={UsersRound}
      sectionTitle="Répertoire relationnel"
      sectionDescription="Chaque ligne ouvre le contact attendu, avec sa société accessible en contexte."
    >
      <div className="grid gap-3">
        {crmContactSeed.map((contact) => (
          <ContextRow
            key={contact.id}
            icon={ContactRound}
            title={contact.fullName}
            subtitle={`${contact.jobTitle ?? "Contact"} • ${contact.department ?? "Département non renseigné"}`}
            meta={contact.status === "active" ? "Actif" : contact.status}
            href={`/crm/contacts/${contact.id}`}
            contextHref={`/crm/companies/${contact.companyId}`}
            contextLabel={getCompanyName(contact.companyId)}
          />
        ))}
      </div>
    </WorkspaceFrame>
  );
}

export function CrmActivitiesWorkspace() {
  const open = crmActivitySeed.filter((activity) => activity.status === "open").length;
  const highPriority = crmActivitySeed.filter((activity) => activity.priority === "high").length;
  const withContact = crmActivitySeed.filter((activity) => activity.contactId).length;

  return (
    <WorkspaceFrame
      eyebrow="CRM / Activités"
      icon={Activity}
      title="La timeline CRM a son propre espace."
      subtitle="Les activités s'ouvrent directement depuis la navigation, avec des liens vers les sociétés et contacts concernés."
      actions={[
        { href: "/crm/contacts", icon: ContactRound, label: "Voir les contacts" }
      ]}
      signals={[
        { label: "Activités", value: String(crmActivitySeed.length), helper: "dans la timeline" },
        { label: "Ouvertes", value: String(open), helper: "à suivre" },
        { label: "Prioritaires", value: String(highPriority), helper: "fort impact" },
        { label: "Liées", value: String(withContact), helper: "avec contact" }
      ]}
      sectionIcon={MessageSquareText}
      sectionTitle="Timeline commerciale"
      sectionDescription="Les actions restent visibles sans perdre le contexte société ou contact."
    >
      <div className="grid gap-3">
        {crmActivitySeed.map((activity) => (
          <ContextRow
            key={activity.id}
            icon={activityIcon(activity.type)}
            title={activity.title}
            subtitle={`${activityTypeLabel(activity.type)} • ${formatDateTime(activity.performedAt)} • ${activity.description ?? "Aucune description"}`}
            meta={`${activityStatusLabel(activity.status)} · ${activityPriorityLabel(activity.priority)}`}
            href={activity.contactId ? `/crm/contacts/${activity.contactId}` : `/crm/companies/${activity.companyId}`}
            contextHref={`/crm/companies/${activity.companyId}`}
            contextLabel={getCompanyName(activity.companyId)}
          />
        ))}
      </div>
    </WorkspaceFrame>
  );
}

export function CrmMeetingsWorkspace() {
  const planned = crmMeetingSeed.filter((meeting) => meeting.status === "planned" || meeting.status === "confirmed").length;
  const completed = crmMeetingSeed.filter((meeting) => meeting.status === "completed").length;
  const participants = crmMeetingSeed.reduce((sum, meeting) => sum + meeting.participants.length, 0);

  return (
    <WorkspaceFrame
      eyebrow="CRM / Réunions"
      icon={CalendarCheck}
      title="Les réunions s'ouvrent depuis Réunions."
      subtitle="Le workspace réunit les rendez-vous CRM et garde les chemins naturels vers les contacts et sociétés."
      actions={[
        { href: "/crm/contacts", icon: ContactRound, label: "Voir les contacts" }
      ]}
      signals={[
        { label: "Réunions", value: String(crmMeetingSeed.length), helper: "planifiées ou passées" },
        { label: "À venir", value: String(planned), helper: "à préparer" },
        { label: "Terminées", value: String(completed), helper: "historique" },
        { label: "Participants", value: String(participants), helper: "impliqués" }
      ]}
      sectionIcon={CalendarCheck}
      sectionTitle="Agenda relationnel"
      sectionDescription="Chaque réunion pointe vers le contact principal et la société associée."
    >
      <div className="grid gap-3">
        {crmMeetingSeed.map((meeting) => {
          const contactId = meeting.contactIds[0];
          return (
            <ContextRow
              key={meeting.id}
              icon={CalendarCheck}
              title={meeting.title}
              subtitle={`${meetingTypeLabel(meeting.meetingType)} • ${formatDateTime(meeting.startAt)} • ${meeting.location ?? "Lieu non renseigné"}`}
              meta={meetingStatusLabel(meeting.status)}
              href={contactId ? `/crm/contacts/${contactId}` : `/crm/companies/${meeting.companyId}`}
              contextHref={`/crm/companies/${meeting.companyId}`}
              contextLabel={contactId ? getContactName(contactId) : getCompanyName(meeting.companyId)}
            />
          );
        })}
      </div>
    </WorkspaceFrame>
  );
}

export function CrmTasksWorkspace() {
  const open = crmTaskSeed.filter((task) => task.status !== "completed").length;
  const urgent = crmTaskSeed.filter((task) => task.priority === "urgent" || task.priority === "high").length;
  const completed = crmTaskSeed.filter((task) => task.status === "completed").length;

  return (
    <WorkspaceFrame
      eyebrow="CRM / Tâches"
      icon={CheckSquare2}
      title="Les tâches CRM deviennent prévisibles."
      subtitle="Le menu Tâches ouvre une vue dédiée, avec le contact et la société toujours accessibles."
      actions={[
        { href: "/crm/contacts", icon: ContactRound, label: "Voir les contacts" }
      ]}
      signals={[
        { label: "Tâches", value: String(crmTaskSeed.length), helper: "actions CRM" },
        { label: "Ouvertes", value: String(open), helper: "à traiter" },
        { label: "Prioritaires", value: String(urgent), helper: "fort enjeu" },
        { label: "Terminées", value: String(completed), helper: "réalisées" }
      ]}
      sectionIcon={CheckSquare2}
      sectionTitle="Actions de suivi"
      sectionDescription="Les tâches ne redirigent plus silencieusement vers un contact exemple."
    >
      <div className="grid gap-3">
        {crmTaskSeed.map((task) => (
          <ContextRow
            key={task.id}
            icon={CheckSquare2}
            title={task.title}
            subtitle={`${taskTypeLabel(task.taskType)} • échéance ${formatDateTime(task.dueDate)} • ${task.description ?? "Aucune description"}`}
            meta={`${taskStatusLabel(task.status)} · ${taskPriorityLabel(task.priority)}`}
            href={`/crm/contacts/${task.contactId}`}
            contextHref={`/crm/companies/${task.companyId}`}
            contextLabel={getContactName(task.contactId)}
          />
        ))}
      </div>
    </WorkspaceFrame>
  );
}

export function CrmNotesWorkspace() {
  const teamNotes = crmNoteSeed.filter((note) => note.visibility === "team").length;
  const companyNotes = crmNoteSeed.filter((note) => note.visibility === "company").length;
  const linkedToContact = crmNoteSeed.filter((note) => note.contactId).length;

  return (
    <WorkspaceFrame
      eyebrow="CRM / Notes"
      icon={FileText}
      title="Les notes CRM ont leur propre bibliothèque."
      subtitle="Les notes se consultent directement, avec les liens vers contacts, sociétés, réunions et tâches lorsqu'ils existent."
      actions={[
        { href: "/crm/contacts", icon: ContactRound, label: "Voir les contacts" }
      ]}
      signals={[
        { label: "Notes", value: String(crmNoteSeed.length), helper: "connaissance CRM" },
        { label: "Équipe", value: String(teamNotes), helper: "partagées" },
        { label: "Société", value: String(companyNotes), helper: "visibilité compte" },
        { label: "Liées", value: String(linkedToContact), helper: "avec contact" }
      ]}
      sectionIcon={FileText}
      sectionTitle="Connaissance relationnelle"
      sectionDescription="Les notes gardent leur contexte sans masquer leur workspace dédié."
    >
      <div className="grid gap-3">
        {crmNoteSeed.map((note) => (
          <ContextRow
            key={note.id}
            icon={FileText}
            title={note.title}
            subtitle={`${noteVisibilityLabel(note.visibility)} • ${formatDateTime(note.updatedAt)} • ${note.content}`}
            meta={note.tags.length > 0 ? note.tags.join(", ") : "Sans tag"}
            href={note.contactId ? `/crm/contacts/${note.contactId}` : `/crm/companies/${note.companyId}`}
            contextHref={`/crm/companies/${note.companyId}`}
            contextLabel={note.contactId ? getContactName(note.contactId) : getCompanyName(note.companyId)}
          />
        ))}
      </div>
    </WorkspaceFrame>
  );
}

function WorkspaceFrame({
  actions,
  children,
  eyebrow,
  icon,
  sectionDescription,
  sectionIcon,
  sectionTitle,
  signals,
  subtitle,
  title
}: {
  actions: Parameters<typeof ProductHero>[0]["actions"];
  children: React.ReactNode;
  eyebrow: string;
  icon: LucideIcon;
  sectionDescription: string;
  sectionIcon: LucideIcon;
  sectionTitle: string;
  signals: Parameters<typeof ProductHero>[0]["signals"];
  subtitle: string;
  title: string;
}) {
  return (
    <EntityPageLayout>
      <ProductHero eyebrow={eyebrow} icon={icon} personality="crm" title={title} subtitle={subtitle} actions={actions} signals={signals} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs du workspace CRM">
        {(signals ?? []).map((signal) => (
          <MetricCard key={signal.label} icon={sectionIcon} label={signal.label} value={signal.value} helper={signal.helper} />
        ))}
      </section>
      <SectionCard className="p-4">
        <ProductSectionHeader icon={sectionIcon} title={sectionTitle} description={sectionDescription} />
        <div className="mt-5">{children}</div>
      </SectionCard>
    </EntityPageLayout>
  );
}

function ContextRow({
  contextHref,
  contextLabel,
  href,
  icon: Icon,
  meta,
  subtitle,
  title
}: {
  contextHref: string;
  contextLabel: string;
  href: string;
  icon: LucideIcon;
  meta: string;
  subtitle: string;
  title: string;
}) {
  return (
    <article className="group rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_14px_42px_rgba(10,30,63,0.07)] transition hover:-translate-y-0.5 hover:border-hicotech-blue/30 hover:shadow-[0_20px_60px_rgba(13,110,253,0.12)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-hicotech-sky text-hicotech-blue ring-1 ring-hicotech-blue/10 dark:bg-hicotech-blue/15 dark:text-blue-100">
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <Link href={href} className="font-display text-lg font-bold text-hicotech-navy transition hover:text-hicotech-blue dark:text-white">
              {title}
            </Link>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{subtitle}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link href={contextHref} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200 transition hover:text-hicotech-blue dark:bg-white/10 dark:text-slate-300 dark:ring-white/10">
                <Building2 size={13} />
                {contextLabel}
              </Link>
              <span className="rounded-full bg-hicotech-sky px-2.5 py-1 text-xs font-bold text-hicotech-blue dark:bg-hicotech-blue/15 dark:text-blue-100">{meta}</span>
            </div>
          </div>
        </div>
        <Link href={href} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/60 dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-dark-page">
          Ouvrir
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}

function getCompanyName(companyId: CompanyId) {
  return companyById.get(companyId)?.displayName ?? "Société";
}

function getContactName(contactId: ContactId) {
  return contactById.get(contactId)?.fullName ?? "Contact";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function activityIcon(type: ActivityType) {
  if (type === "meeting") return CalendarCheck;
  if (type === "task") return CheckSquare2;
  if (type === "note") return FileText;
  return Activity;
}

function activityTypeLabel(type: ActivityType) {
  const labels: Record<ActivityType, string> = {
    call: "Appel",
    meeting: "Réunion",
    email: "Email",
    task: "Tâche",
    note: "Note",
    comment: "Commentaire",
    status_change: "Changement de statut",
    document: "Document",
    system: "Système",
    custom: "Personnalisé"
  };
  return labels[type];
}

function activityStatusLabel(status: ActivityStatus) {
  const labels: Record<ActivityStatus, string> = { open: "Ouverte", completed: "Terminée", archived: "Archivée" };
  return labels[status];
}

function activityPriorityLabel(priority: ActivityPriority) {
  const labels: Record<ActivityPriority, string> = { low: "Basse", normal: "Normale", high: "Haute", critical: "Critique" };
  return labels[priority];
}

function meetingTypeLabel(type: MeetingType) {
  const labels: Record<MeetingType, string> = {
    on_site: "Sur site",
    online: "En ligne",
    phone_call: "Téléphone",
    demo: "Démo",
    sales_meeting: "Commerciale",
    internal: "Interne",
    customer_success: "Customer success",
    custom: "Personnalisée"
  };
  return labels[type];
}

function meetingStatusLabel(status: MeetingStatus) {
  const labels: Record<MeetingStatus, string> = { planned: "Planifiée", confirmed: "Confirmée", completed: "Terminée", cancelled: "Annulée" };
  return labels[status];
}

function taskTypeLabel(type: TaskType) {
  const labels: Record<TaskType, string> = {
    follow_up: "Suivi",
    call: "Appel",
    email: "Email",
    reminder: "Relance",
    document: "Document",
    sales: "Vente",
    support: "Support",
    internal: "Interne",
    custom: "Personnalisée"
  };
  return labels[type];
}

function taskStatusLabel(status: TaskStatus) {
  const labels: Record<TaskStatus, string> = { open: "Ouverte", in_progress: "En cours", waiting: "En attente", completed: "Terminée", cancelled: "Annulée" };
  return labels[status];
}

function taskPriorityLabel(priority: TaskPriority) {
  const labels: Record<TaskPriority, string> = { low: "Basse", medium: "Moyenne", high: "Haute", urgent: "Urgente" };
  return labels[priority];
}

function noteVisibilityLabel(visibility: NoteVisibility) {
  const labels: Record<NoteVisibility, string> = { private: "Privée", team: "Équipe", company: "Société" };
  return labels[visibility];
}
