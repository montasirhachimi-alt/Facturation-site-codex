"use client";

import { FormEvent, useMemo, useState } from "react";
import { CircleDollarSign, Edit3, Eye, Plus, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EmptyState } from "@/components/empty-state";
import { Filters } from "@/components/filters";
import { FormModal } from "@/components/form-modal";
import { SearchBar } from "@/components/search-bar";
import { formatCurrency, formatDate } from "@/lib/format";
import type { CashEntry, CashEntryCategory, CashEntryType, PaymentModeLabel, TenantScope } from "@/lib/types";

type CashFormState = Omit<CashEntry, "id" | "companyId">;

const pageSize = 6;
const entryTypes: CashEntryType[] = ["Entrée", "Sortie"];
const categories: CashEntryCategory[] = ["Vente", "Achat", "Dépense", "Paiement client", "Paiement fournisseur", "Ajustement"];
const modes: PaymentModeLabel[] = ["Espèces", "Chèque", "Virement", "Carte bancaire"];

export function CashModule({ initialEntries, scope }: { initialEntries: CashEntry[]; scope: TenantScope }) {
  const [entries, setEntries] = useState(initialEntries.filter((entry) => entry.companyId === scope.companyId));
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tous");
  const [modeFilter, setModeFilter] = useState("Tous");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<CashFormState | null>(null);
  const [editingEntry, setEditingEntry] = useState<CashEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CashEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CashEntry | null>(null);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const canWrite = scope.role === "COMPANY_ADMIN" || scope.role === "ACCOUNTANT" || scope.role === "SUPER_ADMIN";

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return entries.filter((entry) => {
      const matchesQuery = [entry.label, entry.reference, entry.category, entry.mode].join(" ").toLowerCase().includes(normalizedQuery);
      const matchesType = typeFilter === "Tous" || entry.type === typeFilter;
      const matchesMode = modeFilter === "Tous" || entry.mode === modeFilter;
      return matchesQuery && matchesType && matchesMode;
    });
  }, [entries, modeFilter, query, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const visibleEntries = filteredEntries.slice((page - 1) * pageSize, page * pageSize);
  const totalIn = entries.filter((entry) => entry.type === "Entrée").reduce((sum, entry) => sum + entry.amount, 0);
  const totalOut = entries.filter((entry) => entry.type === "Sortie").reduce((sum, entry) => sum + entry.amount, 0);
  const balance = totalIn - totalOut;

  function openCreate(type: CashEntryType = "Entrée") {
    setEditingEntry(null);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      type,
      category: type === "Entrée" ? "Paiement client" : "Dépense",
      label: "",
      amount: 0,
      mode: "Espèces",
      reference: ""
    });
  }

  function openEdit(entry: CashEntry) {
    setEditingEntry(entry);
    setForm({
      date: entry.date,
      type: entry.type,
      category: entry.category,
      label: entry.label,
      amount: entry.amount,
      mode: entry.mode,
      reference: entry.reference
    });
  }

  function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !canWrite) return;
    if (editingEntry) {
      setEntries((current) => current.map((entry) => entry.id === editingEntry.id ? { ...editingEntry, ...form } : entry));
    } else {
      setEntries((current) => [{ id: `cash-${Date.now()}`, companyId: scope.companyId, ...form }, ...current]);
    }
    setPage(1);
    setForm(null);
    setEditingEntry(null);
  }

  function confirmDelete() {
    if (!deleteTarget || !canWrite) return;
    setEntries((current) => current.filter((entry) => entry.id !== deleteTarget.id));
    setSelectedEntry((current) => current?.id === deleteTarget.id ? null : current);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Solde caisse" value={formatCurrency(balance)} warning={balance < 0} />
        <Metric label="Entrées" value={formatCurrency(totalIn)} />
        <Metric label="Sorties" value={formatCurrency(totalOut)} warning={totalOut > totalIn} />
        <Metric label="Mouvements" value={entries.length.toString()} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 lg:grid-cols-[1fr_380px] xl:flex-1">
            <SearchBar value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Rechercher libellé, référence, catégorie..." />
            <Filters
              filters={[
                { label: "Type", value: typeFilter, options: ["Tous", ...entryTypes].map((item) => ({ label: item, value: item })), onChange: (value) => { setTypeFilter(value); setPage(1); } },
                { label: "Mode", value: modeFilter, options: ["Tous", ...modes].map((item) => ({ label: item, value: item })), onChange: (value) => { setModeFilter(value); setPage(1); } }
              ]}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" disabled={!canWrite} onClick={() => openCreate("Entrée")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              <Plus size={18} />
              Entrée caisse
            </button>
            <button type="button" disabled={!canWrite} onClick={() => openCreate("Sortie")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-sky disabled:cursor-not-allowed disabled:opacity-50 dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-blue/20">
              <Plus size={18} />
              Sortie caisse
            </button>
          </div>
        </div>

        {loading && <StateLine text="Chargement du journal de caisse..." />}
        {error && <StateLine text={error} danger />}
        {!loading && !error && filteredEntries.length === 0 && (
          <div className="p-5">
            <EmptyState icon={CircleDollarSign} title="Aucun mouvement de caisse" description="Aucun mouvement ne correspond aux critères sélectionnés." />
          </div>
        )}

        {filteredEntries.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead>
                  <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                    {["Date", "Type", "Catégorie", "Libellé", "Mode", "Référence", "Montant", "Actions"].map((column) => (
                      <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleEntries.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                      <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{formatDate(entry.date)}</td>
                      <td className="px-4 py-4"><TypeBadge type={entry.type} /></td>
                      <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">{entry.category}</td>
                      <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{entry.label}</td>
                      <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{entry.mode}</td>
                      <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{entry.reference}</td>
                      <td className={clsx("px-4 py-4 font-bold", entry.type === "Entrée" ? "text-hicotech-green" : "text-hicotech-red")}>
                        {entry.type === "Entrée" ? "+" : "-"} {formatCurrency(entry.amount)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Action label="Voir" icon={<Eye size={16} />} onClick={() => setSelectedEntry(entry)} />
                          <Action label="Modifier" icon={<Edit3 size={16} />} onClick={() => openEdit(entry)} disabled={!canWrite} />
                          <Action label="Supprimer" icon={<Trash2 size={16} />} onClick={() => setDeleteTarget(entry)} danger disabled={!canWrite} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={filteredEntries.length} onPageChange={setPage} />
          </>
        )}
      </section>

      {selectedEntry && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-hicotech-navy dark:text-white">{selectedEntry.label}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{selectedEntry.category} - {selectedEntry.mode} - {selectedEntry.reference}</p>
            </div>
            <button type="button" onClick={() => setSelectedEntry(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Fermer</button>
          </div>
        </section>
      )}

      {form && (
        <FormModal title={editingEntry ? "Modifier mouvement" : "Nouveau mouvement"} onClose={() => setForm(null)} onSubmit={saveEntry}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Date" type="date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} required />
            <label className="block">
              <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Type</span>
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as CashEntryType })} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
                {entryTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Catégorie</span>
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as CashEntryCategory })} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Mode</span>
              <select value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value as PaymentModeLabel })} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
                {modes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <Field label="Libellé" value={form.label} onChange={(value) => setForm({ ...form, label: value })} required />
            <Field label="Montant" type="number" value={form.amount} onChange={(value) => setForm({ ...form, amount: Number(value) })} required />
            <Field label="Référence" value={form.reference} onChange={(value) => setForm({ ...form, reference: value })} />
          </div>
        </FormModal>
      )}

      {deleteTarget && <ConfirmDeleteDialog title="Supprimer ce mouvement ?" description="Cette action retire le mouvement du journal local." onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
    </div>
  );
}

function Metric({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{label}</p>
      <p className={clsx("mt-2 font-display text-2xl font-bold", warning ? "text-hicotech-red" : "text-hicotech-navy dark:text-white")}>{value}</p>
    </article>
  );
}

function TypeBadge({ type }: { type: CashEntryType }) {
  return <span className={clsx("rounded-md px-2 py-1 text-xs font-bold", type === "Entrée" ? "bg-emerald-50 text-hicotech-green" : "bg-red-50 text-hicotech-red")}>{type}</span>;
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
