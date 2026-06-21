"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Ban, CreditCard, Download, Eye, FileText, Plus, Printer, Search, X } from "lucide-react";
import { clsx } from "clsx";
import type { BusinessClient, Invoice, InvoiceLine, InvoicePayment, InvoiceStatus, PaymentModeLabel, StockProduct } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { createInvoicePdf } from "@/lib/pdf";
import { activeCompanyProfile } from "@/lib/demo-data";
import {
  applyStockChange,
  createDocumentLineFromProduct,
  fillDocumentLineFromProduct,
  findProductByReferenceOrDesignation,
  readProductsFromStorage
} from "@/lib/product-tools";

const statuses: Array<"Tous" | InvoiceStatus> = ["Tous", "Payée", "Partiellement payée", "En retard", "Annulée"];
const modes: PaymentModeLabel[] = ["Espèces", "Chèque", "Virement", "Carte bancaire"];
const pageSize = 5;
type InvoiceFormState = Omit<Invoice, "id" | "payments">;

function invoiceTotals(invoice: Invoice) {
  const totals = invoice.lines.reduce(
    (sum, line) => {
      const ht = line.quantity * line.unitPrice;
      const vat = ht * (line.vat / 100);
      return { ht: sum.ht + ht, vat: sum.vat + vat, ttc: sum.ttc + ht + vat };
    },
    { ht: 0, vat: 0, ttc: 0 }
  );
  const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return { ...totals, paid, outstanding: Math.max(0, totals.ttc - paid) };
}

function nextInvoiceNumber(invoices: Invoice[]) {
  const max = invoices.reduce((value, invoice) => {
    const current = Number(invoice.number.split("-").at(-1) ?? "0");
    return Number.isFinite(current) ? Math.max(value, current) : value;
  }, 0);
  return `FAC-2026-${String(max + 1).padStart(6, "0")}`;
}

export function InvoicesModule({
  initialInvoices,
  clients,
  products
}: {
  initialInvoices: Invoice[];
  clients: BusinessClient[];
  products: StockProduct[];
}) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>("Tous");
  const [clientFilter, setClientFilter] = useState("Tous");
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentModeLabel>("Virement");
  const [paymentReference, setPaymentReference] = useState("");
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormState | null>(null);
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

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return invoices.filter((invoice) => {
      const client = clients.find((item) => item.id === invoice.clientId);
      const matchesQuery = [invoice.number, invoice.status, client?.company, client?.name]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesStatus = statusFilter === "Tous" || invoice.status === statusFilter;
      const matchesClient = clientFilter === "Tous" || invoice.clientId === clientFilter;
      return matchesQuery && matchesStatus && matchesClient;
    });
  }, [clientFilter, clients, invoices, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const visibleInvoices = filteredInvoices.slice((page - 1) * pageSize, page * pageSize);
  const summary = invoices.reduce(
    (sum, invoice) => {
      const totals = invoiceTotals(invoice);
      return {
        count: sum.count + 1,
        total: sum.total + totals.ttc,
        paid: sum.paid + totals.paid,
        outstanding: sum.outstanding + totals.outstanding
      };
    },
    { count: 0, total: 0, paid: 0, outstanding: 0 }
  );

  function openPayment(invoice: Invoice) {
    const totals = invoiceTotals(invoice);
    setPaymentInvoice(invoice);
    setPaymentAmount(totals.outstanding);
    setPaymentMode("Virement");
    setPaymentReference("");
  }

  function createEmptyInvoice(): InvoiceFormState {
    const product = availableProducts[0];
    return {
      number: nextInvoiceNumber(invoices),
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      clientId: clients[0]?.id ?? "",
      status: "Partiellement payée",
      lines: [
        createDocumentLineFromProduct(product, "iline")
      ]
    };
  }

  function saveInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invoiceForm) return;
    const newInvoice = { id: `invoice-${Date.now()}`, ...invoiceForm, payments: [] };
    setInvoices((current) => [newInvoice, ...current]);
    if (newInvoice.status !== "Annulée") {
      applyStockChange(newInvoice.lines, "sale", availableProducts);
    }
    setInvoiceForm(null);
    setPage(1);
  }

  function cancelInvoice(invoice: Invoice) {
    if (invoice.status === "Annulée") return;
    setInvoices((current) => current.map((item) => item.id === invoice.id ? { ...item, status: "Annulée" } : item));
    applyStockChange(invoice.lines, "sale-cancel", availableProducts);
  }

  function savePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentInvoice) return;

    const payment: InvoicePayment = {
      id: `pay-${Date.now()}`,
      invoiceId: paymentInvoice.id,
      date: new Date().toISOString().slice(0, 10),
      amount: paymentAmount,
      mode: paymentMode,
      reference: paymentReference
    };

    setInvoices((current) =>
      current.map((invoice) => {
        if (invoice.id !== paymentInvoice.id) return invoice;
        const payments = [payment, ...invoice.payments];
        const paid = payments.reduce((sum, item) => sum + item.amount, 0);
        const total = invoiceTotals({ ...invoice, payments: [] }).ttc;
        return {
          ...invoice,
          payments,
          status: paid >= total ? "Payée" : paid > 0 ? "Partiellement payée" : invoice.status
        };
      })
    );
    setPaymentInvoice(null);
  }

  function exportCsv() {
    const rows = [
      ["Numero", "Date", "Echeance", "Client", "Statut", "Total TTC", "Paye", "Reste"],
      ...invoices.map((invoice) => {
        const client = clients.find((item) => item.id === invoice.clientId);
        const totals = invoiceTotals(invoice);
        return [invoice.number, invoice.date, invoice.dueDate, client?.company ?? "", invoice.status, totals.ttc.toFixed(2), totals.paid.toFixed(2), totals.outstanding.toFixed(2)];
      })
    ];
    const blob = new Blob([rows.map((row) => row.join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "factures.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Factures" value={summary.count.toString()} />
        <Metric label="Total TTC" value={formatCurrency(summary.total)} />
        <Metric label="Montant payé" value={formatCurrency(summary.paid)} />
        <Metric label="Reste à payer" value={formatCurrency(summary.outstanding)} warning />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-[1fr_190px_220px] xl:flex-1">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
              <Search size={18} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-sm outline-none dark:text-white dark:placeholder:text-slate-400"
                placeholder="Rechercher numéro, client, statut..."
              />
            </div>
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as (typeof statuses)[number]); setPage(1); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <select value={clientFilter} onChange={(event) => { setClientFilter(event.target.value); setPage(1); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
              <option value="Tous">Tous les clients</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.company}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">
              <Download size={18} />
              Export
            </button>
            <button
              type="button"
              onClick={() => setInvoiceForm(createEmptyInvoice())}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft"
            >
              <Plus size={18} />
              Nouvelle facture
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead>
              <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                {["Numéro", "Date", "Client", "Statut", "Total TTC", "Payé", "Reste", "Actions"].map((column) => (
                  <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleInvoices.map((invoice) => {
                const client = clients.find((item) => item.id === invoice.clientId);
                const totals = invoiceTotals(invoice);
                return (
                  <tr key={invoice.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                    <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{invoice.number}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">
                      <p>{formatDate(invoice.date)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">Échéance {formatDate(invoice.dueDate)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-hicotech-navy dark:text-white">{client?.company}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{client?.name}</p>
                    </td>
                    <td className="px-4 py-4"><Status status={invoice.status} /></td>
                    <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{formatCurrency(totals.ttc)}</td>
                    <td className="px-4 py-4 font-bold text-hicotech-green">{formatCurrency(totals.paid)}</td>
                    <td className={clsx("px-4 py-4 font-bold", totals.outstanding > 0 ? "text-hicotech-red" : "text-hicotech-green")}>{formatCurrency(totals.outstanding)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Action label="Historique" icon={<Eye size={16} />} onClick={() => setSelectedInvoice(invoice)} />
                        <Action label="Paiement" icon={<CreditCard size={16} />} onClick={() => openPayment(invoice)} />
                        <Action label="PDF" icon={<FileText size={16} />} onClick={() => client && createInvoicePdf(invoice, client, activeCompanyProfile)} />
                        <Action label="Imprimer" icon={<Printer size={16} />} onClick={() => client && createInvoicePdf(invoice, client, activeCompanyProfile, "print")} />
                        <Action label="Annuler" icon={<Ban size={16} />} onClick={() => cancelInvoice(invoice)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 text-sm dark:border-hicotech-dark-border md:flex-row md:items-center md:justify-between">
          <p className="text-slate-500 dark:text-slate-300">{filteredInvoices.length} facture(s) trouvée(s)</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40 dark:border-hicotech-dark-border">Précédent</button>
            <span className="font-bold text-hicotech-navy dark:text-white">{page} / {totalPages}</span>
            <button type="button" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40 dark:border-hicotech-dark-border">Suivant</button>
          </div>
        </div>
      </section>

      {selectedInvoice && <PaymentHistory invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
      {paymentInvoice && (
        <PaymentModal
          invoice={paymentInvoice}
          amount={paymentAmount}
          mode={paymentMode}
          reference={paymentReference}
          onAmountChange={setPaymentAmount}
          onModeChange={setPaymentMode}
          onReferenceChange={setPaymentReference}
          onClose={() => setPaymentInvoice(null)}
          onSubmit={savePayment}
        />
      )}
      {invoiceForm && (
        <InvoiceModal
          form={invoiceForm}
          clients={clients}
          products={availableProducts}
          onChange={setInvoiceForm}
          onClose={() => setInvoiceForm(null)}
          onSubmit={saveInvoice}
        />
      )}
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

function Status({ status }: { status: InvoiceStatus }) {
  const classes = {
    Payée: "bg-emerald-50 text-hicotech-green",
    "Partiellement payée": "bg-blue-50 text-hicotech-blue",
    "En retard": "bg-red-50 text-hicotech-red",
    Annulée: "bg-slate-100 text-slate-600"
  };
  return <span className={clsx("rounded-md px-2 py-1 text-xs font-bold", classes[status])}>{status}</span>;
}

function Action({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-bold text-hicotech-navy transition hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-blue/20">
      {icon}
      {label}
    </button>
  );
}

function PaymentHistory({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const totals = invoiceTotals(invoice);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-hicotech-navy dark:text-white">Historique des paiements</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{invoice.number} - Payé {formatCurrency(totals.paid)} / reste {formatCurrency(totals.outstanding)}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Fermer</button>
      </div>
      <div className="mt-5 space-y-3">
        {invoice.payments.length === 0 && <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-hicotech-dark-border dark:text-slate-300">Aucun paiement enregistré.</p>}
        {invoice.payments.map((payment) => (
          <div key={payment.id} className="grid gap-3 rounded-lg border border-slate-200 p-4 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40 md:grid-cols-[120px_1fr_140px_140px]">
            <span className="font-bold text-hicotech-navy dark:text-white">{formatDate(payment.date)}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{payment.mode} - {payment.reference}</span>
            <span className="font-bold text-hicotech-green">{formatCurrency(payment.amount)}</span>
            <span className="text-slate-500 dark:text-slate-300">{payment.invoiceId}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PaymentModal({
  invoice,
  amount,
  mode,
  reference,
  onAmountChange,
  onModeChange,
  onReferenceChange,
  onClose,
  onSubmit
}: {
  invoice: Invoice;
  amount: number;
  mode: PaymentModeLabel;
  reference: string;
  onAmountChange: (amount: number) => void;
  onModeChange: (mode: PaymentModeLabel) => void;
  onReferenceChange: (reference: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-hicotech-navy dark:text-white">Ajouter paiement</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{invoice.number}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-hicotech-navy dark:border-hicotech-dark-border dark:text-white" aria-label="Fermer"><X size={18} /></button>
        </div>
        <div className="mt-6 grid gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Montant</span>
            <input type="number" value={amount} onChange={(event) => onAmountChange(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Mode</span>
            <select value={mode} onChange={(event) => onModeChange(event.target.value as PaymentModeLabel)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
              {modes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Référence</span>
            <input value={reference} onChange={(event) => onReferenceChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
          </label>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Annuler</button>
          <button type="submit" className="rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}

function InvoiceModal({
  form,
  clients,
  products,
  onChange,
  onClose,
  onSubmit
}: {
  form: InvoiceFormState;
  clients: BusinessClient[];
  products: StockProduct[];
  onChange: (form: InvoiceFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const totals = form.lines.reduce(
    (sum, line) => {
      const ht = line.quantity * line.unitPrice;
      const vat = ht * (line.vat / 100);
      return { ht: sum.ht + ht, vat: sum.vat + vat, ttc: sum.ttc + ht + vat };
    },
    { ht: 0, vat: 0, ttc: 0 }
  );

  function updateLine(lineId: string, patch: Partial<InvoiceLine>) {
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
        createDocumentLineFromProduct(product, "iline")
      ]
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-hicotech-navy dark:text-white">Nouvelle facture</h2>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-hicotech-navy dark:border-hicotech-dark-border dark:text-white" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Input label="Numéro" value={form.number} onChange={(value) => onChange({ ...form, number: value })} />
          <Input label="Date" type="date" value={form.date} onChange={(value) => onChange({ ...form, date: value })} />
          <Input label="Échéance" type="date" value={form.dueDate} onChange={(value) => onChange({ ...form, dueDate: value })} />
          <label className="block">
            <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Client</span>
            <select value={form.clientId} onChange={(event) => onChange({ ...form, clientId: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
              {clients.map((client) => <option key={client.id} value={client.id}>{client.company}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-6 overflow-x-auto">
          <datalist id="invoice-product-options">
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
                      <input list="invoice-product-options" value={line.reference ?? ""} onChange={(event) => lookupProduct(line.id, event.target.value)} className="w-44 rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" placeholder="Ex: ECR-75" />
                      {!line.productId && line.reference && (
                        <p className="mt-1 text-xs font-semibold text-hicotech-red">
                          Produit introuvable. Voulez-vous le créer ?
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <input value={line.designation} onChange={(event) => updateLine(line.id, { designation: event.target.value })} className="w-64 rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
                    </td>
                    <td className="px-3 py-3"><SmallInput value={line.quantity} onChange={(value) => updateLine(line.id, { quantity: Number(value) })} /></td>
                    <td className="px-3 py-3"><input value={line.unit ?? "Pièce"} onChange={(event) => updateLine(line.id, { unit: event.target.value })} className="w-24 rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" /></td>
                    <td className="px-3 py-3"><SmallInput value={line.unitPrice} onChange={(value) => updateLine(line.id, { unitPrice: Number(value) })} /></td>
                    <td className="px-3 py-3"><SmallInput value={line.vat} onChange={(value) => updateLine(line.id, { vat: Number(value) })} /></td>
                    <td className="px-3 py-3 font-bold text-hicotech-navy dark:text-white">{formatCurrency(ht)}</td>
                    <td className="px-3 py-3 font-bold text-hicotech-navy dark:text-white">{formatCurrency(ttc)}</td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => onChange({ ...form, lines: form.lines.filter((item) => item.id !== line.id) })} className="rounded-lg border border-red-200 p-2 text-hicotech-red" aria-label="Supprimer ligne">
                        <X size={16} />
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

function Input({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <input value={value} type={type} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
    </label>
  );
}

function SmallInput({ value, onChange }: { value: number; onChange: (value: string) => void }) {
  return <input type="number" value={value} onChange={(event) => onChange(event.target.value)} className="w-24 rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />;
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-hicotech-navy dark:text-white">
      <span>{label}</span>
      <strong>{formatCurrency(value)}</strong>
    </div>
  );
}
