"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Archive, Edit3, FileText, Mail, Phone } from "lucide-react";
import { hydrateProcurementPersistence, persistProcurementRecord } from "@/platform/persistence";
import { MetricCard, ProductSectionHeader, SectionCard } from "@/ui";
import { PROCUREMENT_WORKSPACE_ID, notifyProcurementStoreUpdated, procurementLocalService, subscribeToProcurementStore } from "../../index";
import type { ProcurementSupplierId } from "../../procurement.types";
import { SUPPLIER_STATUS_LABELS } from "../../procurement.constants";
import { calculatePurchaseOrderTotals, formatProcurementMoney } from "../../procurement.utils";
import { SupplierDialog, emptySupplierForm, supplierToForm, type SupplierFormState } from "../dialogs";

export function SupplierDetailsPage({ supplierId }: { supplierId: string }) {
  const [version, setVersion] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<SupplierFormState>(emptySupplierForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void hydrateProcurementPersistence();
    return subscribeToProcurementStore(() => setVersion((value) => value + 1));
  }, []);

  const supplier = useMemo(() => {
    void version;
    return procurementLocalService.getSupplier(supplierId as ProcurementSupplierId, PROCUREMENT_WORKSPACE_ID);
  }, [supplierId, version]);

  const purchaseOrders = useMemo(() => {
    void version;
    return procurementLocalService.listPurchaseOrders({ workspaceId: PROCUREMENT_WORKSPACE_ID, supplierId: supplierId as ProcurementSupplierId, includeArchived: false }).purchaseOrders;
  }, [supplierId, version]);

  const receipts = useMemo(() => {
    void version;
    return procurementLocalService.listGoodsReceipts({ workspaceId: PROCUREMENT_WORKSPACE_ID, supplierId: supplierId as ProcurementSupplierId, includeArchived: false }).goodsReceipts;
  }, [supplierId, version]);

  if (!supplier) {
    return (
      <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
        <SectionCard className="p-6 text-center">
          <p className="font-display text-xl font-bold text-hicotech-navy dark:text-white">Fournisseur introuvable.</p>
          <Link href="/procurement/suppliers" className="mt-4 inline-flex rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white">Retour aux fournisseurs</Link>
        </SectionCard>
      </main>
    );
  }

  const supplierValue = supplier;

  function openEdit() {
    setForm(supplierToForm(supplierValue));
    setError(null);
    setDialogOpen(true);
  }

  async function submitSupplier() {
    const snapshot = procurementLocalService.listSuppliers({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).suppliers;
    const result = procurementLocalService.updateSupplier({ id: supplierValue.id, workspaceId: PROCUREMENT_WORKSPACE_ID, ...form });
    if (!result.supplier) {
      setError(result.error ?? "Impossible d'enregistrer le fournisseur.");
      return false;
    }
    try {
      await persistProcurementRecord("supplier", result.supplier);
    } catch {
      procurementLocalService.replaceSuppliers(snapshot);
      setError("Le fournisseur n'a pas pu être enregistré.");
      return false;
    }
    notifyProcurementStoreUpdated();
    setDialogOpen(false);
    return true;
  }

  async function archiveSupplier() {
    const snapshot = procurementLocalService.listSuppliers({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).suppliers;
    const result = procurementLocalService.archiveSupplier(supplierValue.id, PROCUREMENT_WORKSPACE_ID);
    if (!result.supplier) return;
    try {
      await persistProcurementRecord("supplier", result.supplier);
    } catch {
      procurementLocalService.replaceSuppliers(snapshot);
    }
    notifyProcurementStoreUpdated();
  }

  const totalOrdered = purchaseOrders.reduce((total, order) => total + calculatePurchaseOrderTotals(order).total, 0);

  return (
    <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <Link href="/procurement/suppliers" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-hicotech-blue">
          <ArrowLeft size={16} /> Fournisseurs
        </Link>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Fournisseur</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-hicotech-navy dark:text-white">{supplierValue.companyName}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{supplierValue.tradeName || supplierValue.address || "Compte fournisseur achats."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={openEdit} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white"><Edit3 size={16} /> Modifier</button>
            <button type="button" onClick={archiveSupplier} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600"><Archive size={16} /> Archiver</button>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 md:grid-cols-3">
        <MetricCard icon={FileText} label="Commandes" value={String(purchaseOrders.length)} helper="Commandes fournisseur liées" />
        <MetricCard icon={FileText} label="Montant commandé" value={formatProcurementMoney(totalOrdered, supplierValue.currency)} helper="Total des commandes" />
        <MetricCard icon={FileText} label="Réceptions" value={String(receipts.length)} helper="Réceptions postées ou préparées" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard className="p-4">
          <ProductSectionHeader icon={Phone} title="Coordonnées" description="Informations fournisseur utilisées par les achats." />
          <div className="mt-4 space-y-3 text-sm">
            <Info label="Statut" value={SUPPLIER_STATUS_LABELS[supplierValue.status]} />
            <Info label="Contact" value={supplierValue.tradeName ?? "-"} />
            <Info label="Téléphone" value={supplierValue.phone ?? "-"} />
            <Info label="Email" value={supplierValue.email ?? "-"} icon={supplierValue.email ? Mail : undefined} />
            <Info label="Adresse" value={supplierValue.address ?? "-"} />
            <Info label="TVA" value={supplierValue.vat ?? "-"} />
            <Info label="Notes" value={supplierValue.notes ?? "-"} />
          </div>
        </SectionCard>

        <SectionCard className="overflow-hidden">
          <div className="p-4 pb-0">
            <ProductSectionHeader icon={FileText} title="Commandes fournisseur" description="Historique opérationnel lié à ce fournisseur." />
          </div>
          <div className="mt-4 divide-y divide-slate-100 dark:divide-hicotech-dark-border">
            {purchaseOrders.map((order) => (
              <Link key={order.id} href={`/procurement/purchase-orders/${order.id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-hicotech-sky/45 dark:hover:bg-hicotech-dark-page/60">
                <span>
                  <span className="block text-sm font-bold text-hicotech-navy dark:text-white">{order.number}</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">{new Date(order.issueDate).toLocaleDateString("fr-MA")}</span>
                </span>
                <span className="text-right text-sm font-bold text-hicotech-navy dark:text-white">{formatProcurementMoney(calculatePurchaseOrderTotals(order).total, order.currency)}</span>
              </Link>
            ))}
            {purchaseOrders.length === 0 && <p className="px-4 py-8 text-center text-sm font-semibold text-slate-500">Aucune commande fournisseur liée.</p>}
          </div>
        </SectionCard>
      </section>

      <SupplierDialog editing error={error} form={form} onChange={setForm} onClose={() => setDialogOpen(false)} onSubmit={submitSupplier} open={dialogOpen} />
    </main>
  );
}

function Info({ icon: Icon, label, value }: { icon?: typeof Mail; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-hicotech-dark-page/50">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 inline-flex items-center gap-2 font-semibold text-hicotech-navy dark:text-white">{Icon ? <Icon size={14} /> : null}{value}</p>
    </div>
  );
}
