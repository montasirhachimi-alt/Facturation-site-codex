"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Edit3, Eye, Plus } from "lucide-react";
import { hydrateProcurementPersistence, persistProcurementRecord } from "@/platform/persistence";
import { PROCUREMENT_WORKSPACE_ID, procurementLocalService, notifyProcurementStoreUpdated, subscribeToProcurementStore } from "../../index";
import type { ProcurementSupplier } from "../../procurement.types";
import { SUPPLIER_STATUS_LABELS } from "../../procurement.constants";
import { SupplierDialog, emptySupplierForm, supplierToForm, type SupplierFormState } from "../dialogs";

export function SuppliersPage() {
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active");
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
    return procurementLocalService.listSuppliers({ workspaceId: PROCUREMENT_WORKSPACE_ID, query, includeArchived: statusFilter === "all", status: statusFilter }).suppliers;
  }, [query, statusFilter, version]);

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
          <button type="button" onClick={openCreate} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/20">
            <Plus size={16} /> Créer un fournisseur
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-hicotech-blue dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" placeholder="Rechercher un fournisseur..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-hicotech-blue dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="active">Actifs</option>
            <option value="all">Tous les statuts</option>
          </select>
        </div>
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
                <td className="px-4 py-3">
                  <span className={supplier.status === "active" ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300"}>{SUPPLIER_STATUS_LABELS[supplier.status]}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/procurement/suppliers/${supplier.id}`} className={iconActionClassName} aria-label="Voir les détails" title="Voir les détails"><Eye size={16} /></Link>
                    <button type="button" onClick={() => openEdit(supplier)} className={iconActionClassName} aria-label="Modifier" title="Modifier"><Edit3 size={16} /></button>
                    <button type="button" onClick={() => archiveSupplier(supplier)} className={`${iconActionClassName} text-red-600`} aria-label="Archiver" title="Archiver"><Archive size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <Plus className="mx-auto mb-3 text-slate-400" size={28} />
                  <p className="font-display text-base font-bold text-hicotech-navy dark:text-white">Aucun fournisseur.</p>
                  <p className="mt-1 text-sm text-slate-500">Cliquez sur &quot;Créer un fournisseur&quot; pour commencer.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <SupplierDialog editing={Boolean(editing)} error={error} form={form} onChange={setForm} onClose={() => setDialogOpen(false)} onSubmit={submitSupplier} open={dialogOpen} />
    </main>
  );
}

const iconActionClassName = "grid size-9 place-items-center rounded-lg border border-slate-200 text-hicotech-navy transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-dark-page/50";
