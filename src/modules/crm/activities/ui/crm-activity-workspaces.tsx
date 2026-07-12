"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, CalendarCheck, CheckCircle2, FileText, Pencil, Plus, Search, ScrollText } from "lucide-react";
import { persistCrmSalesRecord } from "@/platform/persistence";
import { EntityDialog, EntityHeader, EntityPageLayout, FormActions, FormField, FormSection, SectionCard, entityInputClassName, workspacePrimaryActionClassName, workspaceSecondaryActionClassName } from "@/ui";
import { crmCompanyLocalService, subscribeToCrmCompanyStore } from "@/modules/crm/companies/ui/company-local-store";
import { CRM_COMPANIES_USER_ID, CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import type { Company, CompanyId, UserId } from "@/modules/crm/companies";
import { crmContactLocalService, subscribeToCrmContactStore } from "@/modules/crm/contacts/ui/contact-local-store";
import type { Contact, ContactId } from "@/modules/crm/contacts";
import type { CreateMeetingInput, Meeting, MeetingStatus, MeetingType, UpdateMeetingInput } from "@/modules/crm/meetings";
import { crmMeetingLocalService, notifyCrmMeetingStoreUpdated, subscribeToCrmMeetingStore } from "@/modules/crm/meetings/ui/meeting-local-store";
import type { CreateTaskInput, Task, TaskPriority, TaskStatus, TaskType, UpdateTaskInput } from "@/modules/crm/tasks";
import { crmTaskLocalService, notifyCrmTaskStoreUpdated, subscribeToCrmTaskStore } from "@/modules/crm/tasks/ui/task-local-store";
import type { CreateNoteInput, Note, NoteVisibility, UpdateNoteInput } from "@/modules/crm/notes";
import { crmNoteLocalService, notifyCrmNoteStoreUpdated, subscribeToCrmNoteStore } from "@/modules/crm/notes/ui/note-local-store";

type ActivityScope = Readonly<{
  companyId?: CompanyId;
  contactId?: ContactId;
  embedded?: boolean;
}>;

type ActivityFeedback = Readonly<{
  tone: "success" | "error";
  message: string;
}>;

const workspaceId = CRM_COMPANIES_WORKSPACE_ID;
const currentUserId = CRM_COMPANIES_USER_ID as UserId;

type MeetingForm = {
  companyId: string;
  contactId: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  location: string;
};

type TaskForm = {
  companyId: string;
  contactId: string;
  title: string;
  description: string;
  dueDate: string;
  taskType: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
};

type NoteForm = {
  companyId: string;
  contactId: string;
  title: string;
  content: string;
  visibility: NoteVisibility;
};

const nowLocal = toDateTimeLocal(new Date().toISOString());

const emptyMeetingForm: MeetingForm = {
  companyId: "",
  contactId: "",
  title: "",
  description: "",
  startAt: nowLocal,
  endAt: nowLocal,
  meetingType: "sales_meeting",
  status: "planned",
  location: ""
};

const emptyTaskForm: TaskForm = {
  companyId: "",
  contactId: "",
  title: "",
  description: "",
  dueDate: nowLocal,
  taskType: "follow_up",
  priority: "medium",
  status: "open"
};

const emptyNoteForm: NoteForm = {
  companyId: "",
  contactId: "",
  title: "",
  content: "",
  visibility: "team"
};

export function CrmMeetingsWorkspace(props: ActivityScope = {}) {
  const state = useActivityData(props);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [form, setForm] = useState<MeetingForm>({ ...emptyMeetingForm, companyId: props.companyId ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<ActivityFeedback | null>(null);

  const meetings = useMemo(() => state.meetings.filter((meeting) => {
    if (props.companyId && meeting.companyId !== props.companyId) return false;
    if (props.contactId && !meeting.contactIds.includes(props.contactId)) return false;
    if (!query.trim()) return true;
    const value = `${meeting.title} ${meeting.description ?? ""} ${meeting.location ?? ""}`.toLowerCase();
    return value.includes(query.toLowerCase());
  }), [props.companyId, props.contactId, query, state.meetings]);

  const openCreate = () => {
    setEditing(null);
    setError(null);
    setFeedback(null);
    setForm({ ...emptyMeetingForm, companyId: props.companyId ?? "", contactId: props.contactId ?? "" });
    setDialogOpen(true);
  };

  const openEdit = (meeting: Meeting) => {
    setEditing(meeting);
    setError(null);
    setFeedback(null);
    setForm({
      companyId: meeting.companyId,
      contactId: meeting.contactIds[0] ?? "",
      title: meeting.title,
      description: meeting.description ?? "",
      startAt: toDateTimeLocal(meeting.startAt),
      endAt: toDateTimeLocal(meeting.endAt),
      meetingType: meeting.meetingType,
      status: meeting.status,
      location: meeting.location ?? ""
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (saving) return false;
    if (!form.companyId) {
      setError("Sélectionnez une société.");
      return false;
    }
    const snapshot = crmMeetingLocalService.listMeetings({ workspaceId, includeCancelled: true }).meetings;
    const base = {
      workspaceId,
      companyId: form.companyId as CompanyId,
      contactIds: form.contactId ? [form.contactId as ContactId] : [],
      title: form.title,
      description: form.description,
      location: form.location,
      meetingType: form.meetingType,
      status: form.status,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      organizerId: currentUserId,
      participants: createParticipants(form.contactId, state.contacts),
      tags: []
    };
    const result = editing
      ? crmMeetingLocalService.updateMeeting({ ...base, id: editing.id } satisfies UpdateMeetingInput)
      : crmMeetingLocalService.createMeeting(base satisfies CreateMeetingInput);
    if (!result.validation.valid || !result.meeting) {
      setError(result.validation.issues[0]?.message ?? "Impossible d'enregistrer la réunion.");
      return false;
    }
    setSaving(true);
    try {
      await persistCrmSalesRecord("meeting", result.meeting);
    } catch {
      crmMeetingLocalService.replaceMeetings(snapshot);
      setError("La réunion n'a pas pu être enregistrée dans la base. Vérifiez la connexion puis réessayez.");
      setSaving(false);
      return false;
    }
    notifyCrmMeetingStoreUpdated();
    setDialogOpen(false);
    setFeedback({ tone: "success", message: editing ? "Réunion enregistrée." : "Réunion créée." });
    setSaving(false);
    return true;
  };

  const cancel = async (meeting: Meeting) => {
    const snapshot = crmMeetingLocalService.listMeetings({ workspaceId, includeCancelled: true }).meetings;
    const result = crmMeetingLocalService.cancelMeeting(meeting.id, workspaceId);
    if (!result.meeting) return;
    try {
      await persistCrmSalesRecord("meeting", result.meeting);
      notifyCrmMeetingStoreUpdated();
      setFeedback({ tone: "success", message: "Réunion annulée." });
    } catch {
      crmMeetingLocalService.replaceMeetings(snapshot);
      notifyCrmMeetingStoreUpdated();
      setFeedback({ tone: "error", message: "La réunion n'a pas pu être annulée. Réessayez." });
    }
  };

  return (
    <ActivityShell
      embedded={props.embedded}
      eyebrow="CRM"
      title={props.embedded ? "Réunions" : "Réunions CRM"}
      description="Rendez-vous persistés et reliés aux sociétés et contacts."
      icon={CalendarCheck}
      actionLabel="Nouvelle réunion"
      query={query}
      setQuery={setQuery}
      onCreate={openCreate}
      feedback={feedback}
    >
      <div className="grid gap-3">
        {meetings.length > 0 ? meetings.map((meeting) => (
          <ActivityCard
            key={meeting.id}
            title={meeting.title}
            meta={`${companyName(meeting.companyId, state.companies)} · ${formatDate(meeting.startAt)}`}
            description={meeting.description ?? meeting.location ?? "Réunion CRM"}
            status={meeting.status}
            onEdit={() => openEdit(meeting)}
            onArchive={() => cancel(meeting)}
            archiveLabel="Annuler"
          />
        )) : <EmptyActivity label="Aucune réunion réelle pour ce contexte." />}
      </div>
      <MeetingDialog
        contacts={state.contacts}
        companies={state.companies}
        embeddedCompanyId={props.companyId}
        error={error}
        form={form}
        onChange={setForm}
        onClose={() => setDialogOpen(false)}
        onSubmit={save}
        open={dialogOpen}
        saving={saving}
        title={editing ? "Modifier la réunion" : "Nouvelle réunion"}
      />
    </ActivityShell>
  );
}

export function CrmTasksWorkspace(props: ActivityScope = {}) {
  const state = useActivityData(props);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskForm>({ ...emptyTaskForm, companyId: props.companyId ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<ActivityFeedback | null>(null);

  const tasks = useMemo(() => state.tasks.filter((task) => {
    if (props.companyId && task.companyId !== props.companyId) return false;
    if (props.contactId && task.contactId !== props.contactId) return false;
    if (!query.trim()) return true;
    const value = `${task.title} ${task.description ?? ""}`.toLowerCase();
    return value.includes(query.toLowerCase());
  }), [props.companyId, props.contactId, query, state.tasks]);

  const openCreate = () => {
    setEditing(null);
    setError(null);
    setFeedback(null);
    setForm({ ...emptyTaskForm, companyId: props.companyId ?? "", contactId: props.contactId ?? "" });
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setError(null);
    setFeedback(null);
    setForm({
      companyId: task.companyId,
      contactId: task.contactId ?? "",
      title: task.title,
      description: task.description ?? "",
      dueDate: toDateTimeLocal(task.dueDate),
      taskType: task.taskType,
      priority: task.priority,
      status: task.status
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (saving) return false;
    if (!form.companyId) {
      setError("Sélectionnez une société.");
      return false;
    }
    const snapshot = crmTaskLocalService.listTasks({ workspaceId, includeCancelled: true }).tasks;
    const base = {
      workspaceId,
      companyId: form.companyId as CompanyId,
      contactId: form.contactId ? form.contactId as ContactId : undefined,
      title: form.title,
      description: form.description,
      taskType: form.taskType,
      priority: form.priority,
      status: form.status,
      assignedTo: currentUserId,
      dueDate: new Date(form.dueDate).toISOString(),
      tags: []
    };
    const result = editing
      ? crmTaskLocalService.updateTask({ ...base, id: editing.id } satisfies UpdateTaskInput)
      : crmTaskLocalService.createTask(base satisfies CreateTaskInput);
    if (!result.validation.valid || !result.task) {
      setError(result.validation.issues[0]?.message ?? "Impossible d'enregistrer la tâche.");
      return false;
    }
    setSaving(true);
    try {
      await persistCrmSalesRecord("task", result.task);
    } catch {
      crmTaskLocalService.replaceTasks(snapshot);
      setError("La tâche n'a pas pu être enregistrée dans la base. Vérifiez la connexion puis réessayez.");
      setSaving(false);
      return false;
    }
    notifyCrmTaskStoreUpdated();
    setDialogOpen(false);
    setFeedback({ tone: "success", message: editing ? "Tâche enregistrée." : "Tâche créée." });
    setSaving(false);
    return true;
  };

  const complete = async (task: Task) => {
    const snapshot = crmTaskLocalService.listTasks({ workspaceId, includeCancelled: true }).tasks;
    const result = crmTaskLocalService.completeTask(task.id, workspaceId);
    if (!result.task) return;
    try {
      await persistCrmSalesRecord("task", result.task);
      notifyCrmTaskStoreUpdated();
      setFeedback({ tone: "success", message: "Tâche terminée." });
    } catch {
      crmTaskLocalService.replaceTasks(snapshot);
      notifyCrmTaskStoreUpdated();
      setFeedback({ tone: "error", message: "La tâche n'a pas pu être terminée. Réessayez." });
    }
  };

  return (
    <ActivityShell
      embedded={props.embedded}
      eyebrow="CRM"
      title={props.embedded ? "Tâches" : "Tâches CRM"}
      description="Actions persistées, reliées à une société et optionnellement à un contact."
      icon={ScrollText}
      actionLabel="Nouvelle tâche"
      query={query}
      setQuery={setQuery}
      onCreate={openCreate}
      feedback={feedback}
    >
      <div className="grid gap-3">
        {tasks.length > 0 ? tasks.map((task) => (
          <ActivityCard
            key={task.id}
            title={task.title}
            meta={`${companyName(task.companyId, state.companies)} · ${formatDate(task.dueDate)}`}
            description={task.description ?? `Priorité ${task.priority}`}
            status={task.status}
            onEdit={() => openEdit(task)}
            onArchive={() => complete(task)}
            archiveLabel="Terminer"
          />
        )) : <EmptyActivity label="Aucune tâche réelle pour ce contexte." />}
      </div>
      <TaskDialog
        contacts={state.contacts}
        companies={state.companies}
        embeddedCompanyId={props.companyId}
        error={error}
        form={form}
        onChange={setForm}
        onClose={() => setDialogOpen(false)}
        onSubmit={save}
        open={dialogOpen}
        saving={saving}
        title={editing ? "Modifier la tâche" : "Nouvelle tâche"}
      />
    </ActivityShell>
  );
}

export function CrmNotesWorkspace(props: ActivityScope = {}) {
  const state = useActivityData(props);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState<NoteForm>({ ...emptyNoteForm, companyId: props.companyId ?? "", contactId: props.contactId ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<ActivityFeedback | null>(null);

  const notes = useMemo(() => state.notes.filter((note) => {
    if (props.companyId && note.companyId !== props.companyId) return false;
    if (props.contactId && note.contactId !== props.contactId) return false;
    if (!query.trim()) return true;
    const value = `${note.title} ${note.content}`.toLowerCase();
    return value.includes(query.toLowerCase());
  }), [props.companyId, props.contactId, query, state.notes]);

  const openCreate = () => {
    setEditing(null);
    setError(null);
    setFeedback(null);
    setForm({ ...emptyNoteForm, companyId: props.companyId ?? "", contactId: props.contactId ?? "" });
    setDialogOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setError(null);
    setFeedback(null);
    setForm({
      companyId: note.companyId,
      contactId: note.contactId ?? "",
      title: note.title,
      content: note.content,
      visibility: note.visibility
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (saving) return false;
    if (!form.companyId) {
      setError("Sélectionnez une société.");
      return false;
    }
    const snapshot = crmNoteLocalService.listNotes({ workspaceId, includeArchived: true }).notes;
    const base = {
      workspaceId,
      companyId: form.companyId as CompanyId,
      contactId: form.contactId ? form.contactId as ContactId : undefined,
      title: form.title,
      content: form.content,
      visibility: form.visibility,
      authorId: currentUserId,
      tags: [],
      attachments: []
    };
    const result = editing
      ? crmNoteLocalService.updateNote({ ...base, id: editing.id } satisfies UpdateNoteInput)
      : crmNoteLocalService.createNote(base satisfies CreateNoteInput);
    if (!result.validation.valid || !result.note) {
      setError(result.validation.issues[0]?.message ?? "Impossible d'enregistrer la note.");
      return false;
    }
    setSaving(true);
    try {
      await persistCrmSalesRecord("note", result.note);
    } catch {
      crmNoteLocalService.replaceNotes(snapshot);
      setError("La note n'a pas pu être enregistrée dans la base. Vérifiez la connexion puis réessayez.");
      setSaving(false);
      return false;
    }
    notifyCrmNoteStoreUpdated();
    setDialogOpen(false);
    setFeedback({ tone: "success", message: "Note enregistrée." });
    setSaving(false);
    return true;
  };

  const archive = async (note: Note) => {
    const snapshot = crmNoteLocalService.listNotes({ workspaceId, includeArchived: true }).notes;
    const result = crmNoteLocalService.archiveNote(note.id, workspaceId);
    if (!result.note) return;
    try {
      await persistCrmSalesRecord("note", result.note);
      notifyCrmNoteStoreUpdated();
      setFeedback({ tone: "success", message: "Note archivée." });
    } catch {
      crmNoteLocalService.replaceNotes(snapshot);
      notifyCrmNoteStoreUpdated();
      setFeedback({ tone: "error", message: "La note n'a pas pu être archivée. Réessayez." });
    }
  };

  return (
    <ActivityShell
      embedded={props.embedded}
      eyebrow="CRM"
      title={props.embedded ? "Notes" : "Notes CRM"}
      description="Notes réelles et persistées pour conserver le contexte relationnel."
      icon={FileText}
      actionLabel="Ajouter une note"
      query={query}
      setQuery={setQuery}
      onCreate={openCreate}
      feedback={feedback}
    >
      <div className="grid gap-3">
        {notes.length > 0 ? notes.map((note) => (
          <ActivityCard
            key={note.id}
            title={note.title}
            meta={`${companyName(note.companyId, state.companies)} · ${formatDate(note.updatedAt)}`}
            description={note.content}
            status={note.visibility}
            onEdit={() => openEdit(note)}
            onArchive={() => archive(note)}
            archiveLabel="Archiver"
          />
        )) : <EmptyActivity label="Aucune note réelle pour ce contexte." />}
      </div>
      <NoteDialog
        contacts={state.contacts}
        companies={state.companies}
        embeddedCompanyId={props.companyId}
        error={error}
        form={form}
        onChange={setForm}
        onClose={() => setDialogOpen(false)}
        onSubmit={save}
        open={dialogOpen}
        saving={saving}
        title={editing ? "Modifier la note" : "Ajouter une note"}
      />
    </ActivityShell>
  );
}

function useActivityData(scope: ActivityScope) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    const unsubscribers = [
      subscribeToCrmCompanyStore(refresh),
      subscribeToCrmContactStore(refresh),
      subscribeToCrmMeetingStore(refresh),
      subscribeToCrmTaskStore(refresh),
      subscribeToCrmNoteStore(refresh)
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  return useMemo(() => {
    void version;
    const companies = crmCompanyLocalService.listCompanies({ workspaceId, includeArchived: false }).companies;
    const contacts = crmContactLocalService.listContacts({ workspaceId, includeArchived: false }).contacts;
    return {
      companies,
      contacts: scope.companyId ? contacts.filter((contact) => contact.companyId === scope.companyId) : contacts,
      meetings: crmMeetingLocalService.listMeetings({ workspaceId, includeCancelled: false }).meetings,
      tasks: crmTaskLocalService.listTasks({ workspaceId, includeCancelled: false }).tasks,
      notes: crmNoteLocalService.listNotes({ workspaceId, includeArchived: false }).notes
    };
  }, [scope.companyId, version]);
}

function ActivityShell({
  actionLabel,
  children,
  description,
  embedded,
  eyebrow,
  feedback,
  icon: Icon,
  onCreate,
  query,
  setQuery,
  title
}: {
  actionLabel: string;
  children: React.ReactNode;
  description: string;
  embedded?: boolean;
  eyebrow: string;
  feedback?: ActivityFeedback | null;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onCreate: () => void;
  query: string;
  setQuery: (query: string) => void;
  title: string;
}) {
  const content = (
    <SectionCard className={embedded ? "p-4" : "p-5"}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-hicotech-navy text-white dark:bg-hicotech-blue">
            <Icon size={20} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">{eyebrow}</p>
            <h2 className="mt-1 font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{description}</p>
          </div>
        </div>
        <button type="button" onClick={onCreate} className={workspacePrimaryActionClassName}>
          <Plus size={16} />
          {actionLabel}
        </button>
      </div>
      <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
        <Search size={16} className="text-slate-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent font-semibold outline-none dark:text-white" placeholder="Rechercher..." />
      </label>
      {feedback && (
        <p
          role={feedback.tone === "error" ? "alert" : "status"}
          className={`mt-3 rounded-xl border px-3 py-2 text-sm font-semibold ${
            feedback.tone === "error"
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
          }`}
        >
          {feedback.message}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </SectionCard>
  );

  if (embedded) return content;

  return (
    <EntityPageLayout>
      <EntityHeader breadcrumb={["CRM", title]} title={title} description={description} />
      {content}
    </EntityPageLayout>
  );
}

function ActivityCard({
  archiveLabel,
  description,
  meta,
  onArchive,
  onEdit,
  status,
  title
}: {
  archiveLabel: string;
  description: string;
  meta: string;
  onArchive: () => void;
  onEdit: () => void;
  status: string;
  title: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-hicotech-blue/30 hover:shadow-md dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{title}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">{meta}</p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-200">{status}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className={workspaceSecondaryActionClassName}>
          <Pencil size={15} />
          Modifier
        </button>
        <button type="button" onClick={onArchive} className={workspaceSecondaryActionClassName}>
          {archiveLabel === "Terminer" ? <CheckCircle2 size={15} /> : <Archive size={15} />}
          {archiveLabel}
        </button>
      </div>
    </article>
  );
}

function MeetingDialog(props: {
  companies: readonly Company[];
  contacts: readonly Contact[];
  embeddedCompanyId?: CompanyId;
  error: string | null;
  form: MeetingForm;
  onChange: (form: MeetingForm) => void;
  onClose: () => void;
  onSubmit: () => Promise<boolean>;
  open: boolean;
  saving: boolean;
  title: string;
}) {
  const contacts = props.contacts.filter((contact) => !props.form.companyId || contact.companyId === props.form.companyId);
  return (
    <EntityDialog eyebrow="Réunion CRM" title={props.title} description="Planifiez un échange rattaché à une société." error={props.error} open={props.open} onClose={props.onClose} onSubmit={props.onSubmit} size="lg" footer={<FormActions onCancel={props.onClose} submitBusy={props.saving} submitLabel="Enregistrer" busyLabel="Enregistrement..." />}>
      <FormSection title="Informations réunion">
        <FormField label="Société" required><CompanySelect disabled={Boolean(props.embeddedCompanyId)} value={props.form.companyId} companies={props.companies} onChange={(companyId) => props.onChange({ ...props.form, companyId, contactId: "" })} /></FormField>
        <FormField label="Contact"><ContactSelect value={props.form.contactId} contacts={contacts} onChange={(contactId) => props.onChange({ ...props.form, contactId })} /></FormField>
        <FormField label="Titre" required><input className={entityInputClassName} value={props.form.title} onChange={(event) => props.onChange({ ...props.form, title: event.target.value })} /></FormField>
        <FormField label="Lieu"><input className={entityInputClassName} value={props.form.location} onChange={(event) => props.onChange({ ...props.form, location: event.target.value })} /></FormField>
        <FormField label="Début" required><input type="datetime-local" className={entityInputClassName} value={props.form.startAt} onChange={(event) => props.onChange({ ...props.form, startAt: event.target.value })} /></FormField>
        <FormField label="Fin" required><input type="datetime-local" className={entityInputClassName} value={props.form.endAt} onChange={(event) => props.onChange({ ...props.form, endAt: event.target.value })} /></FormField>
        <FormField label="Type"><select className={entityInputClassName} value={props.form.meetingType} onChange={(event) => props.onChange({ ...props.form, meetingType: event.target.value as MeetingType })}><option value="sales_meeting">Commerciale</option><option value="online">En ligne</option><option value="on_site">Sur site</option><option value="phone_call">Téléphone</option><option value="demo">Démonstration</option></select></FormField>
        <FormField label="Statut"><select className={entityInputClassName} value={props.form.status} onChange={(event) => props.onChange({ ...props.form, status: event.target.value as MeetingStatus })}><option value="planned">Planifiée</option><option value="confirmed">Confirmée</option><option value="completed">Terminée</option><option value="cancelled">Annulée</option></select></FormField>
        <FormField label="Agenda"><textarea className={`${entityInputClassName} md:col-span-2`} value={props.form.description} onChange={(event) => props.onChange({ ...props.form, description: event.target.value })} /></FormField>
      </FormSection>
    </EntityDialog>
  );
}

function TaskDialog(props: {
  companies: readonly Company[];
  contacts: readonly Contact[];
  embeddedCompanyId?: CompanyId;
  error: string | null;
  form: TaskForm;
  onChange: (form: TaskForm) => void;
  onClose: () => void;
  onSubmit: () => Promise<boolean>;
  open: boolean;
  saving: boolean;
  title: string;
}) {
  const contacts = props.contacts.filter((contact) => !props.form.companyId || contact.companyId === props.form.companyId);
  return (
    <EntityDialog eyebrow="Tâche CRM" title={props.title} description="Créez une action de suivi liée à une société." error={props.error} open={props.open} onClose={props.onClose} onSubmit={props.onSubmit} size="lg" footer={<FormActions onCancel={props.onClose} submitBusy={props.saving} submitLabel="Enregistrer" busyLabel="Enregistrement..." />}>
      <FormSection title="Action à réaliser">
        <FormField label="Société" required><CompanySelect disabled={Boolean(props.embeddedCompanyId)} value={props.form.companyId} companies={props.companies} onChange={(companyId) => props.onChange({ ...props.form, companyId, contactId: "" })} /></FormField>
        <FormField label="Contact"><ContactSelect value={props.form.contactId} contacts={contacts} onChange={(contactId) => props.onChange({ ...props.form, contactId })} /></FormField>
        <FormField label="Titre" required><input className={entityInputClassName} value={props.form.title} onChange={(event) => props.onChange({ ...props.form, title: event.target.value })} /></FormField>
        <FormField label="Échéance" required><input type="datetime-local" className={entityInputClassName} value={props.form.dueDate} onChange={(event) => props.onChange({ ...props.form, dueDate: event.target.value })} /></FormField>
        <FormField label="Type"><select className={entityInputClassName} value={props.form.taskType} onChange={(event) => props.onChange({ ...props.form, taskType: event.target.value as TaskType })}><option value="follow_up">Suivi</option><option value="call">Appel</option><option value="email">Email</option><option value="document">Document</option><option value="sales">Vente</option><option value="support">Support</option></select></FormField>
        <FormField label="Priorité"><select className={entityInputClassName} value={props.form.priority} onChange={(event) => props.onChange({ ...props.form, priority: event.target.value as TaskPriority })}><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></FormField>
        <FormField label="Statut"><select className={entityInputClassName} value={props.form.status} onChange={(event) => props.onChange({ ...props.form, status: event.target.value as TaskStatus })}><option value="open">Ouverte</option><option value="in_progress">En cours</option><option value="waiting">En attente</option><option value="completed">Terminée</option></select></FormField>
        <FormField label="Description"><textarea className={entityInputClassName} value={props.form.description} onChange={(event) => props.onChange({ ...props.form, description: event.target.value })} /></FormField>
      </FormSection>
    </EntityDialog>
  );
}

function NoteDialog(props: {
  companies: readonly Company[];
  contacts: readonly Contact[];
  embeddedCompanyId?: CompanyId;
  error: string | null;
  form: NoteForm;
  onChange: (form: NoteForm) => void;
  onClose: () => void;
  onSubmit: () => Promise<boolean>;
  open: boolean;
  saving: boolean;
  title: string;
}) {
  const contacts = props.contacts.filter((contact) => !props.form.companyId || contact.companyId === props.form.companyId);
  return (
    <EntityDialog eyebrow="Note CRM" title={props.title} description="Ajoutez un contexte utile sur une société ou un contact." error={props.error} open={props.open} onClose={props.onClose} onSubmit={props.onSubmit} size="md" footer={<FormActions onCancel={props.onClose} submitBusy={props.saving} submitLabel="Enregistrer" busyLabel="Enregistrement..." />}>
      <FormSection title="Contenu">
        <FormField label="Société" required><CompanySelect disabled={Boolean(props.embeddedCompanyId)} value={props.form.companyId} companies={props.companies} onChange={(companyId) => props.onChange({ ...props.form, companyId, contactId: "" })} /></FormField>
        <FormField label="Contact"><ContactSelect value={props.form.contactId} contacts={contacts} onChange={(contactId) => props.onChange({ ...props.form, contactId })} /></FormField>
        <FormField label="Titre" required><input className={entityInputClassName} value={props.form.title} onChange={(event) => props.onChange({ ...props.form, title: event.target.value })} /></FormField>
        <FormField label="Visibilité"><select className={entityInputClassName} value={props.form.visibility} onChange={(event) => props.onChange({ ...props.form, visibility: event.target.value as NoteVisibility })}><option value="team">Équipe</option><option value="private">Privée</option><option value="company">Société</option></select></FormField>
        <FormField label="Note" required><textarea className={`${entityInputClassName} min-h-32 md:col-span-2`} value={props.form.content} onChange={(event) => props.onChange({ ...props.form, content: event.target.value })} /></FormField>
      </FormSection>
    </EntityDialog>
  );
}

function CompanySelect({ companies, disabled, onChange, value }: { companies: readonly Company[]; disabled?: boolean; onChange: (value: string) => void; value: string }) {
  return (
    <select className={entityInputClassName} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Sélectionner une société</option>
      {companies.map((company) => <option key={company.id} value={company.id}>{company.displayName}</option>)}
    </select>
  );
}

function ContactSelect({ contacts, onChange, value }: { contacts: readonly Contact[]; onChange: (value: string) => void; value: string }) {
  return (
    <select className={entityInputClassName} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Aucun contact</option>
      {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.fullName}</option>)}
    </select>
  );
}

function EmptyActivity({ label }: { label: string }) {
  return <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40 dark:text-slate-300">{label}</p>;
}

function createParticipants(contactId: string, contacts: readonly Contact[]) {
  if (!contactId) return [];
  const contact = contacts.find((item) => item.id === contactId);
  return contact ? [{ id: contact.id, name: contact.fullName, email: contact.email, role: contact.role ?? contact.jobTitle }] : [];
}

function companyName(companyId: CompanyId, companies: readonly Company[]) {
  return companies.find((company) => company.id === companyId)?.displayName ?? "Société";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
