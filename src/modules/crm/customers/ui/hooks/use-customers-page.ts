"use client";

import { useCallback, useMemo, useState } from "react";
import { PermissionService } from "@/services/permissions";
import {
  filterCrmEntities,
  paginateCrmItems,
  searchCrmEntities,
  sortCrmEntities
} from "@/modules/crm/shared";
import { CustomerService } from "../../customer.service";
import type { CreateCustomerInput, Customer, CustomerId, CustomerStatus, CustomerType } from "../../customer.types";
import { CRM_CUSTOMERS_USER_ID, CRM_CUSTOMERS_WORKSPACE_ID, crmCustomerSeed } from "../customers.seed";

export type CustomerSortKey = "displayName" | "companyName" | "email" | "phone" | "status" | "updatedAt";

export type CustomerFormState = Readonly<{
  displayName: string;
  companyName: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  type: CustomerType;
  tags: string;
  notes: string;
}>;

const emptyForm: CustomerFormState = {
  displayName: "",
  companyName: "",
  email: "",
  phone: "",
  status: "lead",
  type: "company",
  tags: "",
  notes: ""
};

const permissionService = new PermissionService();

export function useCustomersPage() {
  const [service] = useState(() => new CustomerService({ seed: crmCustomerSeed }));
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CustomerStatus | "all">("all");
  const [type, setType] = useState<CustomerType | "all">("all");
  const [tag, setTag] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [sort, setSort] = useState<Readonly<{ field: CustomerSortKey; direction: "asc" | "desc" }>>({
    field: "updatedAt",
    direction: "desc"
  });
  const [selectedIds, setSelectedIds] = useState<readonly CustomerId[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CustomerFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const readDecision = useMemo(
    () =>
      permissionService.evaluateRequirement(
        { module: "clients", action: "view" },
        { id: "crm.customers", type: "page", module: "clients", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_CUSTOMERS_WORKSPACE_ID, userId: CRM_CUSTOMERS_USER_ID }
      ),
    []
  );

  const createDecision = useMemo(
    () =>
      permissionService.evaluateRequirement(
        { module: "clients", action: "create" },
        { id: "crm.customers.create", type: "service", module: "clients", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_CUSTOMERS_WORKSPACE_ID, userId: CRM_CUSTOMERS_USER_ID }
      ),
    []
  );

  const editDecision = useMemo(
    () =>
      permissionService.evaluateRequirement(
        { module: "clients", action: "edit" },
        { id: "crm.customers.edit", type: "service", module: "clients", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_CUSTOMERS_WORKSPACE_ID, userId: CRM_CUSTOMERS_USER_ID }
      ),
    []
  );

  const baseCustomers = useMemo(() => {
    void version;
    return service.listCustomers({ workspaceId: CRM_CUSTOMERS_WORKSPACE_ID, includeArchived: false, permission: readDecision }).customers;
  }, [readDecision, service, version]);

  const tagOptions = useMemo(
    () => ["all", ...Array.from(new Set(baseCustomers.flatMap((customer) => customer.tags))).sort((first, second) => first.localeCompare(second))],
    [baseCustomers]
  );

  const filteredCustomers = useMemo(() => {
    const filtered = filterCrmEntities(baseCustomers, {
      workspaceId: CRM_CUSTOMERS_WORKSPACE_ID,
      status: status === "all" ? undefined : status,
      tags: tag === "all" ? undefined : [tag],
      archived: false
    }).filter((customer) => type === "all" || customer.type === type);

    if (!query.trim()) return filtered;

    return searchCrmEntities(filtered, {
      query,
      fields: ["displayName", "companyName", "email", "phone", "status", "type"]
    }).map((match) => match.entity);
  }, [baseCustomers, query, status, tag, type]);

  const sortedCustomers = useMemo(
    () => sortCrmEntities(filteredCustomers, [{ field: sort.field, direction: sort.direction }]),
    [filteredCustomers, sort]
  );

  const paginatedCustomers = useMemo(
    () => paginateCrmItems(sortedCustomers, { page, pageSize }),
    [page, pageSize, sortedCustomers]
  );

  const stats = useMemo(() => {
    const active = baseCustomers.filter((customer) => customer.status === "active").length;
    const leads = baseCustomers.filter((customer) => customer.status === "lead").length;
    const companies = baseCustomers.filter((customer) => customer.type === "company").length;
    const updatedThisWeek = baseCustomers.filter((customer) => Date.parse(customer.updatedAt) >= Date.parse("2026-06-21T00:00:00.000Z")).length;

    return { total: baseCustomers.length, active, leads, companies, updatedThisWeek };
  }, [baseCustomers]);

  const resetPage = useCallback(() => setPage(1), []);

  const updateSort = useCallback((field: CustomerSortKey) => {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc"
    }));
  }, []);

  const toggleRow = useCallback((id: CustomerId) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }, []);

  const toggleAllVisible = useCallback(() => {
    const visibleIds = paginatedCustomers.items.map((customer) => customer.id);
    setSelectedIds((current) => {
      const allSelected = visibleIds.every((id) => current.includes(id));
      return allSelected ? current.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...current, ...visibleIds]));
    });
  }, [paginatedCustomers.items]);

  const openCreateDialog = useCallback(() => {
    setError(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const createCustomer = useCallback(() => {
    const input: CreateCustomerInput = {
      workspaceId: CRM_CUSTOMERS_WORKSPACE_ID,
      displayName: form.displayName,
      companyName: form.companyName,
      email: form.email,
      phone: form.phone,
      status: form.status,
      type: form.type,
      source: "manual",
      tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
      notes: form.notes,
      createdBy: CRM_CUSTOMERS_USER_ID,
      permission: createDecision
    };
    const result = service.createCustomer(input);

    if (!result.validation.valid || !result.customer) {
      setError(result.validation.issues[0]?.message ?? "Impossible de créer le client.");
      return false;
    }

    setDialogOpen(false);
    setVersion((value) => value + 1);
    setPage(1);
    return true;
  }, [createDecision, form, service]);

  const archiveCustomer = useCallback(
    (customer: Customer) => {
      if (!editDecision.allowed) return;
      service.archiveCustomer(customer.id, CRM_CUSTOMERS_WORKSPACE_ID, CRM_CUSTOMERS_USER_ID, editDecision);
      setSelectedIds((current) => current.filter((id) => id !== customer.id));
      setVersion((value) => value + 1);
    },
    [editDecision, service]
  );

  const refresh = useCallback(() => {
    setVersion((value) => value + 1);
  }, []);

  return {
    archiveCustomer,
    closeDialog,
    createCustomer,
    createDecision,
    dialogOpen,
    editDecision,
    error,
    form,
    openCreateDialog,
    page,
    pageSize,
    paginatedCustomers,
    query,
    readDecision,
    refresh,
    resetPage,
    selectedIds,
    setForm,
    setPage,
    setPageSize,
    setQuery,
    setStatus,
    setTag,
    setType,
    sort,
    stats,
    status,
    tag,
    tagOptions,
    toggleAllVisible,
    toggleRow,
    totalFiltered: sortedCustomers.length,
    type,
    updateSort
  };
}

