"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { persistCrmSalesRecord } from "@/platform/persistence";
import { PermissionService } from "@/services/permissions";
import {
  filterCrmEntities,
  paginateCrmItems,
  searchCrmEntities,
  sortCrmEntities
} from "@/modules/crm/shared";
import { crmCustomerLocalService, notifyCrmCustomerStoreUpdated, subscribeToCrmCustomerStore } from "../customer-local-store";
import type { CreateCustomerInput, Customer, CustomerId, CustomerStatus, CustomerType, UpdateCustomerInput } from "../../customer.types";
import type { CompanyId } from "../../../companies";
import { CRM_CUSTOMERS_USER_ID, CRM_CUSTOMERS_WORKSPACE_ID } from "../customers.seed";

export type CustomerSortKey = "displayName" | "companyName" | "email" | "phone" | "status" | "updatedAt";

export type CustomerFormState = Readonly<{
  displayName: string;
  companyId: string;
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
  companyId: "",
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
  const [service] = useState(() => crmCustomerLocalService);
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
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
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

  useEffect(() => subscribeToCrmCustomerStore(() => setVersion((value) => value + 1)), []);

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
    setEditingCustomer(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((customer: Customer) => {
    setError(null);
    setEditingCustomer(customer);
    setForm(customerToForm(customer));
    setDialogOpen(true);
  }, []);

  const openViewDialog = useCallback((customer: Customer) => {
    setViewingCustomer(customer);
  }, []);

  const closeViewDialog = useCallback(() => setViewingCustomer(null), []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingCustomer(null);
    setError(null);
  }, []);

  const createCustomer = useCallback(async () => {
    const snapshot = service.listCustomers({ workspaceId: CRM_CUSTOMERS_WORKSPACE_ID, includeArchived: true }).customers;
    const input: CreateCustomerInput = {
      workspaceId: CRM_CUSTOMERS_WORKSPACE_ID,
      displayName: form.displayName,
      companyId: form.companyId ? form.companyId as CompanyId : undefined,
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

    try {
      await persistCrmSalesRecord("customer", result.customer);
    } catch {
      service.replaceCustomers(snapshot);
      setError("Le client n'a pas pu être enregistré dans la base. Vérifiez la connexion puis réessayez.");
      return false;
    }

    setDialogOpen(false);
    setVersion((value) => value + 1);
    notifyCrmCustomerStoreUpdated();
    setPage(1);
    return true;
  }, [createDecision, form, service]);

  const saveCustomer = useCallback(async () => {
    if (!editingCustomer) return createCustomer();
    const snapshot = service.listCustomers({ workspaceId: CRM_CUSTOMERS_WORKSPACE_ID, includeArchived: true }).customers;

    const input: UpdateCustomerInput = {
      id: editingCustomer.id,
      workspaceId: CRM_CUSTOMERS_WORKSPACE_ID,
      displayName: form.displayName,
      companyId: form.companyId ? form.companyId as CompanyId : undefined,
      companyName: form.companyName,
      email: form.email,
      phone: form.phone,
      status: form.status,
      type: form.type,
      tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
      notes: form.notes,
      updatedBy: CRM_CUSTOMERS_USER_ID,
      permission: editDecision
    };
    const result = service.updateCustomer(input);

    if (!result.validation.valid || !result.customer) {
      setError(result.validation.issues[0]?.message ?? "Impossible de modifier le client.");
      return false;
    }

    try {
      await persistCrmSalesRecord("customer", result.customer);
    } catch {
      service.replaceCustomers(snapshot);
      setError("Les modifications n'ont pas pu être enregistrées dans la base. Vérifiez la connexion puis réessayez.");
      return false;
    }

    setDialogOpen(false);
    setEditingCustomer(null);
    setVersion((value) => value + 1);
    notifyCrmCustomerStoreUpdated();
    setViewingCustomer((current) => (current?.id === result.customer?.id ? result.customer : current));
    return true;
  }, [createCustomer, editDecision, editingCustomer, form, service]);

  const archiveCustomer = useCallback(
    async (customer: Customer) => {
      if (!editDecision.allowed) return;
      const snapshot = service.listCustomers({ workspaceId: CRM_CUSTOMERS_WORKSPACE_ID, includeArchived: true }).customers;
      const result = service.archiveCustomer(customer.id, CRM_CUSTOMERS_WORKSPACE_ID, CRM_CUSTOMERS_USER_ID, editDecision);
      if (result.customer) {
        try {
          await persistCrmSalesRecord("customer", result.customer);
        } catch {
          service.replaceCustomers(snapshot);
          setError("Le client n'a pas pu être archivé dans la base. Vérifiez la connexion puis réessayez.");
          setVersion((value) => value + 1);
          notifyCrmCustomerStoreUpdated();
          return;
        }
      }
      setSelectedIds((current) => current.filter((id) => id !== customer.id));
      setViewingCustomer((current) => (current?.id === customer.id ? null : current));
      setVersion((value) => value + 1);
      notifyCrmCustomerStoreUpdated();
    },
    [editDecision, service]
  );

  const refresh = useCallback(() => {
    setVersion((value) => value + 1);
    setSelectedIds((current) => current.filter((id) => Boolean(service.getCustomerById(id, CRM_CUSTOMERS_WORKSPACE_ID, readDecision))));
    setViewingCustomer((current) => current ? service.getCustomerById(current.id, CRM_CUSTOMERS_WORKSPACE_ID, readDecision) ?? null : null);
  }, [readDecision, service]);

  return {
    archiveCustomer,
    closeDialog,
    closeViewDialog,
    createCustomer,
    createDecision,
    dialogOpen,
    editingCustomer,
    editDecision,
    error,
    form,
    openCreateDialog,
    openEditDialog,
    openViewDialog,
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
    saveCustomer,
    sort,
    stats,
    status,
    tag,
    tagOptions,
    toggleAllVisible,
    toggleRow,
    totalFiltered: sortedCustomers.length,
    type,
    updateSort,
    viewingCustomer
  };
}

function customerToForm(customer: Customer): CustomerFormState {
  return {
    displayName: customer.displayName,
    companyId: customer.companyId ?? "",
    companyName: customer.companyName ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    status: customer.status === "archived" ? "inactive" : customer.status,
    type: customer.type,
    tags: customer.tags.join(", "),
    notes: customer.notes ?? ""
  };
}
