import { DEFAULT_CONTACT_LANGUAGE, DEFAULT_CONTACT_SORT, DEFAULT_CONTACT_STATUS, DEFAULT_CONTACT_TIMEZONE } from "./contact.constants";
import type { Contact, ContactFilters, ContactSearchQuery, ContactSort, CreateContactInput, UpdateContactInput } from "./contact.types";
import { filterCrmEntities, normalizeCrmString, normalizeCrmTags, searchCrmEntities, sortCrmEntities } from "@/modules/crm/shared";

export function getContactDisplayName(contact: Pick<Contact, "firstName" | "lastName" | "fullName">) {
  return contact.fullName || [contact.firstName, contact.lastName].filter(Boolean).join(" ");
}

export function getContactInitials(contact: Pick<Contact, "firstName" | "lastName" | "fullName">) {
  const source = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.fullName;
  return source
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getContactAvatarLabel(contact: Contact) {
  return getContactInitials(contact) || "CT";
}

export function normalizeCreateContactInput(input: CreateContactInput) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  return {
    ...input,
    firstName,
    lastName,
    fullName: createFullName(firstName, lastName),
    jobTitle: input.jobTitle?.trim() || undefined,
    department: input.department?.trim() || undefined,
    email: input.email?.trim().toLowerCase() || undefined,
    mobilePhone: input.mobilePhone?.trim() || undefined,
    officePhone: input.officePhone?.trim() || undefined,
    preferredLanguage: input.preferredLanguage?.trim() || DEFAULT_CONTACT_LANGUAGE,
    timezone: input.timezone?.trim() || DEFAULT_CONTACT_TIMEZONE,
    status: input.status ?? DEFAULT_CONTACT_STATUS,
    isPrimaryContact: input.isPrimaryContact ?? false,
    isDecisionMaker: input.isDecisionMaker ?? false,
    linkedin: normalizeLinkedin(input.linkedin),
    notes: input.notes?.trim() || undefined,
    tags: normalizeCrmTags(input.tags)
  };
}

export function normalizeUpdateContactInput(input: UpdateContactInput, existing?: Contact) {
  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();

  return {
    ...input,
    firstName,
    lastName,
    fullName: firstName || lastName ? createFullName(firstName ?? existing?.firstName ?? "", lastName ?? existing?.lastName ?? "") : undefined,
    jobTitle: input.jobTitle?.trim() || undefined,
    department: input.department?.trim() || undefined,
    email: input.email?.trim().toLowerCase() || undefined,
    mobilePhone: input.mobilePhone?.trim() || undefined,
    officePhone: input.officePhone?.trim() || undefined,
    preferredLanguage: input.preferredLanguage?.trim() || undefined,
    timezone: input.timezone?.trim() || undefined,
    linkedin: normalizeLinkedin(input.linkedin),
    notes: input.notes?.trim() || undefined,
    tags: input.tags ? normalizeCrmTags(input.tags) : undefined
  };
}

export function filterContacts(contacts: readonly Contact[], filters: ContactFilters) {
  return filterCrmEntities(contacts, {
    workspaceId: filters.workspaceId,
    status: filters.status,
    ownerId: filters.ownerId,
    tags: filters.tags,
    archived: filters.includeArchived ? undefined : false
  }).filter((contact) => {
    if (!filters.includeArchived && isContactArchived(contact)) return false;
    if (filters.companyId && contact.companyId !== filters.companyId) return false;
    if (filters.role && contact.role !== filters.role) return false;
    if (filters.department && normalizeCrmString(contact.department) !== normalizeCrmString(filters.department)) return false;
    if (filters.isPrimaryContact !== undefined && contact.isPrimaryContact !== filters.isPrimaryContact) return false;
    if (filters.isDecisionMaker !== undefined && contact.isDecisionMaker !== filters.isDecisionMaker) return false;
    return true;
  });
}

export function matchesContactSearch(contact: Contact, search: ContactSearchQuery) {
  if (contact.workspaceId !== search.workspaceId) return false;
  if (search.companyId && contact.companyId !== search.companyId) return false;
  if (!search.includeArchived && isContactArchived(contact)) return false;
  if (!search.query.trim()) return true;

  return searchCrmEntities([contact], {
    query: search.query,
    fields: [
      "firstName",
      "lastName",
      "fullName",
      "jobTitle",
      "department",
      "email",
      "mobilePhone",
      "officePhone",
      "preferredLanguage",
      "timezone",
      "status",
      "role",
      "linkedin"
    ]
  }).length > 0;
}

export function sortContacts(contacts: readonly Contact[], sort: ContactSort = DEFAULT_CONTACT_SORT) {
  return sortCrmEntities(contacts, [sort]);
}

export function isContactActive(contact: Contact) {
  return contact.status === "active";
}

export function isContactArchived(contact: Contact) {
  return contact.status === "archived";
}

export function isPrimaryDecisionMaker(contact: Contact) {
  return contact.isPrimaryContact && contact.isDecisionMaker;
}

function createFullName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function normalizeLinkedin(linkedin: string | undefined) {
  const value = linkedin?.trim();
  if (!value) return undefined;
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
}
