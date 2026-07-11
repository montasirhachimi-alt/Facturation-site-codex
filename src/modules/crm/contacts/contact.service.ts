import { DEFAULT_CONTACT_SORT, DEFAULT_CONTACT_STATUS } from "./contact.constants";
import type {
  Contact,
  ContactFilters,
  ContactId,
  ContactListResult,
  ContactSearchQuery,
  ContactSort,
  CreateContactInput,
  UpdateContactInput
} from "./contact.types";
import type { CompanyId, WorkspaceId } from "../companies/company.types";
import {
  filterContacts,
  matchesContactSearch,
  normalizeCreateContactInput,
  normalizeUpdateContactInput,
  sortContacts
} from "./contact.utils";
import { validateCreateContactInput, validateUpdateContactInput } from "./contact.validation";

export type ContactServiceOptions = Readonly<{
  seed?: readonly Contact[];
  now?: () => string;
  createId?: () => ContactId;
}>;

export class ContactService {
  private readonly contacts = new Map<ContactId, Contact>();
  private readonly now: () => string;
  private readonly createId: () => ContactId;

  constructor(options: ContactServiceOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? (() => `cont_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as ContactId);

    for (const contact of options.seed ?? []) {
      this.contacts.set(contact.id, freezeContact(contact));
    }
  }

  replaceContacts(contacts: readonly Contact[]) {
    this.contacts.clear();
    for (const contact of contacts) {
      this.contacts.set(contact.id, freezeContact(contact));
    }
  }

  upsertContact(contact: Contact) {
    const frozen = freezeContact(contact);
    this.contacts.set(frozen.id, frozen);
    return frozen;
  }

  listContacts(filters: ContactFilters, sort: ContactSort = DEFAULT_CONTACT_SORT): ContactListResult {
    if (filters.permission && !filters.permission.allowed) {
      return createListResult([], 0, filters.workspaceId, filters.companyId);
    }

    const workspaceContacts = [...this.contacts.values()].filter((contact) => contact.workspaceId === filters.workspaceId);
    const filtered = filterContacts(workspaceContacts, filters);

    return createListResult(sortContacts(filtered, sort), workspaceContacts.length, filters.workspaceId, filters.companyId);
  }

  getContact(id: ContactId, workspaceId: WorkspaceId, permission = undefined as ContactFilters["permission"]) {
    if (permission && !permission.allowed) return undefined;

    const contact = this.contacts.get(id);
    return contact?.workspaceId === workspaceId ? contact : undefined;
  }

  getContactsByCompany(companyId: CompanyId, workspaceId: WorkspaceId, permission = undefined as ContactFilters["permission"], sort: ContactSort = DEFAULT_CONTACT_SORT) {
    return this.listContacts({ workspaceId, companyId, permission }, sort);
  }

  createContact(input: CreateContactInput) {
    const validation = validateCreateContactInput(input);
    if (!validation.valid) {
      return Object.freeze({ contact: undefined, validation });
    }

    const normalized = normalizeCreateContactInput(input);
    const timestamp = this.now();
    const contact = freezeContact({
      id: this.createId(),
      workspaceId: normalized.workspaceId,
      companyId: normalized.companyId,
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      fullName: normalized.fullName,
      jobTitle: normalized.jobTitle,
      department: normalized.department,
      email: normalized.email,
      mobilePhone: normalized.mobilePhone,
      officePhone: normalized.officePhone,
      preferredLanguage: normalized.preferredLanguage,
      timezone: normalized.timezone,
      status: normalized.status ?? DEFAULT_CONTACT_STATUS,
      role: normalized.role,
      isPrimaryContact: normalized.isPrimaryContact,
      isDecisionMaker: normalized.isDecisionMaker,
      linkedin: normalized.linkedin,
      notes: normalized.notes,
      tags: normalized.tags,
      ownerId: normalized.ownerId,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: normalized.createdBy
    });

    this.contacts.set(contact.id, contact);
    return Object.freeze({ contact, validation });
  }

  updateContact(input: UpdateContactInput) {
    const validation = validateUpdateContactInput(input);
    if (!validation.valid) {
      return Object.freeze({ contact: undefined, validation });
    }

    const existing = this.getContact(input.id, input.workspaceId, input.permission);
    if (!existing) {
      return Object.freeze({ contact: undefined, validation });
    }

    const normalized = normalizeUpdateContactInput(input, existing);
    const contact = freezeContact({
      ...existing,
      companyId: normalized.companyId ?? existing.companyId,
      firstName: normalized.firstName ?? existing.firstName,
      lastName: normalized.lastName ?? existing.lastName,
      fullName: normalized.fullName ?? existing.fullName,
      jobTitle: normalized.jobTitle ?? existing.jobTitle,
      department: normalized.department ?? existing.department,
      email: normalized.email ?? existing.email,
      mobilePhone: normalized.mobilePhone ?? existing.mobilePhone,
      officePhone: normalized.officePhone ?? existing.officePhone,
      preferredLanguage: normalized.preferredLanguage ?? existing.preferredLanguage,
      timezone: normalized.timezone ?? existing.timezone,
      status: normalized.status ?? existing.status,
      role: normalized.role ?? existing.role,
      isPrimaryContact: normalized.isPrimaryContact ?? existing.isPrimaryContact,
      isDecisionMaker: normalized.isDecisionMaker ?? existing.isDecisionMaker,
      linkedin: normalized.linkedin ?? existing.linkedin,
      notes: normalized.notes ?? existing.notes,
      tags: normalized.tags ?? existing.tags,
      ownerId: normalized.ownerId ?? existing.ownerId,
      updatedAt: this.now(),
      updatedBy: normalized.updatedBy
    });

    this.contacts.set(contact.id, contact);
    return Object.freeze({ contact, validation });
  }

  archiveContact(id: ContactId, workspaceId: WorkspaceId, updatedBy: UpdateContactInput["updatedBy"], permission?: UpdateContactInput["permission"]) {
    return this.updateContact({ id, workspaceId, status: "archived", updatedBy, permission });
  }

  searchContacts(search: ContactSearchQuery, sort: ContactSort = DEFAULT_CONTACT_SORT): ContactListResult {
    if (search.permission && !search.permission.allowed) {
      return createListResult([], 0, search.workspaceId, search.companyId);
    }

    const workspaceContacts = [...this.contacts.values()].filter((contact) => contact.workspaceId === search.workspaceId);
    const filtered = workspaceContacts.filter((contact) => matchesContactSearch(contact, search));

    return createListResult(sortContacts(filtered, sort), workspaceContacts.length, search.workspaceId, search.companyId);
  }
}

export function freezeContact(contact: Contact): Contact {
  return Object.freeze({
    ...contact,
    tags: Object.freeze([...contact.tags])
  });
}

function createListResult(contacts: readonly Contact[], total: number, workspaceId: WorkspaceId, companyId?: CompanyId): ContactListResult {
  return Object.freeze({
    contacts: Object.freeze([...contacts]),
    total,
    filtered: contacts.length,
    workspaceId,
    companyId
  });
}

export const contactService = new ContactService();
