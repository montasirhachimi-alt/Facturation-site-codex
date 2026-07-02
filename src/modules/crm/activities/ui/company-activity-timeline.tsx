"use client";

import { CalendarClock, FileText, Mail, MessageCircle, Phone, Search, Settings, StickyNote } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { PermissionEnforcement } from "@/runtime/permissions";
import { PermissionService } from "@/services/permissions";
import { SectionCard, entityInputClassName } from "@/ui";
import type { CompanyId } from "../../companies/company.types";
import { ActivityService } from "../activity.service";
import type { Activity, ActivityPriority, ActivityStatus, ActivityType } from "../activity.types";
import { CRM_ACTIVITIES_USER_ID, CRM_ACTIVITIES_WORKSPACE_ID, crmActivitySeed } from "./activities.seed";

const permissionService = new PermissionService(
  new PermissionEnforcement({
    supportedModules: ["crm.activity"],
    rolePermissions: {
      COMPANY_ADMIN: { "crm.activity": ["read", "write"] },
      SUPER_ADMIN: { "crm.activity": ["read", "write"] },
      SALES: { "crm.activity": ["read", "write"] },
      READ_ONLY: { "crm.activity": ["read"] }
    }
  })
);

const typeIcons: Record<ActivityType, LucideIcon> = {
  call: Phone,
  meeting: CalendarClock,
  email: Mail,
  task: MessageCircle,
  note: StickyNote,
  comment: MessageCircle,
  status_change: Settings,
  document: FileText,
  system: Settings,
  custom: MessageCircle
};

export function CompanyActivityTimeline({ companyId }: { companyId: CompanyId }) {
  const [service] = useState(() => new ActivityService({ seed: crmActivitySeed }));
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ActivityType | "all">("all");
  const [priority, setPriority] = useState<ActivityPriority | "all">("all");
  const [status, setStatus] = useState<ActivityStatus | "all">("all");

  const readDecision = useMemo(
    () =>
      permissionService.evaluateRequirement(
        { module: "crm.activity", action: "read" },
        { id: "crm.company.timeline", type: "widget", module: "crm.activity", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_ACTIVITIES_WORKSPACE_ID, userId: CRM_ACTIVITIES_USER_ID }
      ),
    []
  );

  const activities = useMemo(() => {
    const base = service.listActivities({
      workspaceId: CRM_ACTIVITIES_WORKSPACE_ID,
      companyId,
      type: type === "all" ? undefined : type,
      priority: priority === "all" ? undefined : priority,
      status: status === "all" ? undefined : status,
      permission: readDecision
    }).activities;

    if (!query.trim()) return base;

    return service.searchActivities({
      workspaceId: CRM_ACTIVITIES_WORKSPACE_ID,
      companyId,
      query,
      permission: readDecision
    }).activities.filter((activity) => base.some((item) => item.id === activity.id));
  }, [companyId, priority, query, readDecision, service, status, type]);

  return (
    <SectionCard className="p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">Timeline</p>
          <h2 className="mt-2 font-display text-lg font-bold text-hicotech-navy dark:text-white">Activity Timeline</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Historique CRM alimenté par le service Activités.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
            <Search size={16} className="text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none dark:text-white" placeholder="Rechercher..." />
          </label>
          <select value={type} onChange={(event) => setType(event.target.value as ActivityType | "all")} className={entityInputClassName}>
            <option value="all">Tous types</option>
            <option value="call">Call</option>
            <option value="meeting">Meeting</option>
            <option value="email">Email</option>
            <option value="task">Task</option>
            <option value="note">Note</option>
            <option value="document">Document</option>
          </select>
          <select value={priority} onChange={(event) => setPriority(event.target.value as ActivityPriority | "all")} className={entityInputClassName}>
            <option value="all">Toutes priorités</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as ActivityStatus | "all")} className={entityInputClassName}>
            <option value="all">Tous statuts</option>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <ol className="mt-5 space-y-0">
        {activities.length > 0 ? (
          activities.map((activity) => <ActivityTimelineItem key={activity.id} activity={activity} />)
        ) : (
          <li className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-sm text-slate-500 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40 dark:text-slate-300">
            Aucune activité ne correspond aux filtres.
          </li>
        )}
      </ol>
    </SectionCard>
  );
}

function ActivityTimelineItem({ activity }: { activity: Activity }) {
  const Icon = typeIcons[activity.type];

  return (
    <li className="flex gap-4 border-b border-slate-100 py-4 first:pt-0 last:border-b-0 last:pb-0 dark:border-hicotech-dark-border">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20 dark:text-blue-100">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{activity.title}</h3>
          <Badge label={activity.type} />
          <Badge label={activity.priority} />
          <Badge label={activity.status} />
        </div>
        {activity.description && <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{activity.description}</p>}
        <p className="mt-2 text-xs font-semibold text-slate-400">
          {activity.performedBy} · {formatDate(activity.performedAt)}
        </p>
      </div>
    </li>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-500 dark:bg-white/10 dark:text-slate-300">{label}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
