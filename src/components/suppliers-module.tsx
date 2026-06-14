"use client";

import { FormEvent, useMemo, useState } from "react";
import { Building2, Edit3, Eye, Plus, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EmptyState } from "@/components/empty-state";
import { Filters } from "@/components/filters";
import { FormModal } from "@/components/form-modal";
import { SearchBar } from "@/components/search-bar";
import { formatCurrency } from "@/lib/format";
import type { PurchaseInvoice, Supplier, TenantScope } from "@/lib/types";

type SupplierFormState = Omit<Supplier, "id" | "companyId" | "balance">;

const emptySupplier: SupplierFormState = {
  name: "",
  contactName: "",
  ice: "",
  taxId: "",
  rc: "",
  phone: "",
  email: "",
  address: "",
  city: ""
};

const pageSize = 5;

export function SuppliersModule({
  initialSuppliers,
  purchases,
  scope
}: {
  initialSuppliers: Supplier[];
  purchases: PurchaseInvoice[];
  scope: TenantScope;
}) {
  const [suppliers, setSuppliers] = useState(initialSuppliers.filter((supplier) => supplier.companyId === scope.companyId));
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Toutes");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<SupplierFormState | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const canWrite = scope.role !== "READ_ONLY";

  const cities = useMemo(() => ["Toutes", ...Array.from(new Set(suppliers.map((supplier) => supplier.city)))], [suppliers]);
  const filteredSuppliers = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return suppliers.filter((supplier) => {
      const matchesQuery = [
        supplier.name,
        supplier.contactName,
        supplier.ice,
        supplier.taxId,
        supplier.rc,
        supplier.phone,
        supplier.email,
        supplier.address,
        supplier.city
      ].join(" ").toLowerCase().includes(normalizedQuery);
      const matchesCity = city === "Toutes" || supplier.city === city;
      return matchesQuery && matchesCity;
    });
  }, [city, query, suppliers]);

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / pageSize));
  const visibleSuppliers = filteredSuppliers.slice((page - 1) * pageSize, page * pageSize);
  const scopedPurchases = purchases.filter((purchase) => purchase.companyId === scope.companyId);
  const totalBalance = suppliers.reduce((sum, supplier) => sum + supplier.balance, 0);

  function getSupplierStats(supplierId: string) {
    const supplierPurchases = scopedPurchases.filter((purchase) => purchase.supplierId === supplierId);
    const total = supplierPurchases.reduce((sum, purchase) => sum + getPurchaseTotal(purchase), 0);
    const paid = supplierPurchases.reduce((sum, purchase) => sum + purchase.paid, 0);
    return { count: supplierPurchases.length, total, paid, rest: total - paid, purchases: supplierPurchases };
  }

  function openCreate() {
    setEditingSupplier(null);
    setForm(emptySupplier);
  }

  function openEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name,
      contactName: supplier.contactName,
      ice: supplier.ice,
      taxId: supplier.taxId,
      rc: supplier.rc,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      city: supplier.city
    });
  }

  function saveSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !canWrite) return;
    if (editingSupplier) {
      setSuppliers((current) =>
        current.map((supplier) => supplier.id === editingSupplier.id ? { ...editingSupplier, ...form } : supplier)
      );
    } else {
      setSuppliers((current) => [{ id: `supplier-${Date.now()}`, companyId: scope.companyId, balance: 0, ...form }, ...current]);
    }
    setPage(1);
    setForm(null);
    setEditingSupplier(null);
  }

  function confirmDelete() {
    if (!deleteTarget || !canWrite) return;
    setSuppliers((current) => current.filter((supplier) => supplier.id !== deleteTarget.id));
    setSelectedSupplier((current) => current?.id === deleteTarget.id ? null : current);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Fournisseurs" value={suppliers.length.toString()} />
        <Metric label="Factures d'achat" value={scopedPurchases.length.toString()} />
        <Metric label="Reste à payer" value={formatCurrency(totalBalance)} warning={totalBalance > 0} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-[1fr_180px] xl:flex-1">
            <SearchBar value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Rechercher fournisseur, ICE, contact..." />
            <Filters filters={[{ label: "Ville", value: city, options: cities.map((item) => ({ label: item, value: item })), onChange: (value) => { setCity(value); setPage(1); } }]} />
          </div>
          <button type="button" disabled={!canWrite} onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Plus size={18} />
            Ajouter fournisseur
          </button>
        </div>

        {loading && <StateLine text="Chargement des fournisseurs..." />}
        {error && <StateLine text={error} danger />}
        {!loading && !error && filteredSuppliers.length === 0 && (
          <div className="p-5">
            <EmptyState icon={Building2} title="Aucun fournisseur" description="Aucun fournisseur ne correspond aux critères sélectionnés." />
          </div>
        )}

        {filteredSuppliers.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                    {["Fournisseur", "ICE / IF / RC", "Contact", "Ville", "Factures", "Total achats", "Payé", "Reste", "Actions"].map((column) => (
                      <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleSuppliers.map((supplier) => {
                    const stats = getSupplierStats(supplier.id);
                    return (
                      <tr key={supplier.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                        <td className="px-4 py-4">
                          <p className="font-bold text-hicotech-navy dark:text-white">{supplier.name}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{supplier.contactName}</p>
                          <p className="mt-1 max-w-64 text-xs text-slate-500 dark:text-slate-300">{supplier.address}</p>
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          <p>ICE : {supplier.ice}</p>
                          <p>IF : {supplier.taxId}</p>
                          <p>RC : {supplier.rc}</p>
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          <p>{supplier.phone}</p>
                          <p>{supplier.email}</p>
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{supplier.city}</td>
                        <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{stats.count}</td>
                        <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{formatCurrency(stats.total)}</td>
                        <td className="px-4 py-4 font-medium text-hicotech-green">{formatCurrency(stats.paid)}</td>
                        <td className={clsx("px-4 py-4 font-bold", stats.rest > 0 ? "text-hicotech-red" : "text-hicotech-green")}>{formatCurrency(stats.rest)}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Action label="Voir" icon={<Eye size={16} />} onClick={() => setSelectedSupplier(supplier)} />
                            <Action label="Modifier" icon={<Edit3 size={16} />} onClick={() => openEdit(supplier)} disabled={!canWrite} />
                            <Action label="Supprimer" icon={<Trash2 size={16} />} onClick={() => setDeleteTarget(supplier)} danger disabled={!canWrite} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={filteredSuppliers.length} onPageChange={setPage} />
          </>
        )}
      </section>

      {selectedSupplier && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
          <h2 className="font-display text-xl font-bold text-hicotech-navy dark:text-white">Historique fournisseur - {selectedSupplier.name}</h2>
          <div className="mt-4 space-y-3">
            {getSupplierStats(selectedSupplier.id).purchases.map((purchase) => (
              <div key={purchase.id} className="grid gap-3 rounded-lg border border-slate-200 p-4 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40 md:grid-cols-[150px_1fr_150px_150px]">
                <span className="font-bold text-hicotech-navy dark:text-white">{purchase.number}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{purchase.status}</span>
                <span className="font-bold text-hicotech-navy dark:text-white">{formatCurrency(getPurchaseTotal(purchase))}</span>
                <span className="font-bold text-hicotech-red">Reste {formatCurrency(getPurchaseTotal(purchase) - purchase.paid)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {form && (
        <FormModal title={editingSupplier ? "Modifier fournisseur" : "Ajouter fournisseur"} onClose={() => setForm(null)} onSubmit={saveSupplier}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom fournisseur" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <Field label="Contact" value={form.contactName} onChange={(value) => setForm({ ...form, contactName: value })} />
            <Field label="ICE" value={form.ice} onChange={(value) => setForm({ ...form, ice: value })} />
            <Field label="IF" value={form.taxId} onChange={(value) => setForm({ ...form, taxId: value })} />
            <Field label="RC" value={form.rc} onChange={(value) => setForm({ ...form, rc: value })} />
            <Field label="Téléphone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <Field label="Ville" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Adresse</span>
              <textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
            </label>
          </div>
        </FormModal>
      )}

      {deleteTarget && (
        <ConfirmDeleteDialog title="Supprimer ce fournisseur ?" description="Le fournisseur sera retiré de cette vue. Les factures historiques restent disponibles dans le module achats." onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      )}
    </div>
  );
}

function getPurchaseTotal(purchase: PurchaseInvoice) {
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

function Field({ label, value, type = "text", required, onChange }: { label: string; value: string; type?: string; required?: boolean; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
    </label>
  );
}
