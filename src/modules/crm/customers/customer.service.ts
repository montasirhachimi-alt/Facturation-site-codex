import {
  DEFAULT_CUSTOMER_SORT,
  DEFAULT_CUSTOMER_SOURCE,
  DEFAULT_CUSTOMER_STATUS,
  DEFAULT_CUSTOMER_TYPE
} from "./customer.constants";
import type {
  CreateCustomerInput,
  Customer,
  CustomerFilters,
  CustomerId,
  CustomerListResult,
  CustomerSearchQuery,
  CustomerSort,
  UpdateCustomerInput,
  WorkspaceId
} from "./customer.types";
import {
  filterCustomers,
  matchesCustomerSearch,
  normalizeCreateCustomerInput,
  normalizeUpdateCustomerInput,
  sortCustomers
} from "./customer.utils";
import { validateCreateCustomerInput, validateUpdateCustomerInput } from "./customer.validation";

export type CustomerServiceOptions = Readonly<{
  seed?: readonly Customer[];
  now?: () => string;
  createId?: () => CustomerId;
}>;

export class CustomerService {
  private readonly customers = new Map<CustomerId, Customer>();
  private readonly now: () => string;
  private readonly createId: () => CustomerId;

  constructor(options: CustomerServiceOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? (() => `cust_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as CustomerId);

    for (const customer of options.seed ?? []) {
      this.customers.set(customer.id, freezeCustomer(customer));
    }
  }

  replaceCustomers(customers: readonly Customer[]) {
    this.customers.clear();
    for (const customer of customers) {
      this.customers.set(customer.id, freezeCustomer(customer));
    }
  }

  upsertCustomer(customer: Customer) {
    const frozen = freezeCustomer(customer);
    this.customers.set(frozen.id, frozen);
    return frozen;
  }

  listCustomers(filters: CustomerFilters, sort: CustomerSort = DEFAULT_CUSTOMER_SORT): CustomerListResult {
    if (filters.permission && !filters.permission.allowed) {
      return createListResult([], 0, filters.workspaceId);
    }

    const workspaceCustomers = [...this.customers.values()].filter((customer) => customer.workspaceId === filters.workspaceId);
    const filtered = filterCustomers(workspaceCustomers, filters);

    return createListResult(sortCustomers(filtered, sort), workspaceCustomers.length, filters.workspaceId);
  }

  getCustomerById(id: CustomerId, workspaceId: WorkspaceId, permission = undefined as CustomerFilters["permission"]) {
    if (permission && !permission.allowed) return undefined;

    const customer = this.customers.get(id);
    return customer?.workspaceId === workspaceId ? customer : undefined;
  }

  createCustomer(input: CreateCustomerInput) {
    const validation = validateCreateCustomerInput(input);
    if (!validation.valid) {
      return Object.freeze({ customer: undefined, validation });
    }

    const normalized = normalizeCreateCustomerInput(input);
    const timestamp = this.now();
    const customer = freezeCustomer({
      id: this.createId(),
      workspaceId: normalized.workspaceId,
      displayName: normalized.displayName,
      companyId: normalized.companyId,
      companyName: normalized.companyName,
      email: normalized.email,
      phone: normalized.phone,
      status: normalized.status ?? DEFAULT_CUSTOMER_STATUS,
      type: normalized.type ?? DEFAULT_CUSTOMER_TYPE,
      source: normalized.source ?? DEFAULT_CUSTOMER_SOURCE,
      tags: normalized.tags,
      notes: normalized.notes,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: normalized.createdBy
    });

    this.customers.set(customer.id, customer);
    return Object.freeze({ customer, validation });
  }

  updateCustomer(input: UpdateCustomerInput) {
    const validation = validateUpdateCustomerInput(input);
    if (!validation.valid) {
      return Object.freeze({ customer: undefined, validation });
    }

    const existing = this.getCustomerById(input.id, input.workspaceId, input.permission);
    if (!existing) {
      return Object.freeze({ customer: undefined, validation });
    }

    const normalized = normalizeUpdateCustomerInput(input);
    const customer = freezeCustomer({
      ...existing,
      displayName: normalized.displayName ?? existing.displayName,
      companyId: normalized.companyId ?? existing.companyId,
      companyName: normalized.companyName ?? existing.companyName,
      email: normalized.email ?? existing.email,
      phone: normalized.phone ?? existing.phone,
      status: normalized.status ?? existing.status,
      type: normalized.type ?? existing.type,
      source: normalized.source ?? existing.source,
      tags: normalized.tags ?? existing.tags,
      notes: normalized.notes ?? existing.notes,
      updatedAt: this.now(),
      updatedBy: normalized.updatedBy
    });

    this.customers.set(customer.id, customer);
    return Object.freeze({ customer, validation });
  }

  archiveCustomer(id: CustomerId, workspaceId: WorkspaceId, updatedBy: UpdateCustomerInput["updatedBy"], permission?: UpdateCustomerInput["permission"]) {
    return this.updateCustomer({ id, workspaceId, status: "archived", updatedBy, permission });
  }

  searchCustomers(search: CustomerSearchQuery, sort: CustomerSort = DEFAULT_CUSTOMER_SORT): CustomerListResult {
    if (search.permission && !search.permission.allowed) {
      return createListResult([], 0, search.workspaceId);
    }

    const workspaceCustomers = [...this.customers.values()].filter((customer) => customer.workspaceId === search.workspaceId);
    const filtered = workspaceCustomers.filter((customer) => matchesCustomerSearch(customer, search));

    return createListResult(sortCustomers(filtered, sort), workspaceCustomers.length, search.workspaceId);
  }
}

export function freezeCustomer(customer: Customer): Customer {
  return Object.freeze({
    ...customer,
    tags: Object.freeze([...customer.tags])
  });
}

function createListResult(customers: readonly Customer[], total: number, workspaceId: WorkspaceId): CustomerListResult {
  return Object.freeze({
    customers: Object.freeze([...customers]),
    total,
    filtered: customers.length,
    workspaceId
  });
}

export const customerService = new CustomerService();
