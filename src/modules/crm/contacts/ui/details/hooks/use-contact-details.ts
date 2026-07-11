"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { persistCrmSalesRecord } from "@/platform/persistence";
import { PermissionEnforcement } from "@/runtime/permissions";
import { PermissionService } from "@/services/permissions";
import { ActivityService } from "@/modules/crm/activities";
import { crmActivitySeed } from "@/modules/crm/activities/ui/activities.seed";
import { CRM_COMPANIES_WORKSPACE_ID } from "@/modules/crm/companies/ui/companies.seed";
import { crmCompanyLocalService, subscribeToCrmCompanyStore } from "@/modules/crm/companies/ui/company-local-store";
import { MeetingService } from "@/modules/crm/meetings";
import { CRM_MEETINGS_WORKSPACE_ID, CRM_MEETINGS_USER_ID, crmMeetingSeed } from "@/modules/crm/meetings/ui/meetings.seed";
import { NoteService } from "@/modules/crm/notes";
import { CRM_NOTES_WORKSPACE_ID, CRM_NOTES_USER_ID, crmNoteSeed } from "@/modules/crm/notes/ui/notes.seed";
import { TaskService } from "@/modules/crm/tasks";
import { CRM_TASKS_WORKSPACE_ID, CRM_TASKS_USER_ID, crmTaskSeed } from "@/modules/crm/tasks/ui/tasks.seed";
import type { Activity, ActivityPriority, ActivityStatus, ActivityType } from "@/modules/crm/activities";
import type { Company } from "@/modules/crm/companies";
import type { Meeting, MeetingStatus, MeetingType } from "@/modules/crm/meetings";
import type { Note, NoteVisibility } from "@/modules/crm/notes";
import type { Task, TaskPriority, TaskStatus, TaskType } from "@/modules/crm/tasks";
import type { ContactFormState } from "../../hooks/use-company-contacts-workspace";
import { crmContactLocalService, subscribeToCrmContactStore } from "../../contact-local-store";
import type { Contact, ContactId, UpdateContactInput } from "../../../contact.types";
import { CRM_CONTACTS_USER_ID, CRM_CONTACTS_WORKSPACE_ID } from "../../contacts.seed";

export type ContactDetailsTab = "overview" | "opportunities" | "quotes" | "invoices" | "activities" | "meetings" | "tasks" | "emails" | "notes" | "documents" | "settings";

export type ContactActivityFilters = Readonly<{
  query: string;
  type: ActivityType | "all";
  priority: ActivityPriority | "all";
  status: ActivityStatus | "all";
}>;

export type ContactMeetingFilters = Readonly<{
  query: string;
  meetingType: MeetingType | "all";
  status: MeetingStatus | "all";
  sortDirection: "asc" | "desc";
}>;

export type ContactTaskFilters = Readonly<{
  query: string;
  taskType: TaskType | "all";
  priority: TaskPriority | "all";
  status: TaskStatus | "all";
  sortDirection: "asc" | "desc";
}>;

export type ContactNoteFilters = Readonly<{
  query: string;
  visibility: NoteVisibility | "all";
  sortDirection: "asc" | "desc";
}>;

const contactPermissionService = new PermissionService(
  new PermissionEnforcement({
    supportedModules: ["crm.contact"],
    rolePermissions: {
      COMPANY_ADMIN: { "crm.contact": ["read", "write"] },
      SUPER_ADMIN: { "crm.contact": ["read", "write"] },
      SALES: { "crm.contact": ["read", "write"] },
      READ_ONLY: { "crm.contact": ["read"] }
    }
  })
);

const activityPermissionService = new PermissionService(
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

const meetingPermissionService = new PermissionService(
  new PermissionEnforcement({
    supportedModules: ["crm.meeting"],
    rolePermissions: {
      COMPANY_ADMIN: { "crm.meeting": ["read", "write"] },
      SUPER_ADMIN: { "crm.meeting": ["read", "write"] },
      SALES: { "crm.meeting": ["read", "write"] },
      READ_ONLY: { "crm.meeting": ["read"] }
    }
  })
);

const taskPermissionService = new PermissionService(
  new PermissionEnforcement({
    supportedModules: ["crm.task"],
    rolePermissions: {
      COMPANY_ADMIN: { "crm.task": ["read", "write"] },
      SUPER_ADMIN: { "crm.task": ["read", "write"] },
      SALES: { "crm.task": ["read", "write"] },
      READ_ONLY: { "crm.task": ["read"] }
    }
  })
);

const notePermissionService = new PermissionService(
  new PermissionEnforcement({
    supportedModules: ["crm.note"],
    rolePermissions: {
      COMPANY_ADMIN: { "crm.note": ["read", "write"] },
      SUPER_ADMIN: { "crm.note": ["read", "write"] },
      SALES: { "crm.note": ["read", "write"] },
      READ_ONLY: { "crm.note": ["read"] }
    }
  })
);

const emptyContactForm: ContactFormState = {
  firstName: "",
  lastName: "",
  jobTitle: "",
  department: "",
  email: "",
  mobilePhone: "",
  officePhone: "",
  preferredLanguage: "fr",
  timezone: "Africa/Casablanca",
  status: "active",
  isPrimaryContact: false,
  isDecisionMaker: false,
  linkedin: "",
  notes: "",
  tags: ""
};

export function useContactDetails(contactId: string) {
  const [activeTab, setActiveTab] = useState<ContactDetailsTab>("overview");
  const [version, setVersion] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactFormState>(emptyContactForm);
  const [error, setError] = useState<string | null>(null);
  const [activityFilters, setActivityFilters] = useState<ContactActivityFilters>({
    query: "",
    type: "all",
    priority: "all",
    status: "all"
  });
  const [meetingFilters, setMeetingFilters] = useState<ContactMeetingFilters>({
    query: "",
    meetingType: "all",
    status: "all",
    sortDirection: "asc"
  });
  const [taskFilters, setTaskFilters] = useState<ContactTaskFilters>({
    query: "",
    taskType: "all",
    priority: "all",
    status: "all",
    sortDirection: "asc"
  });
  const [noteFilters, setNoteFilters] = useState<ContactNoteFilters>({
    query: "",
    visibility: "all",
    sortDirection: "desc"
  });
  const [contactService] = useState(() => crmContactLocalService);
  const [companyService] = useState(() => crmCompanyLocalService);
  const [activityService] = useState(() => new ActivityService({ seed: crmActivitySeed }));
  const [meetingService] = useState(() => new MeetingService({ seed: crmMeetingSeed }));
  const [noteService] = useState(() => new NoteService({ seed: crmNoteSeed }));
  const [taskService] = useState(() => new TaskService({ seed: crmTaskSeed }));

  const readDecision = useMemo(
    () =>
      contactPermissionService.evaluateRequirement(
        { module: "crm.contact", action: "read" },
        { id: "crm.contact.details", type: "page", module: "crm.contact", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_CONTACTS_WORKSPACE_ID, userId: CRM_CONTACTS_USER_ID }
      ),
    []
  );

  const writeDecision = useMemo(
    () =>
      contactPermissionService.evaluateRequirement(
        { module: "crm.contact", action: "write" },
        { id: "crm.contact.details.write", type: "service", module: "crm.contact", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_CONTACTS_WORKSPACE_ID, userId: CRM_CONTACTS_USER_ID }
      ),
    []
  );

  const activityReadDecision = useMemo(
    () =>
      activityPermissionService.evaluateRequirement(
        { module: "crm.activity", action: "read" },
        { id: "crm.contact.activities", type: "widget", module: "crm.activity", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_CONTACTS_WORKSPACE_ID, userId: CRM_CONTACTS_USER_ID }
      ),
    []
  );

  const meetingReadDecision = useMemo(
    () =>
      meetingPermissionService.evaluateRequirement(
        { module: "crm.meeting", action: "read" },
        { id: "crm.contact.meetings", type: "widget", module: "crm.meeting", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_MEETINGS_WORKSPACE_ID, userId: CRM_MEETINGS_USER_ID }
      ),
    []
  );

  const taskReadDecision = useMemo(
    () =>
      taskPermissionService.evaluateRequirement(
        { module: "crm.task", action: "read" },
        { id: "crm.contact.tasks", type: "widget", module: "crm.task", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_TASKS_WORKSPACE_ID, userId: CRM_TASKS_USER_ID }
      ),
    []
  );

  const noteReadDecision = useMemo(
    () =>
      notePermissionService.evaluateRequirement(
        { module: "crm.note", action: "read" },
        { id: "crm.contact.notes", type: "widget", module: "crm.note", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_NOTES_WORKSPACE_ID, userId: CRM_NOTES_USER_ID }
      ),
    []
  );

  const contact = useMemo(() => {
    void version;
    return contactService.getContact(contactId as ContactId, CRM_CONTACTS_WORKSPACE_ID, readDecision);
  }, [contactId, contactService, readDecision, version]);

  const company = useMemo(
    () => {
      void version;
      return contact ? companyService.getCompany(contact.companyId, CRM_COMPANIES_WORKSPACE_ID, readDecision) : undefined;
    },
    [companyService, contact, readDecision, version]
  );

  useEffect(() => {
    const refresh = () => setVersion((value) => value + 1);
    const unsubscribeContacts = subscribeToCrmContactStore(refresh);
    const unsubscribeCompanies = subscribeToCrmCompanyStore(refresh);
    return () => {
      unsubscribeContacts();
      unsubscribeCompanies();
    };
  }, []);

  const activities = useMemo(() => {
    if (!contact) return [];

    const base = activityService.listActivities({
      workspaceId: CRM_CONTACTS_WORKSPACE_ID,
      contactId: contact.id,
      type: activityFilters.type === "all" ? undefined : activityFilters.type,
      priority: activityFilters.priority === "all" ? undefined : activityFilters.priority,
      status: activityFilters.status === "all" ? undefined : activityFilters.status,
      permission: activityReadDecision
    }).activities;

    if (!activityFilters.query.trim()) return base;

    return activityService.searchActivities({
      workspaceId: CRM_CONTACTS_WORKSPACE_ID,
      contactId: contact.id,
      query: activityFilters.query,
      permission: activityReadDecision
    }).activities.filter((activity) => base.some((item) => item.id === activity.id));
  }, [activityFilters, activityReadDecision, activityService, contact]);

  const meetings = useMemo(() => {
    if (!contact) return [];

    const base = meetingService.listMeetings(
      {
        workspaceId: CRM_MEETINGS_WORKSPACE_ID,
        contactId: contact.id,
        meetingType: meetingFilters.meetingType === "all" ? undefined : meetingFilters.meetingType,
        status: meetingFilters.status === "all" ? undefined : meetingFilters.status,
        includeCancelled: true,
        permission: meetingReadDecision
      },
      { field: "startAt", direction: meetingFilters.sortDirection }
    ).meetings;

    if (!meetingFilters.query.trim()) return base;

    return meetingService.searchMeetings(
      {
        workspaceId: CRM_MEETINGS_WORKSPACE_ID,
        contactId: contact.id,
        query: meetingFilters.query,
        includeCancelled: true,
        permission: meetingReadDecision
      },
      { field: "startAt", direction: meetingFilters.sortDirection }
    ).meetings.filter((meeting) => base.some((item) => item.id === meeting.id));
  }, [contact, meetingFilters, meetingReadDecision, meetingService]);

  const tasks = useMemo(() => {
    if (!contact) return [];

    const base = taskService.listTasks(
      {
        workspaceId: CRM_TASKS_WORKSPACE_ID,
        contactId: contact.id,
        taskType: taskFilters.taskType === "all" ? undefined : taskFilters.taskType,
        priority: taskFilters.priority === "all" ? undefined : taskFilters.priority,
        status: taskFilters.status === "all" ? undefined : taskFilters.status,
        includeCancelled: true,
        permission: taskReadDecision
      },
      { field: "dueDate", direction: taskFilters.sortDirection }
    ).tasks;

    if (!taskFilters.query.trim()) return base;

    return taskService.searchTasks(
      {
        workspaceId: CRM_TASKS_WORKSPACE_ID,
        contactId: contact.id,
        query: taskFilters.query,
        includeCancelled: true,
        permission: taskReadDecision
      },
      { field: "dueDate", direction: taskFilters.sortDirection }
    ).tasks.filter((task) => base.some((item) => item.id === task.id));
  }, [contact, taskFilters, taskReadDecision, taskService]);

  const notes = useMemo(() => {
    if (!contact) return [];

    const base = noteService.listNotes(
      {
        workspaceId: CRM_NOTES_WORKSPACE_ID,
        contactId: contact.id,
        visibility: noteFilters.visibility === "all" ? undefined : noteFilters.visibility,
        permission: noteReadDecision
      },
      { field: "updatedAt", direction: noteFilters.sortDirection }
    ).notes;

    if (!noteFilters.query.trim()) return base;

    return noteService.searchNotes(
      {
        workspaceId: CRM_NOTES_WORKSPACE_ID,
        contactId: contact.id,
        query: noteFilters.query,
        permission: noteReadDecision
      },
      { field: "updatedAt", direction: noteFilters.sortDirection }
    ).notes.filter((note) => base.some((item) => item.id === note.id));
  }, [contact, noteFilters, noteReadDecision, noteService]);

  const summary = useMemo(() => buildContactSummary(activities, meetings, tasks, notes), [activities, meetings, notes, tasks]);

  const openEditDialog = useCallback((contactToEdit: Contact) => {
    setError(null);
    setEditingContact(contactToEdit);
    setForm(contactToForm(contactToEdit));
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingContact(null);
    setError(null);
  }, []);

  const saveContact = useCallback(async () => {
    if (!editingContact) return false;
    const snapshot = contactService.listContacts({ workspaceId: CRM_CONTACTS_WORKSPACE_ID, includeArchived: true }).contacts;

    const input: UpdateContactInput = {
      id: editingContact.id,
      workspaceId: CRM_CONTACTS_WORKSPACE_ID,
      companyId: editingContact.companyId,
      firstName: form.firstName,
      lastName: form.lastName,
      jobTitle: form.jobTitle,
      department: form.department,
      email: form.email,
      mobilePhone: form.mobilePhone,
      officePhone: form.officePhone,
      preferredLanguage: form.preferredLanguage,
      timezone: form.timezone,
      status: form.status,
      isPrimaryContact: form.isPrimaryContact,
      isDecisionMaker: form.isDecisionMaker,
      linkedin: form.linkedin,
      notes: form.notes,
      tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
      ownerId: editingContact.ownerId,
      updatedBy: CRM_CONTACTS_USER_ID,
      permission: writeDecision
    };
    const result = contactService.updateContact(input);

    if (!result.validation.valid || !result.contact) {
      setError(result.validation.issues[0]?.message ?? "Impossible de modifier le contact.");
      return false;
    }

    try {
      await persistCrmSalesRecord("contact", result.contact);
    } catch {
      contactService.replaceContacts(snapshot);
      setError("Les modifications n'ont pas pu être enregistrées dans la base. Vérifiez la connexion puis réessayez.");
      return false;
    }

    setDialogOpen(false);
    setEditingContact(null);
    setVersion((value) => value + 1);
    return true;
  }, [contactService, editingContact, form, writeDecision]);

  return {
    activities,
    activeTab,
    activityFilters,
    canRead: readDecision.allowed,
    canWrite: writeDecision.allowed,
    closeDialog,
    company,
    contact,
    dialogOpen,
    editingContact,
    error,
    form,
    meetingFilters,
    meetings,
    noteFilters,
    notes,
    openEditDialog,
    readDecision,
    saveContact,
    setActiveTab,
    setActivityFilters,
    setForm,
    setMeetingFilters,
    setNoteFilters,
    setTaskFilters,
    summary,
    taskFilters,
    tasks,
    writeDecision
  };
}

function buildContactSummary(activities: readonly Activity[], meetings: readonly Meeting[], tasks: readonly Task[], notes: readonly Note[]) {
  const openActivities = activities.filter((activity) => activity.status === "open").length;
  const emails = activities.filter((activity) => activity.type === "email").length;
  const lastInteraction = activities[0]?.performedAt;

  return {
    openActivities,
    meetings: meetings.length,
    tasks: tasks.filter((task) => task.status !== "completed" && task.status !== "cancelled").length,
    emails,
    notes: notes.length,
    lastInteraction: lastInteraction ? formatDate(lastInteraction) : "Aucune interaction"
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function contactToForm(contact: Contact): ContactFormState {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    jobTitle: contact.jobTitle ?? "",
    department: contact.department ?? "",
    email: contact.email ?? "",
    mobilePhone: contact.mobilePhone ?? "",
    officePhone: contact.officePhone ?? "",
    preferredLanguage: contact.preferredLanguage ?? "fr",
    timezone: contact.timezone ?? "Africa/Casablanca",
    status: contact.status,
    isPrimaryContact: contact.isPrimaryContact,
    isDecisionMaker: contact.isDecisionMaker,
    linkedin: contact.linkedin ?? "",
    notes: contact.notes ?? "",
    tags: contact.tags.join(", ")
  };
}

export type ContactDetailsState = ReturnType<typeof useContactDetails>;
export type ContactDetailsContact = Contact;
export type ContactDetailsCompany = Company | undefined;
