"use client";

import { useCallback, useMemo, useState } from "react";
import { PermissionEnforcement } from "@/runtime/permissions";
import { PermissionService } from "@/services/permissions";
import { paginateCrmItems, searchCrmEntities, sortCrmEntities } from "@/modules/crm/shared";
import { CRM_CONTACTS_USER_ID, CRM_CONTACTS_WORKSPACE_ID, crmContactSeed } from "../contacts.seed";
import { ContactService } from "../../contact.service";
import type { Contact, ContactId, ContactSortField, ContactStatus, CreateContactInput, UpdateContactInput } from "../../contact.types";
import type { CompanyId } from "../../../companies/company.types";

export type ContactSortKey = "fullName" | "jobTitle" | "department" | "email" | "mobilePhone" | "status" | "updatedAt";
export type BooleanFilter = "all" | "yes" | "no";

export type ContactFormState = Readonly<{
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  email: string;
  mobilePhone: string;
  officePhone: string;
  preferredLanguage: string;
  timezone: string;
  status: ContactStatus;
  isPrimaryContact: boolean;
  isDecisionMaker: boolean;
  linkedin: string;
  notes: string;
  tags: string;
}>;

const emptyForm: ContactFormState = {
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

const permissionService = new PermissionService(
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

export function useCompanyContactsWorkspace(companyId: CompanyId) {
  const [service] = useState(() => new ContactService({ seed: crmContactSeed }));
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ContactStatus | "all">("all");
  const [department, setDepartment] = useState("all");
  const [primary, setPrimary] = useState<BooleanFilter>("all");
  const [decisionMaker, setDecisionMaker] = useState<BooleanFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [selectedIds, setSelectedIds] = useState<readonly ContactId[]>([]);
  const [sort, setSort] = useState<Readonly<{ field: ContactSortKey; direction: "asc" | "desc" }>>({ field: "updatedAt", direction: "desc" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const readDecision = useMemo(
    () =>
      permissionService.evaluateRequirement(
        { module: "crm.contact", action: "read" },
        { id: "crm.company.contacts", type: "widget", module: "crm.contact", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_CONTACTS_WORKSPACE_ID, userId: CRM_CONTACTS_USER_ID }
      ),
    []
  );

  const writeDecision = useMemo(
    () =>
      permissionService.evaluateRequirement(
        { module: "crm.contact", action: "write" },
        { id: "crm.company.contacts.write", type: "service", module: "crm.contact", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_CONTACTS_WORKSPACE_ID, userId: CRM_CONTACTS_USER_ID }
      ),
    []
  );

  const baseContacts = useMemo(() => {
    void version;
    return service.getContactsByCompany(companyId, CRM_CONTACTS_WORKSPACE_ID, readDecision).contacts;
  }, [companyId, readDecision, service, version]);

  const departmentOptions = useMemo(() => ["all", ...Array.from(new Set(baseContacts.map((contact) => contact.department).filter(Boolean) as string[])).sort()], [baseContacts]);

  const filteredContacts = useMemo(() => {
    const filtered = baseContacts.filter((contact) => {
      if (status !== "all" && contact.status !== status) return false;
      if (department !== "all" && contact.department !== department) return false;
      if (primary !== "all" && contact.isPrimaryContact !== (primary === "yes")) return false;
      if (decisionMaker !== "all" && contact.isDecisionMaker !== (decisionMaker === "yes")) return false;
      return true;
    });

    if (!query.trim()) return filtered;

    return searchCrmEntities(filtered, {
      query,
      fields: ["fullName", "firstName", "lastName", "jobTitle", "department", "email", "mobilePhone", "status"]
    }).map((match) => match.entity);
  }, [baseContacts, decisionMaker, department, primary, query, status]);

  const sortedContacts = useMemo(() => sortCrmEntities(filteredContacts, [{ field: sort.field as ContactSortField, direction: sort.direction }]), [filteredContacts, sort]);
  const paginatedContacts = useMemo(() => paginateCrmItems(sortedContacts, { page, pageSize }), [page, pageSize, sortedContacts]);

  const stats = useMemo(() => {
    const departments = new Set(baseContacts.map((contact) => contact.department).filter(Boolean)).size;
    const languages = new Set(baseContacts.map((contact) => contact.preferredLanguage).filter(Boolean)).size;

    return {
      total: baseContacts.length,
      primary: baseContacts.filter((contact) => contact.isPrimaryContact).length,
      decisionMakers: baseContacts.filter((contact) => contact.isDecisionMaker).length,
      departments,
      languages
    };
  }, [baseContacts]);

  const updateSort = useCallback((field: ContactSortKey) => {
    setSort((current) => ({ field, direction: current.field === field && current.direction === "asc" ? "desc" : "asc" }));
  }, []);

  const toggleRow = useCallback((id: ContactId) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }, []);

  const toggleAllVisible = useCallback(() => {
    const visibleIds = paginatedContacts.items.map((contact) => contact.id);
    setSelectedIds((current) => {
      const allSelected = visibleIds.every((id) => current.includes(id));
      return allSelected ? current.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...current, ...visibleIds]));
    });
  }, [paginatedContacts.items]);

  const resetFilters = useCallback(() => {
    setQuery("");
    setStatus("all");
    setDepartment("all");
    setPrimary("all");
    setDecisionMaker("all");
    setPage(1);
  }, []);

  const openCreateDialog = useCallback(() => {
    setError(null);
    setEditingContact(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((contact: Contact) => {
    setError(null);
    setEditingContact(contact);
    setForm({
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
    });
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const saveContact = useCallback(() => {
    const common = {
      workspaceId: CRM_CONTACTS_WORKSPACE_ID,
      companyId,
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
      ownerId: CRM_CONTACTS_USER_ID,
      permission: writeDecision
    };

    const result = editingContact
      ? service.updateContact({ ...common, id: editingContact.id, updatedBy: CRM_CONTACTS_USER_ID } satisfies UpdateContactInput)
      : service.createContact({ ...common, createdBy: CRM_CONTACTS_USER_ID } satisfies CreateContactInput);

    if (!result.validation.valid || !result.contact) {
      setError(result.validation.issues[0]?.message ?? "Impossible d'enregistrer le contact.");
      return false;
    }

    setDialogOpen(false);
    setEditingContact(null);
    setVersion((value) => value + 1);
    setPage(1);
    return true;
  }, [companyId, editingContact, form, service, writeDecision]);

  const archiveContact = useCallback(
    (contact: Contact) => {
      if (!writeDecision.allowed) return;
      service.archiveContact(contact.id, CRM_CONTACTS_WORKSPACE_ID, CRM_CONTACTS_USER_ID, writeDecision);
      setSelectedIds((current) => current.filter((id) => id !== contact.id));
      setVersion((value) => value + 1);
    },
    [service, writeDecision]
  );

  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  return {
    archiveContact,
    closeDialog,
    decisionMaker,
    department,
    departmentOptions,
    dialogOpen,
    editingContact,
    error,
    form,
    openCreateDialog,
    openEditDialog,
    page,
    pageSize,
    paginatedContacts,
    primary,
    query,
    readDecision,
    refresh,
    resetFilters,
    saveContact,
    selectedIds,
    setDecisionMaker,
    setDepartment,
    setForm,
    setPage,
    setPageSize,
    setPrimary,
    setQuery,
    setStatus,
    sort,
    stats,
    status,
    toggleAllVisible,
    toggleRow,
    totalFiltered: sortedContacts.length,
    updateSort,
    writeDecision
  };
}
