"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit3, Eye, FileText, Plus, Printer, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EmptyState } from "@/components/empty-state";
import { Filters } from "@/components/filters";
import { FormModal } from "@/components/form-modal";
import { SearchBar } from "@/components/search-bar";
import { activeCompanyProfile } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/format";
import { createPurchaseOrderPdf } from "@/lib/pdf";
import { applyStockChange, readProductsFromStorage } from "@/lib/product-tools";
import type { PurchaseInvoice, PurchaseInvoiceLine, PurchaseStatus, SalesDocument, StockProduct, Supplier, TenantScope } from "@/lib/types";

type PurchaseFormState = Omit<PurchaseInvoice, "id" | "companyId">;

const pageSize = 5;
const statuses: PurchaseStatus[] = ["Brouillon", "Validée", "Partiellement payée", "Payée", "En retard"];

export function PurchasesModule({
  initialPurchases,
  suppliers,
  products,
  scope
}: {
  initialPurchases: PurchaseInvoice[];
  suppliers: Supplier[];
  products: StockProduct[];
  scope: TenantScope;
}) {
  const [purchases, setPurchases] = useState(initialPurchases.filter((purchase) => purchase.companyId === scope.companyId));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tous");
  const [supplierFilter, setSupplierFilter] = useState("Tous");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<PurchaseFormState | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseInvoice | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseInvoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseInvoice | null>(null);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState(products);
  const canWrite = scope.role === "COMPANY_ADMIN" || scope.role === "ACCOUNTANT" || scope.role === "SUPER_ADMIN";
  const scopedSuppliers = suppliers.filter((supplier) => supplier.companyId === scope.companyId);

  useEffect(() => {
    setAvailableProducts(readProductsFromStorage(products));
    function syncProducts() {
      setAvailableProducts(readProductsFromStorage(products));
    }
    window.addEventListener("hicotech-products-updated", syncProducts);
    window.addEventListener("storage", syncProducts);
    return () => {
      window.removeEventListener("hicotech-products-updated", syncProducts);
      window.removeEventListener("storage", syncProducts);
    };
  }, [products]);

  const filteredPurchases = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return purchases.filter((purchase) => {
      const supplier = scopedSuppliers.find((item) => item.id === purchase.supplierId);
      const matchesQuery = [purchase.number, purchase.status, supplier?.name ?? "", purchase.lines.map((line) => line.designation).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesStatus = status === "Tous" || purchase.status === status;
      const matchesSupplier = supplierFilter === "Tous" || purchase.supplierId === supplierFilter;
      return matchesQuery && matchesStatus && matchesSupplier;
    });
  }, [purchases, query, scopedSuppliers, status, supplierFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / pageSize));
  const visiblePurchases = filteredPurchases.slice((page - 1) * pageSize, page * pageSize);
  const totalPurchases = purchases.reduce((sum, purchase) => sum + getPurchaseTotal(purchase), 0);
  const totalPaid = purchases.reduce((sum, purchase) => sum + purchase.paid, 0);
  const overdue = purchases.filter((purchase) => purchase.status === "En retard").length;

  function openCreate() {
    const firstSupplier = scopedSuppliers[0]?.id ?? "";
    setEditingPurchase(null);
    setForm({
      number: `ACH-2026-${String(purchases.length + 42).padStart(5, "0")}`,
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      supplierId: firstSupplier,
      status: "Brouillon",
      paid: 0,
      lines: [createLine(availableProducts[0])]
    });
  }

  function openEdit(purchase: PurchaseInvoice) {
    setEditingPurchase(purchase);
    setForm({
      number: purchase.number,
      date: purchase.date,
      dueDate: purchase.dueDate,
      supplierId: purchase.supplierId,
      status: purchase.status,
      paid: purchase.paid,
      lines: purchase.lines
    });
  }

  function savePurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !canWrite) return;
    if (editingPurchase) {
      setPurchases((current) => current.map((purchase) => purchase.id === editingPurchase.id ? { ...editingPurchase, ...form } : purchase));
      if (!isStockStatus(editingPurchase.status) && isStockStatus(form.status)) {
        applyStockChange(form.lines, "purchase", availableProducts);
      }
    } else {
      setPurchases((current) => [{ id: `purchase-${Date.now()}`, companyId: scope.companyId, ...form }, ...current]);
      if (isStockStatus(form.status)) {
        applyStockChange(form.lines, "purchase", availableProducts);
      }
    }
    setPage(1);
    setForm(null);
    setEditingPurchase(null);
  }

  function confirmDelete() {
    if (!deleteTarget || !canWrite) return;
    setPurchases((current) => current.filter((purchase) => purchase.id !== deleteTarget.id));
    setSelectedPurchase((current) => current?.id === deleteTarget.id ? null : current);
    setDeleteTarget(null);
  }

  function updateLine(lineId: string, patch: Partial<PurchaseInvoiceLine>) {
    if (!form) return;
    setForm({
      ...form,
      lines: form.lines.map((line) => line.id === lineId ? { ...line, ...patch } : line)
    });
  }

  function changeLineProduct(lineId: string, productId: string) {
    const product = availableProducts.find((item) => item.id === productId);
    updateLine(lineId, {
      productId,
      designation: product?.designation ?? "",
      unitPrice: product?.purchasePrice ?? 0,
      vat: product?.vat ?? 20
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Factures d'achat" value={purchases.length.toString()} />
        <Metric label="Total achats TTC" value={formatCurrency(totalPurchases)} />
        <Metric label="Montant payé" value={formatCurrency(totalPaid)} />
        <Metric label="En retard" value={overdue.toString()} warning={overdue > 0} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 lg:grid-cols-[1fr_380px] xl:flex-1">
            <SearchBar value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Rechercher numéro, fournisseur, produit..." />
            <Filters
              filters={[
                { label: "Statut", value: status, options: ["Tous", ...statuses].map((item) => ({ label: item, value: item })), onChange: (value) => { setStatus(value); setPage(1); } },
                { label: "Fournisseur", value: supplierFilter, options: [{ label: "Tous", value: "Tous" }, ...scopedSuppliers.map((supplier) => ({ label: supplier.name, value: supplier.id }))], onChange: (value) => { setSupplierFilter(value); setPage(1); } }
              ]}
            />
          </div>
          <button type="button" disabled={!canWrite} onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Plus size={18} />
            Nouvelle facture d&apos;achat
          </button>
        </div>

        {loading && <StateLine text="Chargement des factures d'achat..." />}
        {error && <StateLine text={error} danger />}
        {!loading && !error && filteredPurchases.length === 0 && (
          <div className="p-5">
            <EmptyState icon={FileText} title="Aucune facture d'achat" description="Aucune facture d'achat ne correspond aux critères sélectionnés." />
          </div>
        )}

        {filteredPurchases.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse text-sm">
                <thead>
                  <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                    {["N°", "Date", "Fournisseur", "Statut", "Total TTC", "Payé", "Reste", "Actions"].map((column) => (
                      <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiblePurchases.map((purchase) => {
                    const total = getPurchaseTotal(purchase);
                    const supplier = scopedSuppliers.find((item) => item.id === purchase.supplierId);
                    return (
                      <tr key={purchase.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                        <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{purchase.number}</td>
                        <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{formatDate(purchase.date)}</td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-hicotech-navy dark:text-white">{supplier?.name ?? "Fournisseur supprimé"}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-300">{purchase.lines.length} ligne(s)</p>
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={purchase.status} /></td>
                        <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{formatCurrency(total)}</td>
                        <td className="px-4 py-4 font-medium text-hicotech-green">{formatCurrency(purchase.paid)}</td>
                        <td className={clsx("px-4 py-4 font-bold", total - purchase.paid > 0 ? "text-hicotech-red" : "text-hicotech-green")}>{formatCurrency(total - purchase.paid)}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Action label="Voir" icon={<Eye size={16} />} onClick={() => setSelectedPurchase(purchase)} />
                            <Action label="Modifier" icon={<Edit3 size={16} />} onClick={() => openEdit(purchase)} disabled={!canWrite} />
                            <Action label="Imprimer" icon={<Printer size={16} />} onClick={() => supplier && createPurchaseOrderPdf(toPurchaseSalesDocument(purchase, supplier), activeCompanyProfile, "print")} />
                            <Action label="Supprimer" icon={<Trash2 size={16} />} onClick={() => setDeleteTarget(purchase)} danger disabled={!canWrite} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={filteredPurchases.length} onPageChange={setPage} />
          </>
        )}
      </section>

      {selectedPurchase && <PurchaseDetails purchase={selectedPurchase} supplier={scopedSuppliers.find((supplier) => supplier.id === selectedPurchase.supplierId)} onClose={() => setSelectedPurchase(null)} />}

      {form && (
        <FormModal title={editingPurchase ? "Modifier facture d'achat" : "Nouvelle facture d'achat"} onClose={() => setForm(null)} onSubmit={savePurchase} submitLabel="Enregistrer">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Numéro" value={form.number} onChange={(value) => setForm({ ...form, number: value })} required />
            <Field label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} required />
            <Field label="Échéance" type="date" value={form.dueDate} onChange={(value) => setForm({ ...form, dueDate: value })} />
            <label className="block">
              <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Fournisseur</span>
              <select value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
                {scopedSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Statut</span>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PurchaseStatus })} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
                {statuses.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <Field label="Montant payé" type="number" value={form.paid} onChange={(value) => setForm({ ...form, paid: Number(value) })} />
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 dark:border-hicotech-dark-border">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border">
              <h3 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Produits achetés</h3>
              <button type="button" onClick={() => setForm({ ...form, lines: [...form.lines, createLine(availableProducts[0])] })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Ajouter ligne</button>
            </div>
            <div className="space-y-3 p-4">
              {form.lines.map((line) => (
                <div key={line.id} className="grid gap-3 rounded-lg bg-slate-50 p-3 dark:bg-hicotech-dark-page/50 md:grid-cols-[1.4fr_90px_120px_90px_90px]">
                  <select value={line.productId} onChange={(event) => changeLineProduct(line.id, event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white">
                    {availableProducts.map((product) => <option key={product.id} value={product.id}>{product.designation}</option>)}
                  </select>
                  <input type="number" min={1} value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: Number(event.target.value) })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white" />
                  <input type="number" value={line.unitPrice} onChange={(event) => updateLine(line.id, { unitPrice: Number(event.target.value) })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white" />
                  <input type="number" value={line.vat} onChange={(event) => updateLine(line.id, { vat: Number(event.target.value) })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white" />
                  <button type="button" onClick={() => setForm({ ...form, lines: form.lines.filter((item) => item.id !== line.id) })} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-hicotech-red">Retirer</button>
                </div>
              ))}
              <p className="text-right font-display text-xl font-bold text-hicotech-navy dark:text-white">Total TTC : {formatCurrency(getPurchaseTotal(form))}</p>
            </div>
          </div>
        </FormModal>
      )}

      {deleteTarget && <ConfirmDeleteDialog title="Supprimer cette facture d'achat ?" description="Cette action retire la facture d'achat de la liste locale." onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
    </div>
  );
}

function createLine(product?: StockProduct): PurchaseInvoiceLine {
  return {
    id: `pil-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    productId: product?.id ?? "",
    designation: product?.designation ?? "",
    quantity: 1,
    unitPrice: product?.purchasePrice ?? 0,
    vat: product?.vat ?? 20
  };
}

function isStockStatus(status: PurchaseStatus) {
  return status === "Validée" || status === "Partiellement payée" || status === "Payée";
}

function toPurchaseSalesDocument(purchase: PurchaseInvoice, supplier: Supplier): SalesDocument {
  return {
    type: "DEVIS",
    number: purchase.number,
    date: purchase.date,
    customer: {
      name: supplier.name,
      address: supplier.address,
      city: supplier.city,
      ice: supplier.ice,
      phone: supplier.phone
    },
    lines: purchase.lines.map((line) => ({
      designation: line.designation,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      vat: line.vat
    })),
    amountInWords: ""
  };
}

function getPurchaseTotal(purchase: Pick<PurchaseInvoice, "lines">) {
  return purchase.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (1 + line.vat / 100), 0);
}

function Metric({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{label}</p>
      <p className={clsx("mt-2 font-display text-2xl font-bold", warning ? "text-hicotech-red" : "text-hicotech-navy dark:text-white")}>{value}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: PurchaseStatus }) {
  return (
    <span className={clsx("rounded-md px-2 py-1 text-xs font-bold", status === "Payée" ? "bg-emerald-50 text-hicotech-green" : status === "En retard" ? "bg-red-50 text-hicotech-red" : "bg-blue-50 text-hicotech-blue")}>{status}</span>
  );
}

function StateLine({ text, danger }: { text: string; danger?: boolean }) {
  return <p className={clsx("p-5 text-sm font-semibold", danger ? "text-hicotech-red" : "text-slate-500 dark:text-slate-300")}>{text}</p>;
}

function Action({ label, icon, danger, disabled, onClick }: { label: string; icon: React.ReactNode; danger?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={clsx("inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40", danger ? "border-red-200 text-hicotech-red hover:bg-red-50" : "border-slate-200 text-hicotech-navy hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-blue/20")}>
      {icon}
      {label}
    </button>
  );
}

function Pagination({ page, totalPages, total, onPageChange }: { page: number; totalPages: number; total: number; onPageChange: (page: number) => void }) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 p-4 text-sm dark:border-hicotech-dark-border md:flex-row md:items-center md:justify-between">
      <p className="text-slate-500 dark:text-slate-300">{total} résultat(s)</p>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40 dark:border-hicotech-dark-border">Précédent</button>
        <span className="font-bold text-hicotech-navy dark:text-white">{page} / {totalPages}</span>
        <button type="button" disabled={page === totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40 dark:border-hicotech-dark-border">Suivant</button>
      </div>
    </div>
  );
}

function Field({ label, value, type = "text", required, onChange }: { label: string; value: string | number; type?: string; required?: boolean; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
    </label>
  );
}

function PurchaseDetails({ purchase, supplier, onClose }: { purchase: PurchaseInvoice; supplier?: Supplier; onClose: () => void }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-hicotech-navy dark:text-white">{purchase.number}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{supplier?.name ?? "Fournisseur supprimé"} - {formatDate(purchase.date)}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Fermer</button>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
              {["Désignation", "Qté", "PU HT", "TVA", "Total TTC"].map((column) => <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {purchase.lines.map((line) => (
              <tr key={line.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{line.designation}</td>
                <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{line.quantity}</td>
                <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{formatCurrency(line.unitPrice)}</td>
                <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{line.vat}%</td>
                <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{formatCurrency(line.quantity * line.unitPrice * (1 + line.vat / 100))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
