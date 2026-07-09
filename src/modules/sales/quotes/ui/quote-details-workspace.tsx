"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, CalendarClock, FileText, HandCoins, NotebookPen } from "lucide-react";
import { CompanyService } from "@/modules/crm/companies";
import { CRM_COMPANIES_WORKSPACE_ID, crmCompanySeed } from "@/modules/crm/companies/ui/companies.seed";
import { OpportunityService } from "@/modules/crm/opportunities";
import { crmOpportunitySeed } from "@/modules/crm/opportunities/ui/opportunities.seed";
import { EntityEmptyState, EntityHeader, EntityPageLayout, InfoCard, MetricCard, SectionCard } from "@/ui";
import { QuoteService } from "../quote.service";
import type { QuoteId } from "../quote.types";
import { formatQuoteMoney, getQuoteTotals } from "../quote.utils";
import { SALES_QUOTES_WORKSPACE_ID, quoteSeed } from "../quotes.seed";
import { QuoteStatusBadge } from "./quotes-workspace";
import { invoiceService } from "@/modules/sales/invoices";

const quoteService = new QuoteService({ seed: quoteSeed });
const companyService = new CompanyService({ seed: crmCompanySeed });
const opportunityService = new OpportunityService({ seed: crmOpportunitySeed });
const companies = companyService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID }).companies;
const opportunities = opportunityService.listOpportunities({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).opportunities;
const companyById = new Map(companies.map((company) => [company.id, company]));
const opportunityById = new Map(opportunities.map((opportunity) => [opportunity.id, opportunity]));

export function QuoteDetailsWorkspace({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const quote = quoteService.getQuote(quoteId as QuoteId, SALES_QUOTES_WORKSPACE_ID);

  if (!quote) {
    return (
      <EntityPageLayout>
        <EntityEmptyState icon={FileText} title="Devis introuvable" description="Ce devis n'existe pas dans l'espace de travail actif." />
      </EntityPageLayout>
    );
  }

  const quoteValue = quote;
  const totals = getQuoteTotals(quoteValue);
  const company = companyById.get(quoteValue.companyId);
  const opportunity = quoteValue.opportunityId ? opportunityById.get(quoteValue.opportunityId) : undefined;
  const linkedInvoice = invoiceService.getInvoiceByQuote(quoteValue.id, quoteValue.workspaceId);

  function createInvoice() {
    const invoice = invoiceService.createFromQuote(quoteValue);
    router.push(`/sales/invoices/${invoice.id}`);
  }

  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["Ventes", "Devis", quote.number]}
        title={quote.number}
        description={`Devis commercial pour ${quote.customerName}.`}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <InfoCard>{quote.customerName}</InfoCard>
            <QuoteStatusBadge status={quote.status} />
            {quote.status === "accepted" && (
              linkedInvoice ? (
                <Link href={`/sales/invoices/${linkedInvoice.id}`} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">
                  Facture créée
                </Link>
              ) : (
                <button type="button" onClick={createInvoice} className="inline-flex items-center gap-2 rounded-lg bg-hicotech-blue px-3 py-2 text-xs font-bold text-white">
                  Créer une facture
                </button>
              )
            )}
            <Link href="/sales/quotes" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-hicotech-blue dark:border-hicotech-dark-border">
              <ArrowLeft size={14} />
              Retour aux devis
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={HandCoins} label="Total TTC" value={formatQuoteMoney(totals.total, totals.currency)} helper="Montant proposé" />
        <MetricCard icon={Building2} label="Société" value={company?.displayName ?? "Non définie"} helper="Compte CRM" />
        <MetricCard icon={CalendarClock} label="Validité" value={formatDate(quote.expirationDate)} helper="Date d'expiration" />
        <MetricCard icon={FileText} label="Lignes" value={String(quote.items.length)} helper="Articles devis" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-4">
          <SectionCard className="p-4">
            <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Informations commerciales</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <InfoRow label="Client" value={quote.customerName} />
              <InfoRow label="Société" value={company?.displayName ?? "Non définie"} />
              <InfoRow label="Opportunité" value={opportunity?.title ?? "Non liée"} />
              <InfoRow label="Responsable" value={quote.ownerId} />
              <InfoRow label="Émission" value={formatDate(quote.issueDate)} />
              <InfoRow label="Expiration" value={formatDate(quote.expirationDate)} />
            </div>
          </SectionCard>

          <SectionCard className="overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-hicotech-dark-border">
              <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Articles</h2>
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
                  {quote.items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                      <td className="px-4 py-3 font-semibold text-hicotech-navy dark:text-white">{item.description}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.quantity}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatQuoteMoney(item.unitPrice, quote.currency)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.taxRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </main>

        <aside className="space-y-4">
          <SectionCard className="p-4">
            <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Totaux</h2>
            <div className="mt-4 space-y-3">
              <InfoRow label="Sous-total" value={formatQuoteMoney(totals.subtotal, totals.currency)} />
              <InfoRow label="Remise" value={formatQuoteMoney(totals.discount, totals.currency)} />
              <InfoRow label="Taxe" value={formatQuoteMoney(totals.tax, totals.currency)} />
              <InfoRow label="Total" value={formatQuoteMoney(totals.total, totals.currency)} />
            </div>
          </SectionCard>
          <PlaceholderCard icon={CalendarClock} title="Timeline" description="Les événements du devis seront connectés aux activités commerciales." />
          <PlaceholderCard icon={NotebookPen} title="Notes internes" description={quote.notes ?? "Les notes internes seront enrichies dans un prochain sprint."} />
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
