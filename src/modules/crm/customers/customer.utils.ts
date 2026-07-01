import {
  DEFAULT_CUSTOMER_SORT
} from "./customer.constants";
import type { Customer, CustomerFilters, CustomerSearchQuery, CustomerSort, CreateCustomerInput, UpdateCustomerInput } from "./customer.types";

export function getCustomerDisplayLabel(customer: Customer) {
  return customer.companyName ? `${customer.displayName} - ${customer.companyName}` : customer.displayName;
}

export function normalizeCustomerTags(tags: readonly string[] = []) {
  return Object.freeze(
    [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))]
      .sort((first, second) => first.localeCompare(second))
  );
}

export function normalizeCreateCustomerInput(input: CreateCustomerInput) {
  return {
    ...input,
    displayName: input.displayName.trim(),
    companyName: input.companyName?.trim() || undefined,
    email: input.email?.trim().toLowerCase() || undefined,
    phone: input.phone?.trim() || undefined,
    tags: normalizeCustomerTags(input.tags),
    notes: input.notes?.trim() || undefined
  };
}

export function normalizeUpdateCustomerInput(input: UpdateCustomerInput) {
  return {
    ...input,
    displayName: input.displayName?.trim(),
    companyName: input.companyName?.trim() || undefined,
    email: input.email?.trim().toLowerCase() || undefined,
    phone: input.phone?.trim() || undefined,
    tags: input.tags ? normalizeCustomerTags(input.tags) : undefined,
    notes: input.notes?.trim() || undefined
  };
}

export function matchesCustomerSearch(customer: Customer, search: CustomerSearchQuery) {
  if (customer.workspaceId !== search.workspaceId) return false;
  if (!search.includeArchived && isCustomerArchived(customer)) return false;

  const query = search.query.trim().toLowerCase();
  if (!query) return true;

  return [
    customer.displayName,
    customer.companyName,
    customer.email,
    customer.phone,
    customer.status,
    customer.type,
    customer.source,
    ...customer.tags
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(query));
}

export function filterCustomers(customers: readonly Customer[], filters: CustomerFilters) {
  return customers.filter((customer) => {
    if (customer.workspaceId !== filters.workspaceId) return false;
    if (!filters.includeArchived && isCustomerArchived(customer)) return false;
    if (filters.status && customer.status !== filters.status) return false;
    if (filters.type && customer.type !== filters.type) return false;
    if (filters.source && customer.source !== filters.source) return false;
    if (filters.tags?.length && !filters.tags.every((tag) => customer.tags.includes(tag.toLowerCase()))) return false;
    return true;
  });
}

export function sortCustomers(customers: readonly Customer[], sort: CustomerSort = DEFAULT_CUSTOMER_SORT) {
  const direction = sort.direction === "asc" ? 1 : -1;

  return [...customers].sort((first, second) => {
    const firstValue = String(first[sort.field] ?? "");
    const secondValue = String(second[sort.field] ?? "");
    return firstValue.localeCompare(secondValue) * direction;
  });
}

export function isCustomerLead(customer: Customer) {
  return customer.status === "lead";
}

export function isCustomerActive(customer: Customer) {
  return customer.status === "active";
}

export function isCustomerArchived(customer: Customer) {
  return customer.status === "archived";
}

