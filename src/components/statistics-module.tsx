"use client";

import { useMemo, useState } from "react";
import { Download, Eye, FileText, SlidersHorizontal, SortAsc, SortDesc, X } from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { branding } from "@/lib/branding";
import { can } from "@/lib/rbac";
import { calculateBusinessMetrics, filterByDate, getDateRange, toDateInput, type PeriodFilter } from "@/lib/business-metrics";
import { formatCurrency } from "@/lib/format";
import type { BusinessClient, CashEntry, Invoice, PurchaseInvoice, Role, StockProduct } from "@/lib/types";

type Indicator = {
  id: string;
  label: string;
  value: number;
  detail: string;
};

const periodOptions: Array<{ label: string; value: PeriodFilter }> = [
  { label: "Aujourd'hui", value: "today" },
  { label: "Semaine", value: "week" },
  { label: "Mois", value: "month" },
  { label: "Trimestre", value: "quarter" },
  { label: "Année", value: "year" },
  { label: "Personnalisé", value: "custom" }
];

export function StatisticsModule({
  invoices,
  purchases,
  cashEntries,
  products,
  clients,
  role
}: {
  invoices: Invoice[];
  purchases: PurchaseInvoice[];
  cashEntries: CashEntry[];
  products: StockProduct[];
  clients: BusinessClient[];
  role: Role;
}) {
  const [period, setPeriod] = useState<PeriodFilter>("year");
  const [customRange, setCustomRange] = useState({ from: toDateInput(new Date(new Date().getFullYear(), 0, 1)), to: toDateInput(new Date()) });
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [detail, setDetail] = useState<Indicator | null>(null);
  const canExport = can(role, "reports", "export");
  const canPrint = can(role, "reports", "print");

  const range = useMemo(() => getDateRange(period, customRange), [customRange, period]);
  const scopedInvoices = useMemo(() => filterByDate(invoices, range), [invoices, range]);
  const scopedPurchases = useMemo(() => filterByDate(purchases, range), [purchases, range]);
  const scopedCash = useMemo(() => filterByDate(cashEntries, range), [cashEntries, range]);
  const metrics = useMemo(() => calculateBusinessMetrics({ invoices: scopedInvoices, purchases: scopedPurchases, cashEntries: scopedCash, products, clients }), [clients, products, scopedCash, scopedInvoices, scopedPurchases]);

  const indicators = useMemo<Indicator[]>(() => {
    const rows = [
      { id: "revenue", label: "Chiffre d'affaires", value: metrics.revenue, detail: "Total TTC des factures sur la période sélectionnée." },
      { id: "grossMargin", label: "Marge brute", value: metrics.grossMargin, detail: "Chiffre d'affaires moins total achats TTC." },
      { id: "stockValue", label: "Valeur stock", value: metrics.stockValue, detail: "Stock actuel valorisé au prix de vente TTC." },
      { id: "outstanding", label: "Reste à encaisser", value: metrics.outstanding, detail: "Somme des restes à payer sur les factures." },
      { id: "purchases", label: "Total achats", value: metrics.purchasesTotal, detail: "Total TTC des factures d'achat sur la période." },
      { id: "expenses", label: "Total dépenses", value: metrics.expenses, detail: "Sorties de caisse de catégorie Dépense." },
      { id: "netResult", label: "Résultat net", value: metrics.netResult, detail: "Marge brute moins dépenses." },
      { id: "overdue", label: "Factures en retard", value: metrics.overdueInvoices, detail: "Nombre de factures en retard ou échues avec reste à payer." }
    ];
    return rows.sort((a, b) => sortDirection === "desc" ? b.value - a.value : a.value - b.value);
  }, [metrics, sortDirection]);

  function exportExcel() {
    if (!canExport) return;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(indicators.map((item) => ({ Indicateur: item.label, Valeur: item.value, Detail: item.detail }))), "Indicateurs");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(metrics.topClients), "Top clients");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(metrics.topProducts), "Top produits");
    XLSX.writeFile(workbook, `${branding.exports.statisticsFilename}.xlsx`);
  }

  function exportPdf() {
    if (!canPrint) return;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text(branding.exports.statisticsTitle, 14, 20);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`Période : ${range.from} au ${range.to}`, 14, 28);
    let y = 42;
    indicators.forEach((indicator) => {
      pdf.text(indicator.label, 14, y);
      pdf.text(indicator.id === "overdue" ? String(indicator.value) : formatCurrency(indicator.value), 190, y, { align: "right" });
      y += 8;
    });
    pdf.save(`${branding.exports.statisticsFilename}.pdf`);
  }

  return (
    <div className="space-y-6">
      <section id="exports" className="rounded-[1.5rem] border border-amber-100 bg-white p-5 shadow-[0_18px_55px_rgba(146,64,14,0.08)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-200">
              <SlidersHorizontal size={14} />
              Fenêtre d&apos;analyse
            </p>
            <h2 className="mt-2 font-display text-xl font-bold text-hicotech-navy dark:text-white">Choisir l&apos;angle de lecture business.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-300">Les indicateurs, graphiques et classements se recalculent selon cette période.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-3 md:grid-cols-4">
            <Select label="Période" value={period} options={periodOptions} onChange={(value) => setPeriod(value as PeriodFilter)} />
            <DateField label="Du" value={range.from} disabled={period !== "custom"} onChange={(value) => setCustomRange({ ...customRange, from: value })} />
            <DateField label="Au" value={range.to} disabled={period !== "custom"} onChange={(value) => setCustomRange({ ...customRange, to: value })} />
            <button type="button" onClick={() => setSortDirection((value) => value === "desc" ? "asc" : "desc")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">
              {sortDirection === "desc" ? <SortDesc size={18} /> : <SortAsc size={18} />}
              Trier
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {canExport && <ActionButton icon={<Download size={18} />} label="Export Excel" onClick={exportExcel} />}
            {canPrint && <ActionButton icon={<FileText size={18} />} label="Export PDF" onClick={exportPdf} />}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {indicators.map((indicator) => (
          <article key={indicator.id} className="group rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(10,30,63,0.07)] transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_22px_65px_rgba(146,64,14,0.10)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-300">{indicator.label}</p>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100 transition group-hover:bg-amber-600 group-hover:text-white dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/20">
                <Eye size={15} />
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white">{indicator.id === "overdue" ? indicator.value : formatCurrency(indicator.value)}</p>
            <button type="button" onClick={() => setDetail(indicator)} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-700 transition hover:text-amber-900 dark:text-amber-200">
              <Eye size={16} />
              Voir
            </button>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Évolution des ventes par mois">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={metrics.salesByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line type="monotone" dataKey="sales" stroke="#0D6EFD" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Top produits vendus">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={metrics.topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#0D6EFD" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <Ranking title="Top clients" rows={metrics.topClients.map((item) => [item.name, formatCurrency(item.total), formatCurrency(item.paid)])} columns={["Client", "Total", "Payé"]} />
        <Ranking title="Top produits vendus" rows={metrics.topProducts.map((item) => [item.name, String(item.quantity)])} columns={["Produit", "Quantité"]} />
      </section>

      {detail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
          <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
            <div className="flex items-start justify-between">
              <h2 className="font-display text-2xl font-bold text-hicotech-navy dark:text-white">{detail.label}</h2>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg border border-slate-200 p-2 dark:border-hicotech-dark-border"><X size={18} /></button>
            </div>
            <p className="mt-4 text-3xl font-bold text-hicotech-blue">{detail.id === "overdue" ? detail.value : formatCurrency(detail.value)}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{detail.detail}</p>
          </section>
        </div>
      )}
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<{ label: string; value: string }>; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function DateField({ label, value, disabled, onChange }: { label: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <input type="date" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm disabled:bg-slate-100 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
    </label>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-hicotech-navy px-4 py-3 text-sm font-bold text-white shadow-[0_14px_35px_rgba(10,30,63,0.18)] transition hover:-translate-y-0.5 hover:bg-amber-700">{icon}{label}</button>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(10,30,63,0.07)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none"><h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h2><div className="mt-4">{children}</div></section>;
}

function Ranking({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(10,30,63,0.07)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h2>
      <table className="mt-4 w-full text-sm">
        <thead><tr className="text-left text-xs uppercase text-slate-500">{columns.map((column) => <th key={column} className="py-2">{column}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.join("-")} className="border-t border-slate-100 dark:border-hicotech-dark-border">{row.map((cell) => <td key={cell} className="py-3 font-semibold text-hicotech-navy dark:text-white">{cell}</td>)}</tr>)}</tbody>
      </table>
    </section>
  );
}
