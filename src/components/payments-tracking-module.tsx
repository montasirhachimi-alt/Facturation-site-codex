"use client";

import { FormEvent, useMemo, useState } from "react";
import { CreditCard, Download, Edit3, Eye, FileText, Mail, Search, SortAsc, SortDesc, X } from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { branding } from "@/lib/branding";
import { can } from "@/lib/rbac";
import { invoiceTotals } from "@/lib/business-metrics";
import { formatCurrency, formatDate } from "@/lib/format";
import type { BusinessClient, Invoice, InvoicePayment, PaymentModeLabel, Role } from "@/lib/types";

type PaymentStatus = "Tous" | "Payé" | "Partiellement payé" | "En retard" | "Non payé";
type SortKey = "number" | "client" | "date" | "dueDate" | "total" | "paid" | "outstanding" | "status";

const modes: PaymentModeLabel[] = ["Espèces", "Chèque", "Virement", "Carte bancaire"];
const statuses: PaymentStatus[] = ["Tous", "Payé", "Partiellement payé", "En retard", "Non payé"];

export function PaymentsTrackingModule({ invoices: initialInvoices, clients, role }: { invoices: Invoice[]; clients: BusinessClient[]; role: Role }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("Tous");
  const [clientId, setClientId] = useState("Tous");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("outstanding");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [editingPayment, setEditingPayment] = useState<InvoicePayment | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, mode: "Virement" as PaymentModeLabel, reference: "" });
  const [message, setMessage] = useState("");
  const canCreate = can(role, "payments", "create");
  const canEdit = can(role, "payments", "edit");
  const canExport = can(role, "payments", "export");
  const canPrint = can(role, "payments", "print");

  const rows = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return invoices
      .map((invoice) => {
        const client = clients.find((item) => item.id === invoice.clientId);
        const totals = invoiceTotals(invoice);
        const rowStatus = getPaymentStatus(invoice, totals);
        const lastPayment = invoice.payments[0];
        return { invoice, client, totals, status: rowStatus, mode: lastPayment?.mode ?? "-", reference: lastPayment?.reference ?? "" };
      })
      .filter((row) => {
        const matchesQuery = [row.invoice.number, row.client?.company, row.client?.name, row.status, row.reference].join(" ").toLowerCase().includes(normalizedQuery);
        const matchesStatus = status === "Tous" || row.status === status;
        const matchesClient = clientId === "Tous" || row.invoice.clientId === clientId;
        const matchesFrom = !from || row.invoice.date >= from;
        const matchesTo = !to || row.invoice.date <= to;
        return matchesQuery && matchesStatus && matchesClient && matchesFrom && matchesTo;
      })
      .sort((a, b) => {
        const first = getSortValue(a, sortKey);
        const second = getSortValue(b, sortKey);
        const result = typeof first === "number" && typeof second === "number" ? first - second : String(first).localeCompare(String(second));
        return sortDirection === "asc" ? result : -result;
      });
  }, [clientId, clients, from, invoices, query, sortDirection, sortKey, status, to]);

  function openPayment(invoice: Invoice, payment?: InvoicePayment) {
    const totals = invoiceTotals(invoice);
    setPaymentInvoice(invoice);
    setEditingPayment(payment ?? null);
    setPaymentForm({
      amount: payment?.amount ?? totals.outstanding,
      mode: payment?.mode ?? "Virement",
      reference: payment?.reference ?? ""
    });
  }

  function savePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentInvoice || (!canCreate && !editingPayment) || (!canEdit && editingPayment)) return;
    const payment: InvoicePayment = {
      id: editingPayment?.id ?? `pay-${Date.now()}`,
      invoiceId: paymentInvoice.id,
      date: new Date().toISOString().slice(0, 10),
      amount: paymentForm.amount,
      mode: paymentForm.mode,
      reference: paymentForm.reference
    };
    setInvoices((current) => current.map((invoice) => {
      if (invoice.id !== paymentInvoice.id) return invoice;
      const payments = editingPayment
        ? invoice.payments.map((item) => item.id === editingPayment.id ? payment : item)
        : [payment, ...invoice.payments];
      const total = invoiceTotals({ ...invoice, payments: [] }).ttc;
      const paid = payments.reduce((sum, item) => sum + item.amount, 0);
      return { ...invoice, payments, status: paid >= total ? "Payée" : paid > 0 ? "Partiellement payée" : invoice.status };
    }));
    setPaymentInvoice(null);
    setEditingPayment(null);
    setMessage(editingPayment ? "Paiement modifié." : "Paiement ajouté.");
    window.setTimeout(() => setMessage(""), 2500);
  }

  function exportExcel() {
    if (!canExport) return;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows.map((row) => toExportRow(row))), "Paiements");
    XLSX.writeFile(workbook, `${branding.exports.paymentsFilename}.xlsx`);
  }

  function exportPdf() {
    if (!canPrint) return;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(branding.exports.paymentsTitle, 14, 18);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    let y = 32;
    rows.forEach((row) => {
      if (y > 280) {
        pdf.addPage();
        y = 18;
      }
      pdf.text(`${row.invoice.number} - ${row.client?.company ?? ""} - ${row.status} - Reste ${formatCurrency(row.totals.outstanding)}`, 14, y);
      y += 7;
    });
    pdf.save(`${branding.exports.paymentsFilename}.pdf`);
  }

  function receiptPdf(invoice: Invoice) {
    if (!canPrint) return;
    const client = clients.find((item) => item.id === invoice.clientId);
    const totals = invoiceTotals(invoice);
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("Reçu de paiement", 14, 22);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Facture : ${invoice.number}`, 14, 38);
    pdf.text(`Client : ${client?.company ?? ""}`, 14, 46);
    pdf.text(`Montant payé : ${formatCurrency(totals.paid)}`, 14, 54);
    pdf.text(`Reste à payer : ${formatCurrency(totals.outstanding)}`, 14, 62);
    pdf.save(`recu-${invoice.number}.pdf`);
  }

  function sendReminder(invoice: Invoice) {
    const client = clients.find((item) => item.id === invoice.clientId);
    const totals = invoiceTotals(invoice);
    const subject = encodeURIComponent(`Rappel paiement ${invoice.number}`);
    const body = encodeURIComponent(`Bonjour,\n\nNous vous rappelons que la facture ${invoice.number} présente un reste à payer de ${formatCurrency(totals.outstanding)}.\n\nCordialement,\nHICOTECH`);
    window.location.href = `mailto:${client?.email ?? ""}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="space-y-6">
      {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-hicotech-green">{message}</p>}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_220px_150px_150px]">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
              <Search size={18} className="text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none dark:text-white" placeholder="Rechercher facture, client, référence..." />
            </div>
            <Select value={status} options={statuses} onChange={(value) => setStatus(value as PaymentStatus)} />
            <Select value={clientId} options={["Tous", ...clients.map((client) => client.id)]} labels={{ Tous: "Tous les clients", ...Object.fromEntries(clients.map((client) => [client.id, client.company])) }} onChange={setClientId} />
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSortDirection((value) => value === "desc" ? "asc" : "desc")} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">{sortDirection === "desc" ? <SortDesc size={18} /> : <SortAsc size={18} />} Trier</button>
            {canExport && <ActionButton icon={<Download size={18} />} label="Export Excel" onClick={exportExcel} />}
            {canPrint && <ActionButton icon={<FileText size={18} />} label="Export PDF" onClick={exportPdf} />}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-sm">
            <thead>
              <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                {[
                  ["number", "Numéro facture"], ["client", "Client"], ["date", "Date facture"], ["dueDate", "Échéance"], ["total", "Total TTC"], ["paid", "Montant payé"], ["outstanding", "Reste à payer"], ["status", "Statut"], ["mode", "Mode"], ["actions", "Actions"]
                ].map(([key, label]) => (
                  <th key={key} className="px-4 py-3 font-display text-xs font-bold uppercase">
                    {key !== "actions" && key !== "mode" ? <button type="button" onClick={() => setSortKey(key as SortKey)}>{label}</button> : label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.invoice.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                  <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{row.invoice.number}</td>
                  <td className="px-4 py-4"><p className="font-bold text-hicotech-navy dark:text-white">{row.client?.company}</p><p className="text-xs text-slate-500">{row.client?.name}</p></td>
                  <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{formatDate(row.invoice.date)}</td>
                  <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{formatDate(row.invoice.dueDate)}</td>
                  <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{formatCurrency(row.totals.ttc)}</td>
                  <td className="px-4 py-4 font-bold text-hicotech-green">{formatCurrency(row.totals.paid)}</td>
                  <td className="px-4 py-4 font-bold text-hicotech-red">{formatCurrency(row.totals.outstanding)}</td>
                  <td className="px-4 py-4"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{row.mode}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <SmallAction label="Voir" icon={<Eye size={16} />} onClick={() => setSelectedInvoice(row.invoice)} />
                      {canCreate && <SmallAction label="Paiement" icon={<CreditCard size={16} />} onClick={() => openPayment(row.invoice)} />}
                      {canEdit && row.invoice.payments[0] && <SmallAction label="Modifier" icon={<Edit3 size={16} />} onClick={() => openPayment(row.invoice, row.invoice.payments[0])} />}
                      {canPrint && <SmallAction label="Reçu" icon={<FileText size={16} />} onClick={() => receiptPdf(row.invoice)} />}
                      <SmallAction label="Rappel" icon={<Mail size={16} />} onClick={() => sendReminder(row.invoice)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedInvoice && <InvoiceDetail invoice={selectedInvoice} client={clients.find((client) => client.id === selectedInvoice.clientId)} onClose={() => setSelectedInvoice(null)} />}
      {paymentInvoice && (
        <PaymentModal invoice={paymentInvoice} form={paymentForm} editing={Boolean(editingPayment)} onChange={setPaymentForm} onClose={() => setPaymentInvoice(null)} onSubmit={savePayment} />
      )}
    </div>
  );
}

function getPaymentStatus(invoice: Invoice, totals: ReturnType<typeof invoiceTotals>): Exclude<PaymentStatus, "Tous"> {
  if (totals.outstanding <= 0) return "Payé";
  if (new Date(invoice.dueDate) < new Date()) return "En retard";
  if (totals.paid > 0) return "Partiellement payé";
  return "Non payé";
}

function getSortValue(row: { invoice: Invoice; client?: BusinessClient; totals: ReturnType<typeof invoiceTotals>; status: string }, key: SortKey) {
  if (key === "number") return row.invoice.number;
  if (key === "client") return row.client?.company ?? "";
  if (key === "date") return row.invoice.date;
  if (key === "dueDate") return row.invoice.dueDate;
  if (key === "total") return row.totals.ttc;
  if (key === "paid") return row.totals.paid;
  if (key === "outstanding") return row.totals.outstanding;
  return row.status;
}

function toExportRow(row: { invoice: Invoice; client?: BusinessClient; totals: ReturnType<typeof invoiceTotals>; status: string; mode: string }) {
  return {
    "Numéro facture": row.invoice.number,
    Client: row.client?.company ?? "",
    "Date facture": row.invoice.date,
    Échéance: row.invoice.dueDate,
    "Total TTC": row.totals.ttc,
    "Montant payé": row.totals.paid,
    "Reste à payer": row.totals.outstanding,
    Statut: row.status,
    "Mode paiement": row.mode
  };
}

function Select({ value, options, labels = {}, onChange }: { value: string; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">{options.map((option) => <option key={option} value={option}>{labels[option] ?? option}</option>)}</select>;
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white">{icon}{label}</button>;
}

function SmallAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-bold text-hicotech-navy hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:text-white">{icon}{label}</button>;
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "Payé" ? "bg-emerald-50 text-hicotech-green" : status === "En retard" ? "bg-red-50 text-hicotech-red" : "bg-blue-50 text-hicotech-blue";
  return <span className={`rounded-md px-2 py-1 text-xs font-bold ${tone}`}>{status}</span>;
}

function InvoiceDetail({ invoice, client, onClose }: { invoice: Invoice; client?: BusinessClient; onClose: () => void }) {
  const totals = invoiceTotals(invoice);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <section className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex justify-between"><h2 className="font-display text-2xl font-bold text-hicotech-navy dark:text-white">{invoice.number}</h2><button type="button" onClick={onClose}><X size={18} /></button></div>
        <p className="mt-2 text-sm text-slate-500">{client?.company} - échéance {formatDate(invoice.dueDate)}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Metric label="Total TTC" value={formatCurrency(totals.ttc)} />
          <Metric label="Payé" value={formatCurrency(totals.paid)} />
          <Metric label="Reste" value={formatCurrency(totals.outstanding)} />
        </div>
      </section>
    </div>
  );
}

function PaymentModal({ invoice, form, editing, onChange, onClose, onSubmit }: { invoice: Invoice; form: { amount: number; mode: PaymentModeLabel; reference: string }; editing: boolean; onChange: (form: { amount: number; mode: PaymentModeLabel; reference: string }) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex justify-between"><h2 className="font-display text-2xl font-bold text-hicotech-navy dark:text-white">{editing ? "Modifier paiement" : "Ajouter paiement"}</h2><button type="button" onClick={onClose}><X size={18} /></button></div>
        <p className="mt-2 text-sm text-slate-500">{invoice.number}</p>
        <div className="mt-5 grid gap-4">
          <Field label="Montant" type="number" value={form.amount} onChange={(value) => onChange({ ...form, amount: Number(value) })} />
          <label className="block"><span className="text-sm font-semibold text-hicotech-navy dark:text-white">Mode</span><select value={form.mode} onChange={(event) => onChange({ ...form, mode: event.target.value as PaymentModeLabel })} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">{modes.map((mode) => <option key={mode}>{mode}</option>)}</select></label>
          <Field label="Référence" value={form.reference} onChange={(value) => onChange({ ...form, reference: value })} />
        </div>
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold">Annuler</button><button type="submit" className="rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white">Enregistrer</button></div>
      </form>
    </div>
  );
}

function Field({ label, value, type = "text", onChange }: { label: string; value: string | number; type?: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" /></label>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className="rounded-lg bg-hicotech-sky p-4 dark:bg-hicotech-dark-page/50"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 font-display text-xl font-bold text-hicotech-navy dark:text-white">{value}</p></article>;
}
