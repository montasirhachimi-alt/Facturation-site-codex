"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, Edit3, Plus } from "lucide-react";
import { hydrateProcurementPersistence, persistProcurementRecord } from "@/platform/persistence";
import { PROCUREMENT_WORKSPACE_ID, procurementLocalService, notifyProcurementStoreUpdated, subscribeToProcurementStore } from "../../index";
import type { ProcurementSupplier } from "../../procurement.types";
import { SUPPLIER_STATUS_LABELS } from "../../procurement.constants";
import { SupplierDialog, emptySupplierForm, supplierToForm, type SupplierFormState } from "../dialogs";

export function SuppliersPage() {
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProcurementSupplier | null>(null);
  const [form, setForm] = useState<SupplierFormState>(emptySupplierForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void hydrateProcurementPersistence();
    return subscribeToProcurementStore(() => setVersion((value) => value + 1));
  }, []);

  const suppliers = useMemo(() => {
    void version;
    return procurementLocalService.listSuppliers({ workspaceId: PROCUREMENT_WORKSPACE_ID, query, includeArchived: false }).suppliers;
  }, [query, version]);

  function openCreate() {
    setEditing(null);
    setForm(emptySupplierForm);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(supplier: ProcurementSupplier) {
    setEditing(supplier);
    setForm(supplierToForm(supplier));
    setError(null);
    setDialogOpen(true);
  }

  async function submitSupplier() {
    const snapshot = procurementLocalService.listSuppliers({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).suppliers;
    const result = editing
      ? procurementLocalService.updateSupplier({ id: editing.id, workspaceId: PROCUREMENT_WORKSPACE_ID, ...form })
      : procurementLocalService.createSupplier({ workspaceId: PROCUREMENT_WORKSPACE_ID, ...form });

    const supplier = result.supplier;
    if (!supplier) {
      setError(result.error ?? "Impossible d'enregistrer le fournisseur.");
      return false;
    }

    try {
      await persistProcurementRecord("supplier", supplier);
    } catch {
      procurementLocalService.replaceSuppliers(snapshot);
      setError("Le fournisseur n'a pas pu être enregistré.");
      return false;
    }

    notifyProcurementStoreUpdated();
    setDialogOpen(false);
    return true;
  }

  async function archiveSupplier(supplier: ProcurementSupplier) {
    const snapshot = procurementLocalService.listSuppliers({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).suppliers;
    const result = procurementLocalService.archiveSupplier(supplier.id, PROCUREMENT_WORKSPACE_ID);
    if (!result.supplier) return;
    try {
      await persistProcurementRecord("supplier", result.supplier);
    } catch {
      procurementLocalService.replaceSuppliers(snapshot);
    }
    notifyProcurementStoreUpdated();
  }

  return (
    <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Achats</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-hicotech-navy dark:text-white">Fournisseurs</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Répertoire fournisseurs persistant, séparé du CRM.</p>
          </div>
          <button onClick={openCreate} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white">
            <Plus size={16} /> Nouveau fournisseur
          </button>
        </div>
        <input className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-hicotech-blue dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" placeholder="Rechercher un fournisseur..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-hicotech-dark-page/40">
            <tr>
              <th className="px-4 py-3">Fournisseur</th>
              <th className="px-4 py-3">Identifiants</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">{supplier.companyName}<p className="text-xs font-medium text-slate-500">{supplier.tradeName}</p></td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">ICE {supplier.ice ?? "-"} · IF {supplier.taxId ?? "-"}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{supplier.phone ?? "-"}<p>{supplier.email ?? ""}</p></td>
                <td className="px-4 py-3">{SUPPLIER_STATUS_LABELS[supplier.status]}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(supplier)} className="rounded-lg border border-slate-200 p-2" aria-label="Modifier"><Edit3 size={16} /></button>
                    <button onClick={() => archiveSupplier(supplier)} className="rounded-lg border border-slate-200 p-2 text-red-600" aria-label="Archiver"><Archive size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <SupplierDialog editing={Boolean(editing)} error={error} form={form} onChange={setForm} onClose={() => setDialogOpen(false)} onSubmit={submitSupplier} open={dialogOpen} />
    </main>
  );
}
