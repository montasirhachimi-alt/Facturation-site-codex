"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, Clock, Search, UserRound, XCircle } from "lucide-react";
import { SectionCard, entityInputClassName } from "@/ui";
import type { ContactTaskFilters } from "@/modules/crm/contacts/ui/details/hooks/use-contact-details";
import type { Task, TaskPriority, TaskStatus, TaskType } from "../task.types";

export function ContactTasksPanel({
  filters,
  onFiltersChange,
  tasks
}: {
  filters: ContactTaskFilters;
  onFiltersChange: (filters: ContactTaskFilters) => void;
  tasks: readonly Task[];
}) {
  const now = new Date().toISOString();
  const upcoming = tasks.filter((task) => task.dueDate >= now && task.status !== "completed" && task.status !== "cancelled");
  const overdue = tasks.filter((task) => task.dueDate < now && task.status !== "completed" && task.status !== "cancelled");
  const completed = tasks.filter((task) => task.status === "completed");

  return (
    <SectionCard className="p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">Tasks</p>
          <h2 className="mt-2 font-display text-lg font-bold text-hicotech-navy dark:text-white">Contact Tasks</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Actions de suivi liées au contact, aux réunions et aux futurs workflows.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
            <Search size={16} className="text-slate-400" />
            <input value={filters.query} onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })} className="w-full bg-transparent text-sm outline-none dark:text-white" placeholder="Rechercher..." />
          </label>
          <select value={filters.taskType} onChange={(event) => onFiltersChange({ ...filters, taskType: event.target.value as TaskType | "all" })} className={entityInputClassName}>
            <option value="all">Tous types</option>
            <option value="follow_up">Follow-up</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="reminder">Reminder</option>
            <option value="document">Document</option>
            <option value="sales">Sales</option>
            <option value="support">Support</option>
          </select>
          <select value={filters.priority} onChange={(event) => onFiltersChange({ ...filters, priority: event.target.value as TaskPriority | "all" })} className={entityInputClassName}>
            <option value="all">Toutes priorités</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select value={filters.status} onChange={(event) => onFiltersChange({ ...filters, status: event.target.value as TaskStatus | "all" })} className={entityInputClassName}>
            <option value="all">Tous statuts</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="waiting">Waiting</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <TaskColumn emptyText="Aucune tâche à venir." icon="upcoming" tasks={upcoming} title="Upcoming Tasks" />
        <TaskColumn emptyText="Aucune tâche en retard." icon="overdue" tasks={overdue} title="Overdue Tasks" />
        <TaskColumn emptyText="Aucune tâche terminée." icon="completed" tasks={completed} title="Completed Tasks" />
      </div>
    </SectionCard>
  );
}

function TaskColumn({ emptyText, icon, tasks, title }: { emptyText: string; icon: "upcoming" | "overdue" | "completed"; tasks: readonly Task[]; title: string }) {
  const Icon = icon === "overdue" ? AlertTriangle : icon === "completed" ? CheckCircle2 : CalendarClock;

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/30">
      <div className="flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 font-display text-sm font-bold text-hicotech-navy dark:text-white">
          <Icon size={16} />
          {title}
        </h3>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">{tasks.length}</span>
      </div>
      <div className="mt-4 space-y-3">
        {tasks.length > 0 ? tasks.map((task) => <TaskCard key={task.id} task={task} />) : <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-slate-300">{emptyText}</p>}
      </div>
    </section>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-hicotech-blue/30 hover:shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{task.title}</h4>
          {task.description && <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{task.description}</p>}
        </div>
        <TaskStatusBadge status={task.status} />
      </div>
      <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-500 dark:text-slate-300">
        <span className="inline-flex items-center gap-2">
          <Clock size={15} />
          Due {formatDate(task.dueDate)}
        </span>
        <span className="inline-flex items-center gap-2">
          <UserRound size={15} />
          {task.assignedTo}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <TaskPriorityBadge priority={task.priority} />
        <Badge label={formatTaskType(task.taskType)} />
        {task.meetingId && <Badge label="meeting follow-up" />}
      </div>
    </article>
  );
}

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    open: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200",
    in_progress: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200",
    waiting: "bg-purple-50 text-purple-700 dark:bg-purple-400/10 dark:text-purple-200",
    completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
    cancelled: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200"
  };
  const Icon = status === "cancelled" ? XCircle : status === "completed" ? CheckCircle2 : CalendarClock;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}>
      <Icon size={13} />
      {status.replace("_", " ")}
    </span>
  );
}

function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const styles: Record<TaskPriority, string> = {
    low: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    medium: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200",
    high: "bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-200",
    urgent: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200"
  };

  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${styles[priority]}`}>{priority}</span>;
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-500 dark:bg-white/10 dark:text-slate-300">{label}</span>;
}

function formatTaskType(type: TaskType) {
  return type.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
