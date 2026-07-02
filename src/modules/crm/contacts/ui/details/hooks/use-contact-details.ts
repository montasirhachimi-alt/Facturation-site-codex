"use client";

import { useMemo, useState } from "react";
import { PermissionEnforcement } from "@/runtime/permissions";
import { PermissionService } from "@/services/permissions";
import { ActivityService } from "@/modules/crm/activities";
import { crmActivitySeed } from "@/modules/crm/activities/ui/activities.seed";
import { CompanyService } from "@/modules/crm/companies";
import { CRM_COMPANIES_WORKSPACE_ID, crmCompanySeed } from "@/modules/crm/companies/ui/companies.seed";
import type { Activity, ActivityPriority, ActivityStatus, ActivityType } from "@/modules/crm/activities";
import type { Company } from "@/modules/crm/companies";
import { ContactService } from "../../../contact.service";
import type { Contact, ContactId } from "../../../contact.types";
import { CRM_CONTACTS_USER_ID, CRM_CONTACTS_WORKSPACE_ID, crmContactSeed } from "../../contacts.seed";

export type ContactDetailsTab = "overview" | "activities" | "meetings" | "emails" | "notes" | "documents" | "settings";

export type ContactActivityFilters = Readonly<{
  query: string;
  type: ActivityType | "all";
  priority: ActivityPriority | "all";
  status: ActivityStatus | "all";
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

export function useContactDetails(contactId: string) {
  const [activeTab, setActiveTab] = useState<ContactDetailsTab>("overview");
  const [activityFilters, setActivityFilters] = useState<ContactActivityFilters>({
    query: "",
    type: "all",
    priority: "all",
    status: "all"
  });
  const [contactService] = useState(() => new ContactService({ seed: crmContactSeed }));
  const [companyService] = useState(() => new CompanyService({ seed: crmCompanySeed }));
  const [activityService] = useState(() => new ActivityService({ seed: crmActivitySeed }));

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

  const contact = useMemo(
    () => contactService.getContact(contactId as ContactId, CRM_CONTACTS_WORKSPACE_ID, readDecision),
    [contactId, contactService, readDecision]
  );

  const company = useMemo(
    () => (contact ? companyService.getCompany(contact.companyId, CRM_COMPANIES_WORKSPACE_ID, readDecision) : undefined),
    [companyService, contact, readDecision]
  );

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

  const summary = useMemo(() => buildContactSummary(activities), [activities]);

  return {
    activities,
    activeTab,
    activityFilters,
    canRead: readDecision.allowed,
    canWrite: writeDecision.allowed,
    company,
    contact,
    readDecision,
    setActiveTab,
    setActivityFilters,
    summary,
    writeDecision
  };
}

function buildContactSummary(activities: readonly Activity[]) {
  const openActivities = activities.filter((activity) => activity.status === "open").length;
  const meetings = activities.filter((activity) => activity.type === "meeting").length;
  const tasks = activities.filter((activity) => activity.type === "task").length;
  const emails = activities.filter((activity) => activity.type === "email").length;
  const notes = activities.filter((activity) => activity.type === "note").length;
  const lastInteraction = activities[0]?.performedAt;

  return {
    openActivities,
    meetings,
    tasks,
    emails,
    notes,
    lastInteraction: lastInteraction ? formatDate(lastInteraction) : "Aucune interaction"
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export type ContactDetailsState = ReturnType<typeof useContactDetails>;
export type ContactDetailsContact = Contact;
export type ContactDetailsCompany = Company | undefined;
