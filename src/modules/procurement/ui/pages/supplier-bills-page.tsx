"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, Edit3, FileText, Link2, Plus, Search } from "lucide-react";
import { hydrateProductCatalogPersistence, hydrateProcurementPersistence, persistProcurementRecord } from "@/platform/persistence";
import { EntityDialog } from "@/ui/dialogs/entity-dialog";
import { FormActions, FormField, FormSection, entityInputClassName } from "@/ui/forms/form-field";
import { PRODUCTS_WORKSPACE_ID } from "@/modules/products";
import { productLocalService, subscribeToProductStore } from "@/modules/products/ui/product-local-store";
import { PROCUREMENT_WORKSPACE_ID, procurementLocalService, notifyProcurementStoreUpdated, subscribeToProcurementStore } from "../../index";
import { DEFAULT_PROCUREMENT_CURRENCY, PROCUREMENT_USER_ID, SUPPLIER_BILL_PAYMENT_STATUS_LABELS, SUPPLIER_BILL_STATUS_LABELS, SUPPLIER_PAYMENT_METHOD_LABELS } from "../../procurement.constants";
import type { SupplierBill, SupplierPaymentMethod } from "../../procurement.types";
import { calculateSupplierBillPaymentState, calculateSupplierBillTotals, createEmptySupplierBillLine, formatProcurementMoney } from "../../procurement.utils";
import { SupplierBillDialog, type SupplierBillFormState } from "../dialogs";

function today() {
  return new Date().toISOString().slice(0, 10);
}

const emptyBillForm: SupplierBillFormState = {
  supplierId: "",
  purchaseOrderId: "",
  goodsReceiptId: "",
  billDate: today(),
  dueDate: "",
  currency: DEFAULT_PROCUREMENT_CURRENCY,
  reference: "",
  notes: "",
  discountRate: 0,
  lines: [createEmptySupplierBillLine("supplier-bill")]
};

type SupplierPaymentFormState = {
  paymentDate: string;
  amount: number;
  method: SupplierPaymentMethod;
  reference: string;
  notes: string;
};

export function SupplierBillsPage() {
  const [version, setVersion] = useState(0);
  const [productVersion, setProductVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupplierBill["status"] | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<SupplierBill | null>(null);
  const [form, setForm] = useState<SupplierBillFormState>(emptyBillForm);
  const [error, setError] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<SupplierBill | null>(null);
  const [paymentForm, setPaymentForm] = useState<SupplierPaymentFormState>({ paymentDate: today(), amount: 0, method: "bank_transfer", reference: "", notes: "" });
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    void hydrateProcurementPersistence();
    void hydrateProductCatalogPersistence();
    const unsubscribeProcurement = subscribeToProcurementStore(() => setVersion((value) => value + 1));
    const unsubscribeProducts = subscribeToProductStore(() => setProductVersion((value) => value + 1));
    return () => {
      unsubscribeProcurement();
      unsubscribeProducts();
    };
  }, []);

  const suppliers = useMemo(() => {
    void version;
    return procurementLocalService.listSuppliers({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: false }).suppliers;
  }, [version]);
  const purchaseOrders = useMemo(() => {
    void version;
    return procurementLocalService.listPurchaseOrders({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: false }).purchaseOrders;
  }, [version]);
  const goodsReceipts = useMemo(() => {
    void version;
    return procurementLocalService.listGoodsReceipts({ workspaceId: PROCUREMENT_WORKSPACE_ID, status: "posted", includeArchived: false }).goodsReceipts;
  }, [version]);
  const supplierBills = useMemo(() => {
    void version;
    return procurementLocalService.listSupplierBills({ workspaceId: PROCUREMENT_WORKSPACE_ID, query, status: statusFilter, includeArchived: statusFilter === "all" }).supplierBills;
  }, [query, statusFilter, version]);
  const supplierPayments = useMemo(() => {
    void version;
    return procurementLocalService.listSupplierPayments({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: false }).supplierPayments;
  }, [version]);
  const products = useMemo(() => {
    void productVersion;
    return productLocalService.listProducts({ workspaceId: PRODUCTS_WORKSPACE_ID, status: "active" }).products;
  }, [productVersion]);

  function openCreate() {
    setEditingBill(null);
    setForm({ ...emptyBillForm, billDate: today(), lines: [createEmptySupplierBillLine("supplier-bill")] });
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(bill: SupplierBill) {
    if (bill.status !== "draft") return;
    setEditingBill(bill);
    setForm({
      supplierId: bill.supplierId,
      purchaseOrderId: bill.purchaseOrderId ?? "",
      goodsReceiptId: bill.goodsReceiptId ?? "",
      billDate: bill.billDate.slice(0, 10),
      dueDate: bill.dueDate?.slice(0, 10) ?? "",
      currency: bill.currency,
      reference: bill.reference ?? "",
      notes: bill.notes ?? "",
      discountRate: bill.discountRate,
      lines: [...bill.lines]
    });
    setError(null);
    setDialogOpen(true);
  }

  async function submitBill() {
    const supplier = suppliers.find((item) => item.id === form.supplierId);
    if (!supplier) {
      setError("Sélectionnez un fournisseur.");
      return false;
    }
    const order = purchaseOrders.find((item) => item.id === form.purchaseOrderId);
    const receipt = goodsReceipts.find((item) => item.id === form.goodsReceiptId);
    const snapshot = procurementLocalService.listSupplierBills({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).supplierBills;
    const payload = {
      workspaceId: PROCUREMENT_WORKSPACE_ID,
      supplierId: supplier.id,
      supplierName: supplier.companyName,
      purchaseOrderId: order?.id,
      purchaseOrderNumber: order?.number,
      goodsReceiptId: receipt?.id,
      goodsReceiptNumber: receipt?.number,
      billDate: new Date(form.billDate || today()).toISOString(),
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      currency: form.currency,
      reference: form.reference,
      notes: form.notes,
      lines: form.lines,
      discountRate: form.discountRate,
      ownerId: PROCUREMENT_USER_ID
    };
    const result = editingBill
      ? procurementLocalService.updateSupplierBill({ id: editingBill.id, ...payload, status: editingBill.status })
      : procurementLocalService.createSupplierBill(payload);
    if (!result.supplierBill) {
      setError(result.error ?? "Impossible d'enregistrer la facture fournisseur.");
      return false;
    }
    try {
      await persistProcurementRecord("supplierBill", result.supplierBill);
    } catch (caught) {
      procurementLocalService.replaceSupplierBills(snapshot);
      setError(caught instanceof Error ? caught.message : "La facture fournisseur n'a pas pu être enregistrée.");
      return false;
    }
    notifyProcurementStoreUpdated();
    setDialogOpen(false);
    return true;
  }

  async function finalizeBill(bill: SupplierBill) {
    if (bill.status !== "draft") return;
    const snapshot = procurementLocalService.listSupplierBills({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).supplierBills;
    const result = procurementLocalService.updateSupplierBill({ id: bill.id, workspaceId: PROCUREMENT_WORKSPACE_ID, status: "finalized" });
    if (!result.supplierBill) return;
    try {
      await persistProcurementRecord("supplierBill", result.supplierBill);
    } catch {
      procurementLocalService.replaceSupplierBills(snapshot);
    }
    notifyProcurementStoreUpdated();
  }

  function openPaymentDialog(bill: SupplierBill) {
    const paymentState = calculateSupplierBillPaymentState(bill, supplierPayments);
    if (bill.status !== "accounted" || paymentState.outstandingAmount <= 0) return;
    setPaymentTarget(bill);
    setPaymentForm({ paymentDate: today(), amount: paymentState.outstandingAmount, method: "bank_transfer", reference: "", notes: "" });
    setPaymentError(null);
    setPaymentDialogOpen(true);
  }

  async function submitPayment() {
    if (!paymentTarget) return false;
    const snapshot = procurementLocalService.listSupplierPayments({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: true }).supplierPayments;
    const result = procurementLocalService.createSupplierPayment({
      workspaceId: PROCUREMENT_WORKSPACE_ID,
      supplierId: paymentTarget.supplierId,
      supplierName: paymentTarget.supplierName,
      supplierBillId: paymentTarget.id,
      supplierBillNumber: paymentTarget.number,
      paymentDate: new Date(paymentForm.paymentDate || today()).toISOString(),
      amount: paymentForm.amount,
      currency: paymentTarget.currency,
      method: paymentForm.method,
      reference: paymentForm.reference.trim() || undefined,
      notes: paymentForm.notes.trim() || undefined,
      status: "finalized",
      finalizedAt: new Date().toISOString(),
      ownerId: PROCUREMENT_USER_ID
    });
    if (!result.supplierPayment) {
      setPaymentError(result.error ?? "Impossible d'enregistrer le règlement fournisseur.");
      return false;
    }
    try {
      await persistProcurementRecord("supplierPayment", result.supplierPayment);
    } catch (caught) {
      procurementLocalService.replaceSupplierPayments(snapshot);
      setPaymentError(caught instanceof Error ? caught.message : "Le règlement fournisseur n'a pas pu être enregistré.");
      return false;
    }
    notifyProcurementStoreUpdated();
    setPaymentDialogOpen(false);
    setPaymentTarget(null);
    return true;
  }

  return (
    <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Achats</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-hicotech-navy dark:text-white">Factures fournisseurs</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Enregistrez les factures reçues puis transmettez-les à la Finance pour comptabilisation AP.</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/20">
            <Plus size={16} /> Créer la facture
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_14rem]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-hicotech-blue dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" placeholder="Rechercher une facture..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-hicotech-blue dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as SupplierBill["status"] | "all")}>
            <option value="all">Tous les statuts</option>
            {Object.entries(SUPPLIER_BILL_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-hicotech-dark-page/40">
            <tr><th className="px-4 py-3">Facture</th><th className="px-4 py-3">Fournisseur</th><th className="px-4 py-3">Liens</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Paiement</th><th className="px-4 py-3 text-right">Payé</th><th className="px-4 py-3 text-right">Reste à payer</th><th className="px-4 py-3 text-right">Total TTC</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {supplierBills.map((bill) => {
	              const totals = calculateSupplierBillTotals(bill);
	              const paymentState = calculateSupplierBillPaymentState(bill, supplierPayments);
	              const canEdit = bill.status === "draft";
	              const canFinalize = bill.status === "draft";
	              const canPay = bill.status === "accounted" && paymentState.outstandingAmount > 0;
	              return (
                <tr key={bill.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                  <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">{bill.number}<p className="text-xs font-medium text-slate-500">{new Date(bill.billDate).toLocaleDateString("fr-MA")}</p></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{bill.supplierName}</td>
	                  <td className="px-4 py-3 text-xs font-semibold text-slate-500">{[bill.purchaseOrderNumber, bill.goodsReceiptNumber].filter(Boolean).join(" · ") || "-"}</td>
	                  <td className="px-4 py-3">{SUPPLIER_BILL_STATUS_LABELS[bill.status]}</td>
	                  <td className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300">{SUPPLIER_BILL_PAYMENT_STATUS_LABELS[paymentState.paymentStatus]}</td>
	                  <td className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">{formatProcurementMoney(paymentState.paidAmount, bill.currency)}</td>
	                  <td className="px-4 py-3 text-right font-bold text-hicotech-navy dark:text-white">{formatProcurementMoney(paymentState.outstandingAmount, bill.currency)}</td>
	                  <td className="px-4 py-3 text-right font-bold text-hicotech-navy dark:text-white">{formatProcurementMoney(totals.total, bill.currency)}</td>
	                  <td className="px-4 py-3">
	                    <div className="flex justify-end gap-2">
	                      <Link href="/accounting" className={iconActionClassName} aria-label="Voir en Finance" title="Voir en Finance"><Link2 size={15} /></Link>
	                      {canEdit && <button type="button" onClick={() => openEdit(bill)} className={iconActionClassName} aria-label="Modifier" title="Modifier"><Edit3 size={15} /></button>}
	                      {canFinalize && <button type="button" onClick={() => finalizeBill(bill)} className={`${iconActionClassName} border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300`} aria-label="Finaliser la facture" title="Finaliser la facture"><CheckCircle2 size={15} /></button>}
	                      {canPay && <button type="button" onClick={() => openPaymentDialog(bill)} className={`${iconActionClassName} border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300`} aria-label="Enregistrer un règlement" title="Enregistrer un règlement"><CreditCard size={15} /></button>}
	                    </div>
	                  </td>
                </tr>
              );
            })}
            {supplierBills.length === 0 && (
              <tr>
	                <td colSpan={9} className="px-4 py-10 text-center">
                  <FileText className="mx-auto mb-3 text-slate-400" size={28} />
                  <p className="font-display text-base font-bold text-hicotech-navy dark:text-white">Aucune facture fournisseur.</p>
                  <p className="mt-1 text-sm text-slate-500">Cliquez sur &quot;Créer la facture&quot; pour enregistrer une facture reçue.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <SupplierBillDialog editing={Boolean(editingBill)} error={error} form={form} goodsReceipts={goodsReceipts} onChange={setForm} onClose={() => setDialogOpen(false)} onSubmit={submitBill} open={dialogOpen} products={products} purchaseOrders={purchaseOrders} suppliers={suppliers} />
      <SupplierPaymentDialog error={paymentError} form={paymentForm} onChange={setPaymentForm} onClose={() => setPaymentDialogOpen(false)} onSubmit={submitPayment} open={paymentDialogOpen} target={paymentTarget} />
    </main>
  );
}

const iconActionClassName = "grid size-9 place-items-center rounded-lg border border-slate-200 text-hicotech-navy transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-dark-page/50";

function SupplierPaymentDialog({ error, form, onChange, onClose, onSubmit, open, target }: {
  error: string | null;
  form: SupplierPaymentFormState;
  onChange: (form: SupplierPaymentFormState) => void;
  onClose: () => void;
  onSubmit: () => Promise<boolean>;
  open: boolean;
  target: SupplierBill | null;
}) {
  const paymentState = target ? calculateSupplierBillPaymentState(target, procurementLocalService.listSupplierPayments({ workspaceId: PROCUREMENT_WORKSPACE_ID, includeArchived: false }).supplierPayments) : undefined;
  return (
    <EntityDialog
      open={open}
      eyebrow="Règlement fournisseur"
      title="Enregistrer un règlement"
      description={target ? `${target.number} · ${target.supplierName}` : "Règlement lié à une facture fournisseur comptabilisée."}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
      size="md"
      footer={<FormActions onCancel={onClose} submitLabel="Enregistrer le règlement" />}
    >
      <FormSection title="Paiement">
        <FormField label="Date de règlement" required>
          <input type="date" className={entityInputClassName} value={form.paymentDate} onChange={(event) => onChange({ ...form, paymentDate: event.target.value })} />
        </FormField>
        <FormField label="Montant" help={paymentState ? `Solde à payer: ${formatProcurementMoney(paymentState.outstandingAmount, target?.currency ?? DEFAULT_PROCUREMENT_CURRENCY)}` : undefined} required>
          <input type="number" min="0.01" step="0.01" className={entityInputClassName} value={form.amount} onChange={(event) => onChange({ ...form, amount: Number(event.target.value) })} />
        </FormField>
        <FormField label="Mode de règlement">
          <select className={entityInputClassName} value={form.method} onChange={(event) => onChange({ ...form, method: event.target.value as SupplierPaymentMethod })}>
            {Object.entries(SUPPLIER_PAYMENT_METHOD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </FormField>
        <FormField label="Référence">
          <input className={entityInputClassName} value={form.reference} onChange={(event) => onChange({ ...form, reference: event.target.value })} placeholder="Virement, chèque, reçu..." />
        </FormField>
        <FormField label="Notes">
          <textarea className={`${entityInputClassName} md:col-span-2`} rows={3} value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
        </FormField>
      </FormSection>
    </EntityDialog>
  );
}
