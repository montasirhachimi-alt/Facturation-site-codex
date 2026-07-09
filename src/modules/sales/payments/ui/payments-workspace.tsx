"use client";

import Link from "next/link";
import { ArrowRight, Building2, CircleDollarSign, CreditCard, Filter, Sparkles, WalletCards } from "lucide-react";
import { useState } from "react";
import { CompanyService } from "@/modules/crm/companies";
import { CRM_COMPANIES_WORKSPACE_ID, crmCompanySeed } from "@/modules/crm/companies/ui/companies.seed";
import { SALES_QUOTES_WORKSPACE_ID, formatQuoteMoney } from "@/modules/sales/quotes";
import { EntityPageLayout, EntitySearchBar, MetricCard, ProductHero, ProductSectionHeader, SectionCard, entityInputClassName, workspacePrimaryActionClassName, workspaceTableActionClassName } from "@/ui";
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
      <ProductHero
        eyebrow="Ventes / Cash client"
        icon={Sparkles}
        personality="sales"
        title="Suivre le cash qui entre et ce qui reste à rapprocher."
        subtitle="Les paiements traduisent la performance commerciale en encaissements, rapprochements et comptes à sécuriser."
        actions={[
          { href: "/sales/invoices", icon: ArrowRight, label: "Ouvrir les factures" },
          { href: "/crm/companies", icon: Building2, label: "Voir les sociétés", tone: "secondary" }
        ]}
        signals={[
          { label: "Paiements", value: String(payments.length), helper: "encaissements visibles" },
          { label: "Montant reçu", value: formatQuoteMoney(stats.received, "MAD"), helper: "total filtré" },
          { label: "À rapprocher", value: String(stats.recorded), helper: "en attente finance" },
          { label: "Rapprochés", value: String(stats.reconciled), helper: "paiements validés" }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" aria-label="Signaux d'encaissement">
        <MetricCard icon={WalletCards} label="Paiements" value={String(payments.length)} helper="Encaissements visibles" />
        <MetricCard icon={CircleDollarSign} label="Montant reçu" value={formatQuoteMoney(stats.received, "MAD")} helper="Total filtré" />
        <MetricCard icon={CreditCard} label="À rapprocher" value={String(stats.recorded)} helper="En attente finance" />
        <MetricCard icon={Building2} label="Clients" value={String(stats.customers)} helper="Comptes concernés" />
        <MetricCard icon={Filter} label="Rapprochés" value={String(stats.reconciled)} helper="Paiements validés" />
      </section>

      <SectionCard className="p-4">
        <ProductSectionHeader icon={Filter} title="Rythme des encaissements" description="Filtrez par facture, client, mode ou statut de paiement." />
        <div className="mt-4 grid gap-2 lg:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <EntitySearchBar value={filters.query} onChange={(value) => setFilters({ ...filters, query: value })} placeholder="Rechercher un paiement..." />
          </div>
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

      <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/50 md:flex-row md:items-center md:justify-between dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
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
      <SectionCard className="p-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-50 text-hicotech-blue ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
          <WalletCards size={24} />
        </div>
        <h2 className="mt-4 font-display text-lg font-bold text-hicotech-navy dark:text-white">Aucun paiement trouvé</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">
          Les paiements sont enregistrés depuis les factures ouvertes.
        </p>
        <Link href="/sales/invoices" className={`${workspacePrimaryActionClassName} mt-5`}>
          Ouvrir les factures
          <ArrowRight size={16} />
        </Link>
      </SectionCard>
    );
  }

  return (
    <SectionCard className="overflow-hidden">
      <div className="relative overflow-hidden border-b border-slate-200 bg-hicotech-navy px-4 py-3.5 text-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="absolute right-0 top-0 h-full w-28 bg-white/5" />
        <h2 className="relative font-display text-lg font-bold text-white">Liste des paiements</h2>
        <p className="relative mt-0.5 text-xs font-medium text-cyan-50/70">Encaissements clients reliés aux factures commerciales.</p>
      </div>
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
                <th key={field} className="px-4 py-2 font-display text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-300">
                  {field === "company" ? label : (
                    <button type="button" onClick={() => onSort(field as PaymentSort["field"])}>{label}{sort.field === field ? sort.direction === "asc" ? " ↑" : " ↓" : ""}</button>
                  )}
                </th>
              ))}
              <th className="px-4 py-2 font-display text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-slate-100 transition hover:bg-hicotech-sky/55 hover:shadow-[inset_4px_0_0_#0D6EFD] dark:border-hicotech-dark-border dark:hover:bg-hicotech-dark-page/60">
                <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">{payment.number}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{payment.invoiceNumber}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{payment.customerName}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{companyById.get(payment.companyId)?.displayName ?? "Non définie"}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{PAYMENT_METHOD_LABELS[payment.method]}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(payment.receivedAt)}</td>
                <td className="px-4 py-3"><PaymentStatusBadge status={payment.status} /></td>
                <td className="px-4 py-3 font-bold text-hicotech-navy dark:text-white">{formatQuoteMoney(payment.amount, payment.currency)}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{payment.ownerId}</td>
                <td className="px-4 py-3">
                  <Link href={`/sales/payments/${payment.id}`} className={workspaceTableActionClassName}>
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
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${tones[status]}`}><span className="size-1.5 rounded-full bg-current" />{PAYMENT_STATUS_LABELS[status]}</span>;
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
