"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, CalendarClock, FileText, NotebookPen, Plus, WalletCards } from "lucide-react";
import { CompanyService } from "@/modules/crm/companies";
import { CRM_COMPANIES_WORKSPACE_ID, crmCompanySeed } from "@/modules/crm/companies/ui/companies.seed";
import { QuoteService, quoteSeed, SALES_QUOTES_WORKSPACE_ID, formatQuoteMoney } from "@/modules/sales/quotes";
import { paymentService, PAYMENT_METHOD_LABELS } from "@/modules/sales/payments";
import { PaymentStatusBadge } from "@/modules/sales/payments/ui";
import { EntityEmptyState, EntityHeader, EntityPageLayout, InfoCard, MetricCard, SectionCard } from "@/ui";
import { invoiceService } from "../invoice.store";
import type { InvoiceId } from "../invoice.types";
import { getInvoiceTotals } from "../invoice.utils";
import { InvoiceStatusBadge } from "./invoices-workspace";

const companyService = new CompanyService({ seed: crmCompanySeed });
const quoteService = new QuoteService({ seed: quoteSeed });
const companies = companyService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID }).companies;
const quotes = quoteService.listQuotes({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).quotes;
const companyById = new Map(companies.map((company) => [company.id, company]));
const quoteById = new Map(quotes.map((quote) => [quote.id, quote]));

export function InvoiceDetailsWorkspace({ invoiceId }: { invoiceId: string }) {
  const [, setPaymentVersion] = useState(0);
  const invoice = invoiceService.getInvoice(invoiceId as InvoiceId, SALES_QUOTES_WORKSPACE_ID);

  if (!invoice) {
    return (
      <EntityPageLayout>
        <EntityEmptyState icon={FileText} title="Facture introuvable" description="Cette facture n'existe pas dans l'espace de travail actif." />
      </EntityPageLayout>
    );
  }

  const invoiceValue = invoice;
  const totals = getInvoiceTotals(invoiceValue);
  const company = companyById.get(invoiceValue.companyId);
  const quote = invoiceValue.quoteId ? quoteById.get(invoiceValue.quoteId) : undefined;
  const payments = paymentService.listPaymentsForInvoice(invoiceValue.id, SALES_QUOTES_WORKSPACE_ID);

  function recordPayment() {
    const payment = paymentService.createFromInvoice(invoiceValue);
    if (!payment) return;
    setPaymentVersion((value) => value + 1);
  }

  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["Ventes", "Factures", invoice.number]}
        title={invoice.number}
        description={`Facture commerciale pour ${invoice.customerName}.`}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <InfoCard>{invoice.customerName}</InfoCard>
            <InvoiceStatusBadge status={invoice.status} />
            <Link href="/sales/invoices" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-hicotech-blue dark:border-hicotech-dark-border">
              <ArrowLeft size={14} />
              Retour aux factures
            </Link>
            <button
              type="button"
              disabled={totals.remaining <= 0}
              onClick={recordPayment}
              className="inline-flex items-center gap-2 rounded-lg bg-hicotech-blue px-3 py-2 text-xs font-bold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={14} />
              Enregistrer un paiement
            </button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={WalletCards} label="Total TTC" value={formatQuoteMoney(totals.total, totals.currency)} helper="Montant facturé" />
        <MetricCard icon={WalletCards} label="Reste à payer" value={formatQuoteMoney(totals.remaining, totals.currency)} helper="Suivi paiement" />
        <MetricCard icon={Building2} label="Société" value={company?.displayName ?? "Non définie"} helper="Compte CRM" />
        <MetricCard icon={CalendarClock} label="Échéance" value={formatDate(invoice.dueDate)} helper="Date limite" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-4">
          <SectionCard className="p-4">
            <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Informations facture</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <InfoRow label="Client" value={invoice.customerName} />
              <InfoRow label="Société" value={company?.displayName ?? "Non définie"} />
              <InfoRow label="Devis source" value={quote?.number ?? "Non lié"} />
              <InfoRow label="Responsable" value={invoice.ownerId} />
              <InfoRow label="Émission" value={formatDate(invoice.issueDate)} />
              <InfoRow label="Échéance" value={formatDate(invoice.dueDate)} />
            </div>
          </SectionCard>

          <SectionCard className="overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-hicotech-dark-border">
              <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Articles facturés</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-left dark:bg-hicotech-dark-page">
                  <tr>
                    <th className="px-5 py-3 font-bold text-slate-500">Description</th>
                    <th className="px-5 py-3 font-bold text-slate-500">Quantité</th>
                    <th className="px-5 py-3 font-bold text-slate-500">Prix unitaire</th>
                    <th className="px-5 py-3 font-bold text-slate-500">TVA</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                      <td className="px-4 py-3 font-semibold text-hicotech-navy dark:text-white">{item.description}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.quantity}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatQuoteMoney(item.unitPrice, invoice.currency)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.taxRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard className="overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-hicotech-dark-border">
              <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Paiements liés</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Encaissements enregistrés pour cette facture.</p>
            </div>
            {payments.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-hicotech-dark-border">
                {payments.map((payment) => (
                  <Link key={payment.id} href={`/sales/payments/${payment.id}`} className="flex flex-col gap-3 px-4 py-3 transition hover:bg-hicotech-cloud/70 md:flex-row md:items-center md:justify-between dark:hover:bg-hicotech-dark-page/60">
                    <div>
                      <p className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{payment.number}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{PAYMENT_METHOD_LABELS[payment.method]} • {formatDate(payment.receivedAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <PaymentStatusBadge status={payment.status} />
                      <p className="font-bold text-hicotech-navy dark:text-white">{formatQuoteMoney(payment.amount, payment.currency)}</p>
                      <ArrowRight size={15} className="text-hicotech-blue" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-5 text-sm leading-6 text-slate-500 dark:text-slate-300">
                Aucun paiement enregistré. Utilisez le bouton de paiement pour encaisser le reste à payer.
              </div>
            )}
          </SectionCard>
        </main>

        <aside className="space-y-4">
          <SectionCard className="p-4">
            <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Totaux</h2>
            <div className="mt-4 space-y-3">
              <InfoRow label="Montant HT" value={formatQuoteMoney(totals.subtotal - totals.discount, totals.currency)} />
              <InfoRow label="TVA" value={formatQuoteMoney(totals.tax, totals.currency)} />
              <InfoRow label="Total TTC" value={formatQuoteMoney(totals.total, totals.currency)} />
              <InfoRow label="Payé" value={formatQuoteMoney(totals.paid, totals.currency)} />
              <InfoRow label="Reste" value={formatQuoteMoney(totals.remaining, totals.currency)} />
            </div>
          </SectionCard>
          <PlaceholderCard icon={CalendarClock} title="Timeline" description="Les événements de paiement seront connectés au futur moteur d'activité." />
          <PlaceholderCard icon={NotebookPen} title="Notes internes" description={invoice.notes ?? "Aucune note interne pour cette facture."} />
        </aside>
      </div>
    </EntityPageLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-hicotech-dark-border dark:bg-slate-900/30">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-sm font-bold text-hicotech-navy dark:text-white">{value}</p>
    </div>
  );
}

function PlaceholderCard({ description, icon: Icon, title }: { description: string; icon: typeof CalendarClock; title: string }) {
  return (
    <SectionCard className="p-4">
      <Icon size={19} className="text-hicotech-blue" />
      <h2 className="mt-3 font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>
    </SectionCard>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
