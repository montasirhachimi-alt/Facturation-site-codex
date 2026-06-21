"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Download, Edit3, FileCheck2, FileText, Plus, Printer, Search, Trash2, X } from "lucide-react";
import { clsx } from "clsx";
import type { BusinessClient, Quote, QuoteLine, QuoteStatus, StockProduct } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { createQuotePdf } from "@/lib/pdf";
import { activeCompanyProfile } from "@/lib/demo-data";
import {
  createDocumentLineFromProduct,
  fillDocumentLineFromProduct,
  findProductByReferenceOrDesignation,
  readProductsFromStorage
} from "@/lib/product-tools";

type QuoteFormState = Omit<Quote, "id">;

const statuses: QuoteStatus[] = ["Brouillon", "Envoyé", "Accepté", "Refusé"];

function quoteTotals(lines: QuoteLine[]) {
  return lines.reduce(
    (sum, line) => {
      const ht = line.quantity * line.unitPrice;
      const vat = ht * (line.vat / 100);
      return {
        ht: sum.ht + ht,
        vat: sum.vat + vat,
        ttc: sum.ttc + ht + vat
      };
    },
    { ht: 0, vat: 0, ttc: 0 }
  );
}

function nextQuoteNumber(quotes: Quote[]) {
  const max = quotes.reduce((value, quote) => {
    const current = Number(quote.number.split("-").at(-1) ?? "0");
    return Number.isFinite(current) ? Math.max(value, current) : value;
  }, 0);
  return `DEV-2026-${String(max + 1).padStart(6, "0")}`;
}

export function QuotesModule({
  initialQuotes,
  clients,
  products
}: {
  initialQuotes: Quote[];
  clients: BusinessClient[];
  products: StockProduct[];
}) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [clientFilter, setClientFilter] = useState("Tous");
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [quoteForm, setQuoteForm] = useState<QuoteFormState | null>(null);
  const [convertedInvoices, setConvertedInvoices] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState(products);

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

  const filteredQuotes = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return quotes.filter((quote) => {
      const client = clients.find((item) => item.id === quote.clientId);
      const matchesQuery = [quote.number, quote.status, client?.company, client?.name]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesStatus = statusFilter === "Tous" || quote.status === statusFilter;
      const matchesClient = clientFilter === "Tous" || quote.clientId === clientFilter;
      return matchesQuery && matchesStatus && matchesClient;
    });
  }, [clientFilter, clients, query, quotes, statusFilter]);

  const summary = useMemo(() => {
    const totals = quotes.reduce((sum, quote) => sum + quoteTotals(quote.lines).ttc, 0);
    return {
      count: quotes.length,
      draft: quotes.filter((quote) => quote.status === "Brouillon").length,
      accepted: quotes.filter((quote) => quote.status === "Accepté").length,
      total: totals
    };
  }, [quotes]);

  function createEmptyQuote(): QuoteFormState {
    const firstProduct = availableProducts[0];
    return {
      number: nextQuoteNumber(quotes),
      date: new Date().toISOString().slice(0, 10),
      clientId: clients[0]?.id ?? "",
      status: "Brouillon",
      lines: [
        createDocumentLineFromProduct(firstProduct, "qline")
      ]
    };
  }

  function openCreateQuote() {
    setEditingQuote(null);
    setQuoteForm(createEmptyQuote());
  }

  function openEditQuote(quote: Quote) {
    setEditingQuote(quote);
    setQuoteForm({
      number: quote.number,
      date: quote.date,
      clientId: quote.clientId,
      status: quote.status,
      lines: quote.lines.map((line) => ({ ...line }))
    });
  }

  function saveQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quoteForm) return;

    if (editingQuote) {
      setQuotes((current) =>
        current.map((quote) => (quote.id === editingQuote.id ? { ...editingQuote, ...quoteForm } : quote))
      );
    } else {
      setQuotes((current) => [{ id: `quote-${Date.now()}`, ...quoteForm }, ...current]);
    }
    setQuoteForm(null);
    setEditingQuote(null);
  }

  function deleteQuote(quoteId: string) {
    setQuotes((current) => current.filter((quote) => quote.id !== quoteId));
  }

  function convertToInvoice(quote: Quote) {
    setConvertedInvoices((current) => (current.includes(quote.id) ? current : [...current, quote.id]));
    setQuotes((current) =>
      current.map((item) => (item.id === quote.id ? { ...item, status: "Accepté" } : item))
    );
  }

  function exportCsv() {
    const rows = [
      ["Numero", "Date", "Client", "Statut", "Total HT", "TVA", "Total TTC"],
      ...quotes.map((quote) => {
        const client = clients.find((item) => item.id === quote.clientId);
        const totals = quoteTotals(quote.lines);
        return [quote.number, quote.date, client?.company ?? "", quote.status, totals.ht.toFixed(2), totals.vat.toFixed(2), totals.ttc.toFixed(2)];
      })
    ];
    const csv = rows.map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "devis.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Devis" value={summary.count.toString()} />
        <Metric label="Brouillons" value={summary.draft.toString()} />
        <Metric label="Acceptés" value={summary.accepted.toString()} />
        <Metric label="Total TTC" value={formatCurrency(summary.total)} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_220px] xl:flex-1">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
              <Search size={18} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent text-sm outline-none dark:text-white dark:placeholder:text-slate-400"
                placeholder="Rechercher numéro, client, statut..."
              />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
              {["Tous", ...statuses].map((status) => <option key={status}>{status}</option>)}
            </select>
            <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
              <option value="Tous">Tous les clients</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.company}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">
              <Download size={18} />
              Export
            </button>
            <button type="button" onClick={openCreateQuote} className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft">
              <Plus size={18} />
              Nouveau devis
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                {["Numéro", "Date", "Client", "Statut", "Total HT", "TVA", "Total TTC", "Actions"].map((column) => (
                  <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((quote) => {
                const client = clients.find((item) => item.id === quote.clientId);
                const totals = quoteTotals(quote.lines);
                return (
                  <tr key={quote.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                    <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{quote.number}</td>
                    <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{formatDate(quote.date)}</td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-hicotech-navy dark:text-white">{client?.company}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{client?.name}</p>
                    </td>
                    <td className="px-4 py-4"><StatusPill status={quote.status} /></td>
                    <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{formatCurrency(totals.ht)}</td>
                    <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{formatCurrency(totals.vat)}</td>
                    <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{formatCurrency(totals.ttc)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Action label="Modifier" icon={<Edit3 size={16} />} onClick={() => openEditQuote(quote)} />
                        <Action label="PDF" icon={<FileText size={16} />} onClick={() => client && createQuotePdf(quote, client, activeCompanyProfile)} />
                        <Action label="Imprimer" icon={<Printer size={16} />} onClick={() => client && createQuotePdf(quote, client, activeCompanyProfile, "print")} />
                        <Action label={convertedInvoices.includes(quote.id) ? "Facturé" : "Facture"} icon={<FileCheck2 size={16} />} onClick={() => convertToInvoice(quote)} />
                        <Action label="Supprimer" icon={<Trash2 size={16} />} onClick={() => deleteQuote(quote.id)} danger />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {quoteForm && (
        <QuoteModal
          title={editingQuote ? "Modifier devis" : "Nouveau devis"}
          form={quoteForm}
          clients={clients}
          products={availableProducts}
          onChange={setQuoteForm}
          onClose={() => {
            setQuoteForm(null);
            setEditingQuote(null);
          }}
          onSubmit={saveQuote}
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white">{value}</p>
    </article>
  );
}

function StatusPill({ status }: { status: QuoteStatus }) {
  const classes = {
    Brouillon: "bg-slate-100 text-slate-600",
    Envoyé: "bg-blue-50 text-hicotech-blue",
    Accepté: "bg-emerald-50 text-hicotech-green",
    Refusé: "bg-red-50 text-hicotech-red"
  };
  return <span className={clsx("rounded-md px-2 py-1 text-xs font-bold", classes[status])}>{status}</span>;
}

function Action({ label, icon, danger, onClick }: { label: string; icon: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={clsx("inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold transition", danger ? "border-red-200 text-hicotech-red hover:bg-red-50" : "border-slate-200 text-hicotech-navy hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-blue/20")}>
      {icon}
      {label}
    </button>
  );
}

function QuoteModal({
  title,
  form,
  clients,
  products,
  onChange,
  onClose,
  onSubmit
}: {
  title: string;
  form: QuoteFormState;
  clients: BusinessClient[];
  products: StockProduct[];
  onChange: (form: QuoteFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const totals = quoteTotals(form.lines);

  function updateLine(lineId: string, patch: Partial<QuoteLine>) {
    onChange({
      ...form,
      lines: form.lines.map((line) => (line.id === lineId ? { ...line, ...patch } : line))
    });
  }

  function lookupProduct(lineId: string, value: string) {
    const product = findProductByReferenceOrDesignation(value, products);
    updateLine(lineId, product ? fillDocumentLineFromProduct(lineId, product) : { reference: value, productId: "", designation: "", description: "", unitPrice: 0, vat: 20, unit: "Pièce" });
  }

  function addLine() {
    const product = products[0];
    onChange({
      ...form,
      lines: [
        ...form.lines,
        createDocumentLineFromProduct(product, "qline")
      ]
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-hicotech-navy dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-hicotech-navy dark:border-hicotech-dark-border dark:text-white" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Field label="Numéro" value={form.number} onChange={(value) => onChange({ ...form, number: value })} />
          <Field label="Date" type="date" value={form.date} onChange={(value) => onChange({ ...form, date: value })} />
          <label className="block">
            <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Client</span>
            <select value={form.clientId} onChange={(event) => onChange({ ...form, clientId: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
              {clients.map((client) => <option key={client.id} value={client.id}>{client.company}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Statut</span>
            <select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as QuoteStatus })} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-6 overflow-x-auto">
          <datalist id="quote-product-options">
            {products.map((product) => (
              <option key={product.id} value={product.reference}>{product.designation}</option>
            ))}
            {products.map((product) => (
              <option key={`${product.id}-designation`} value={product.designation}>{product.reference}</option>
            ))}
          </datalist>
          <table className="w-full min-w-[1260px] text-sm">
            <thead>
              <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                {["Référence produit", "Désignation", "Qté", "Unité", "Prix HT", "TVA", "HT", "TTC", ""].map((column) => <th key={column} className="px-3 py-3">{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {form.lines.map((line) => {
                const ht = line.quantity * line.unitPrice;
                const ttc = ht * (1 + line.vat / 100);
                return (
                  <tr key={line.id} className="border-b border-slate-100 dark:border-hicotech-dark-border">
                    <td className="px-3 py-3">
                      <input list="quote-product-options" value={line.reference ?? ""} onChange={(event) => lookupProduct(line.id, event.target.value)} className="w-44 rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" placeholder="Ex: ECR-75" />
                      {!line.productId && line.reference && (
                        <p className="mt-1 text-xs font-semibold text-hicotech-red">
                          Produit introuvable. Voulez-vous le créer ?
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <input value={line.designation} onChange={(event) => updateLine(line.id, { designation: event.target.value })} className="w-64 rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
                    </td>
                    <td className="px-3 py-3"><SmallInput type="number" value={line.quantity} onChange={(value) => updateLine(line.id, { quantity: Number(value) })} /></td>
                    <td className="px-3 py-3"><input value={line.unit ?? "Pièce"} onChange={(event) => updateLine(line.id, { unit: event.target.value })} className="w-24 rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" /></td>
                    <td className="px-3 py-3"><SmallInput type="number" value={line.unitPrice} onChange={(value) => updateLine(line.id, { unitPrice: Number(value) })} /></td>
                    <td className="px-3 py-3"><SmallInput type="number" value={line.vat} onChange={(value) => updateLine(line.id, { vat: Number(value) })} /></td>
                    <td className="px-3 py-3 font-bold text-hicotech-navy dark:text-white">{formatCurrency(ht)}</td>
                    <td className="px-3 py-3 font-bold text-hicotech-navy dark:text-white">{formatCurrency(ttc)}</td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => onChange({ ...form, lines: form.lines.filter((item) => item.id !== line.id) })} className="rounded-lg border border-red-200 p-2 text-hicotech-red" aria-label="Supprimer ligne">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <button type="button" onClick={addLine} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">
            <Plus size={18} />
            Ajouter une ligne
          </button>
          <div className="w-full max-w-sm space-y-2 rounded-lg bg-hicotech-cloud p-4 text-sm dark:bg-hicotech-dark-page/50">
            <TotalRow label="Total HT" value={totals.ht} />
            <TotalRow label="Total TVA" value={totals.vat} />
            <div className="flex justify-between rounded-lg bg-hicotech-navy px-4 py-3 text-white">
              <span>Total TTC</span>
              <strong>{formatCurrency(totals.ttc)}</strong>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Annuler</button>
          <button type="submit" className="rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
    </label>
  );
}

function SmallInput({ value, type, onChange }: { value: number; type: string; onChange: (value: string) => void }) {
  return <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-24 rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />;
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-hicotech-navy dark:text-white">
      <span>{label}</span>
      <strong>{formatCurrency(value)}</strong>
    </div>
  );
}
