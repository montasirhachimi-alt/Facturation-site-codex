"use client";

import { FormEvent, useMemo, useState } from "react";
import { CreditCard, Download, Eye, FileText, Plus, Printer, Search, X } from "lucide-react";
import { clsx } from "clsx";
import type { BusinessClient, Invoice, InvoicePayment, InvoiceStatus, PaymentModeLabel } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { createInvoicePdf } from "@/lib/pdf";

const statuses: Array<"Tous" | InvoiceStatus> = ["Tous", "Payée", "Partiellement payée", "En retard"];
const modes: PaymentModeLabel[] = ["Espèces", "Chèque", "Virement", "Carte bancaire"];
const pageSize = 5;

function invoiceTotals(invoice: Invoice) {
  const totals = invoice.lines.reduce(
    (sum, line) => {
      const gross = line.quantity * line.unitPrice;
      const discount = gross * (line.discount / 100);
      const ht = gross - discount;
      const vat = ht * (line.vat / 100);
      return { ht: sum.ht + ht, vat: sum.vat + vat, discount: sum.discount + discount, ttc: sum.ttc + ht + vat };
    },
    { ht: 0, vat: 0, discount: 0, ttc: 0 }
  );
  const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return { ...totals, paid, outstanding: Math.max(0, totals.ttc - paid) };
}

export function InvoicesModule({
  initialInvoices,
  clients
}: {
  initialInvoices: Invoice[];
  clients: BusinessClient[];
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
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft">
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
                        <Action label="PDF" icon={<FileText size={16} />} onClick={() => client && createInvoicePdf(invoice, client)} />
                        <Action label="Imprimer" icon={<Printer size={16} />} onClick={() => window.print()} />
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
    "En retard": "bg-red-50 text-hicotech-red"
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
