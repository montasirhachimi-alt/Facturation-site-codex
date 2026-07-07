"use client";

import Link from "next/link";
import { ArrowRight, Building2, CircleDollarSign, CreditCard, Filter, Search, WalletCards } from "lucide-react";
import { useState } from "react";
import { CompanyService } from "@/modules/crm/companies";
import { CRM_COMPANIES_WORKSPACE_ID, crmCompanySeed } from "@/modules/crm/companies/ui/companies.seed";
import { SALES_QUOTES_WORKSPACE_ID, formatQuoteMoney } from "@/modules/sales/quotes";
import { EntityHeader, EntityPageLayout, InfoCard, MetricCard, SectionCard, entityInputClassName } from "@/ui";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "../payment.constants";
import { paymentService } from "../payment.store";
import type { Payment, PaymentMethod, PaymentSort, PaymentStatus } from "../payment.types";

const companyService = new CompanyService({ seed: crmCompanySeed });
const companies = companyService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID }).companies;
const companyById = new Map(companies.map((company) => [company.id, company]));

export function PaymentsWorkspace() {
  const [filters, setFilters] = useState({ query: "", status: "all" as PaymentStatus | "all", method: "all" as PaymentMethod | "all", companyId: "all" });
  const [sort, setSort] = useState<PaymentSort>({ field: "receivedAt", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const payments = paymentService.listPayments({
    workspaceId: SALES_QUOTES_WORKSPACE_ID,
    query: filters.query,
    status: filters.status,
    method: filters.method,
    companyId: filters.companyId === "all" ? "all" : filters.companyId as never
  }, sort).payments;
  const stats = buildPaymentStats(payments);
  const totalPages = Math.max(1, Math.ceil(payments.length / pageSize));
  const paginated = payments.slice((page - 1) * pageSize, page * pageSize);

  function updateSort(field: PaymentSort["field"]) {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === "asc" ? "desc" : "asc"
    }));
  }

  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["Ventes", "Paiements"]}
        title="Paiements clients"
        description="Suivez les encaissements reliés aux factures commerciales et préparez le futur rapprochement."
        meta={<InfoCard>Espace actif : HicoPilot CRM</InfoCard>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={WalletCards} label="Paiements" value={String(payments.length)} helper="Encaissements visibles" />
        <MetricCard icon={CircleDollarSign} label="Montant reçu" value={formatQuoteMoney(stats.received, "MAD")} helper="Total filtré" />
        <MetricCard icon={CreditCard} label="À rapprocher" value={String(stats.recorded)} helper="En attente finance" />
        <MetricCard icon={Building2} label="Clients" value={String(stats.customers)} helper="Comptes concernés" />
        <MetricCard icon={Filter} label="Rapprochés" value={String(stats.reconciled)} helper="Paiements validés" />
      </section>

      <SectionCard className="p-4">
        <div>
          <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Recherche et filtres</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Filtrez par facture, client, mode ou statut de paiement.</p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-5">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 xl:col-span-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
            <Search size={16} className="text-slate-400" />
            <input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} className="w-full bg-transparent text-sm outline-none dark:text-white" placeholder="Rechercher un paiement..." />
          </label>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as PaymentStatus | "all" })} className={entityInputClassName}>
            <option value="all">Tous statuts</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={filters.method} onChange={(event) => setFilters({ ...filters, method: event.target.value as PaymentMethod | "all" })} className={entityInputClassName}>
            <option value="all">Tous modes</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={filters.companyId} onChange={(event) => setFilters({ ...filters, companyId: event.target.value })} className={entityInputClassName}>
            <option value="all">Toutes sociétés</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.displayName}</option>)}
          </select>
        </div>
      </SectionCard>

      <PaymentsTable payments={paginated} sort={sort} onSort={updateSort} />

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Page {page} sur {totalPages} • {payments.length} paiement(s)</p>
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className={entityInputClassName}>
            <option value={5}>5 par page</option>
            <option value={8}>8 par page</option>
            <option value={12}>12 par page</option>
          </select>
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-40 dark:border-hicotech-dark-border">Précédent</button>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-40 dark:border-hicotech-dark-border">Suivant</button>
        </div>
      </div>
    </EntityPageLayout>
  );
}

function PaymentsTable({ onSort, payments, sort }: { onSort: (field: PaymentSort["field"]) => void; payments: readonly Payment[]; sort: PaymentSort }) {
  if (payments.length === 0) {
    return (
      <SectionCard className="p-8 text-center">
        <WalletCards size={36} className="mx-auto text-hicotech-blue" />
        <h2 className="mt-4 font-display text-xl font-bold text-hicotech-navy dark:text-white">Aucun paiement trouvé</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">
          Les paiements sont enregistrés depuis les factures ouvertes. Ouvrez une facture avec un reste à payer pour créer le premier règlement.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left dark:border-hicotech-dark-border dark:bg-hicotech-dark-page">
            <tr>
              {[
                ["number", "Numéro"],
                ["invoiceNumber", "Facture"],
                ["customerName", "Client"],
                ["company", "Société"],
                ["method", "Mode"],
                ["receivedAt", "Reçu le"],
                ["status", "Statut"],
                ["amount", "Montant"],
                ["ownerId", "Responsable"]
              ].map(([field, label]) => (
                <th key={field} className="px-5 py-3.5 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                  {field === "company" ? label : (
                    <button type="button" onClick={() => onSort(field as PaymentSort["field"])}>{label}{sort.field === field ? sort.direction === "asc" ? " ↑" : " ↓" : ""}</button>
                  )}
                </th>
              ))}
              <th className="px-5 py-3.5 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-slate-100 transition hover:bg-hicotech-cloud/70 dark:border-hicotech-dark-border dark:hover:bg-hicotech-dark-page/60">
                <td className="px-5 py-5 font-bold text-hicotech-navy dark:text-white">{payment.number}</td>
                <td className="px-5 py-5 text-slate-600 dark:text-slate-300">{payment.invoiceNumber}</td>
                <td className="px-5 py-5 text-slate-600 dark:text-slate-300">{payment.customerName}</td>
                <td className="px-5 py-5 text-slate-600 dark:text-slate-300">{companyById.get(payment.companyId)?.displayName ?? "Non définie"}</td>
                <td className="px-5 py-5 text-slate-600 dark:text-slate-300">{PAYMENT_METHOD_LABELS[payment.method]}</td>
                <td className="px-5 py-5 text-slate-600 dark:text-slate-300">{formatDate(payment.receivedAt)}</td>
                <td className="px-5 py-5"><PaymentStatusBadge status={payment.status} /></td>
                <td className="px-5 py-5 font-bold text-hicotech-navy dark:text-white">{formatQuoteMoney(payment.amount, payment.currency)}</td>
                <td className="px-5 py-5 text-slate-600 dark:text-slate-300">{payment.ownerId}</td>
                <td className="px-5 py-5">
                  <Link href={`/sales/payments/${payment.id}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-hicotech-blue transition hover:bg-hicotech-sky dark:border-hicotech-dark-border">
                    Voir
                    <ArrowRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tones: Record<PaymentStatus, string> = {
    draft: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    recorded: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200",
    reconciled: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
    cancelled: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200"
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tones[status]}`}>{PAYMENT_STATUS_LABELS[status]}</span>;
}

function buildPaymentStats(payments: readonly Payment[]) {
  const customers = new Set(payments.map((payment) => payment.companyId)).size;
  return {
    received: payments.reduce((total, payment) => total + payment.amount, 0),
    recorded: payments.filter((payment) => payment.status === "recorded").length,
    reconciled: payments.filter((payment) => payment.status === "reconciled").length,
    customers
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
