import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Database,
  FileText,
  Package,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserPlus
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ActivityItem = {
  icon: LucideIcon;
  label: string;
  time: string;
  tone: "blue" | "green" | "purple" | "orange";
};

type EventItem = {
  label: string;
  time: string;
};

type TaskItem = {
  label: string;
  done: boolean;
};

type SystemStatusItem = {
  icon: LucideIcon;
  label: string;
};

const recentActivities: ActivityItem[] = [
  {
    icon: ReceiptText,
    label: "Facture F-2026-154 créée",
    time: "Aujourd'hui — 09:14",
    tone: "blue"
  },
  {
    icon: CheckCircle2,
    label: "Paiement reçu",
    time: "Aujourd'hui — 08:52",
    tone: "green"
  },
  {
    icon: UserPlus,
    label: "Nouveau client ajouté",
    time: "Hier",
    tone: "purple"
  },
  {
    icon: Package,
    label: "Produit modifié",
    time: "Hier",
    tone: "orange"
  },
  {
    icon: FileText,
    label: "Devis envoyé au client",
    time: "Cette semaine",
    tone: "blue"
  }
];

const upcomingEvents: EventItem[] = [
  { label: "Réunion commerciale", time: "09:30" },
  { label: "Livraison prévue", time: "14:00" },
  { label: "Appel fournisseur", time: "16:00" }
];

const tasks: TaskItem[] = [
  { label: "Relancer ABC SARL", done: false },
  { label: "Vérifier les achats", done: true },
  { label: "Préparer devis", done: false },
  { label: "Contrôler le stock", done: false }
];

const systemStatuses: SystemStatusItem[] = [
  { icon: ShieldCheck, label: "Sauvegarde OK" },
  { icon: RefreshCw, label: "Synchronisation active" },
  { icon: Database, label: "Base de données connectée" },
  { icon: Sparkles, label: "Assistant IA disponible" }
];

const activityToneClasses: Record<ActivityItem["tone"], string> = {
  blue: "bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/15 dark:text-blue-100",
  green: "bg-emerald-50 text-hicotech-green dark:bg-emerald-500/15 dark:text-emerald-100",
  purple: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-100",
  orange: "bg-orange-50 text-hicotech-orange dark:bg-orange-500/15 dark:text-orange-100"
};

export function ExecutiveWorkspaceSection() {
  return (
    <section className="space-y-4" aria-labelledby="executive-workspace-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">
            Executive Workspace
          </p>
          <h2 id="executive-workspace-title" className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white">
            Votre espace de pilotage
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">
          Toutes les informations utiles réunies au même endroit.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
        <div className="space-y-4">
          <WorkspaceCard
            title="Activité récente"
            description="Dernières opérations enregistrées."
            index={0}
          >
            <ol className="space-y-0" aria-label="Activité récente">
              {recentActivities.map((activity, index) => (
                <ActivityRow key={`${activity.label}-${activity.time}`} activity={activity} index={index} />
              ))}
            </ol>
          </WorkspaceCard>

          <WorkspaceCard
            title="Agenda"
            description="Les prochains rendez-vous de la journée."
            icon={CalendarDays}
            index={1}
          >
            <div className="grid gap-3 sm:grid-cols-3" aria-label="Agenda du jour">
              {upcomingEvents.map((event, index) => (
                <article
                  key={`${event.label}-${event.time}`}
                  tabIndex={0}
                  aria-label={`${event.label} à ${event.time}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 outline-none transition duration-200 hover:-translate-y-0.5 hover:border-hicotech-blue/30 focus-visible:ring-2 focus-visible:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/45"
                  style={{ animation: "workspace-timeline-in 260ms ease-out both", animationDelay: `${index * 120}ms` }}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-hicotech-navy dark:text-white">
                    <Clock3 size={16} className="text-hicotech-blue" aria-hidden="true" />
                    {event.time}
                  </div>
                  <p className="mt-3 text-sm leading-5 text-slate-600 dark:text-slate-300">
                    {event.label}
                  </p>
                </article>
              ))}
            </div>
          </WorkspaceCard>
        </div>

        <aside className="space-y-4" aria-label="Espace personnel et état système">
          <WorkspaceCard title="Mes tâches" index={2}>
            <ul className="space-y-3" aria-label="Liste des tâches">
              {tasks.map((task) => (
                <li
                  key={task.label}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/45"
                >
                  {task.done ? (
                    <CheckCircle2 size={18} className="shrink-0 text-hicotech-green dark:text-emerald-100" aria-hidden="true" />
                  ) : (
                    <Circle size={18} className="shrink-0 text-slate-400 dark:text-slate-300" aria-hidden="true" />
                  )}
                  <span className={`text-sm font-semibold ${task.done ? "text-slate-400 line-through dark:text-slate-500" : "text-hicotech-navy dark:text-white"}`}>
                    {task.label}
                  </span>
                </li>
              ))}
            </ul>
          </WorkspaceCard>

          <WorkspaceCard title="État du système" index={3}>
            <ul className="space-y-3" aria-label="État du système">
              {systemStatuses.map((status) => (
                <li key={status.label} className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-hicotech-green dark:bg-emerald-500/15 dark:text-emerald-100">
                    <status.icon size={16} aria-hidden="true" />
                  </span>
                  {status.label}
                </li>
              ))}
            </ul>
          </WorkspaceCard>

          <blockquote
            tabIndex={0}
            className="rounded-lg border border-slate-200 bg-white p-5 text-sm italic leading-6 text-slate-600 shadow-sm outline-none transition duration-200 hover:border-hicotech-blue/30 focus-visible:ring-2 focus-visible:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-slate-300"
            style={{ animation: "workspace-card-in 300ms ease-out both", animationDelay: "450ms" }}
          >
            “La meilleure décision est celle prise avec les bonnes données.”
          </blockquote>
        </aside>
      </div>
    </section>
  );
}

function WorkspaceCard({
  title,
  description,
  icon: Icon,
  index,
  children
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  index: number;
  children: ReactNode;
}) {
  return (
    <article
      tabIndex={0}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft outline-none transition duration-200 hover:-translate-y-0.5 hover:border-hicotech-blue/30 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:hover:border-hicotech-blue/50"
      style={{ animation: "workspace-card-in 300ms ease-out both", animationDelay: `${index * 120}ms` }}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">
              {description}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/15 dark:text-blue-100">
            <Icon size={18} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {children}
    </article>
  );
}

function ActivityRow({ activity, index }: { activity: ActivityItem; index: number }) {
  const Icon = activity.icon;

  return (
    <li
      tabIndex={0}
      aria-label={`${activity.label}, ${activity.time}`}
      className="group relative flex gap-4 border-b border-slate-100 py-4 outline-none first:pt-0 last:border-b-0 last:pb-0 focus-visible:ring-2 focus-visible:ring-hicotech-blue/50 dark:border-hicotech-dark-border"
      style={{ animation: "workspace-timeline-in 260ms ease-out both", animationDelay: `${index * 90}ms` }}
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${activityToneClasses[activity.tone]}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-sm font-bold text-hicotech-navy dark:text-white">
          {activity.label}
        </span>
        <span className="mt-1 block text-sm text-slate-500 dark:text-slate-300">
          {activity.time}
        </span>
      </span>
    </li>
  );
}
