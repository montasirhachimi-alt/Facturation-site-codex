"use client";

import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import type { CompanyId } from "@/modules/crm/companies";
import type { ContactId } from "@/modules/crm/contacts";
import type { OpportunityId } from "@/modules/crm/opportunities";
import { SectionCard } from "@/ui";
import { QuoteService } from "../quote.service";
import { formatQuoteMoney, getQuoteTotals } from "../quote.utils";
import { SALES_QUOTES_WORKSPACE_ID, quoteSeed } from "../quotes.seed";
import { QuoteStatusBadge } from "./quotes-workspace";

const service = new QuoteService({ seed: quoteSeed });

export function CompanyQuotesPanel({ companyId }: { companyId: CompanyId }) {
  const quotes = service.listQuotes({ workspaceId: SALES_QUOTES_WORKSPACE_ID, companyId }).quotes;
  return <QuotesPanel title="Devis" description="Devis commerciaux reliés à cette société." quotes={quotes} empty="Aucun devis lié à cette société." />;
}

export function ContactQuotesPanel({ contactId }: { contactId: ContactId }) {
  const quotes = service.listQuotes({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).quotes.filter((quote) => quote.contactId === contactId);
  return <QuotesPanel title="Devis liés" description="Devis associés à ce contact." quotes={quotes} empty="Aucun devis lié à ce contact." />;
}

export function OpportunityQuoteAction({ opportunityId }: { opportunityId: OpportunityId }) {
  return (
    <Link href={`/sales/quotes?opportunity=${opportunityId}`} className="inline-flex items-center gap-2 rounded-lg bg-hicotech-blue px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50">
      Créer un devis
      <ArrowRight size={14} />
    </Link>
  );
}

function QuotesPanel({ description, empty, quotes, title }: { description: string; empty: string; quotes: readonly ReturnType<QuoteService["listQuotes"]>["quotes"][number][]; title: string }) {
  return (
    <SectionCard className="p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20">
          <FileText size={19} />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {quotes.length > 0 ? quotes.map((quote) => {
          const totals = getQuoteTotals(quote);
          return (
            <Link key={quote.id} href={`/sales/quotes/${quote.id}`} className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-hicotech-blue/30 hover:bg-white dark:border-hicotech-dark-border dark:bg-slate-900/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{quote.number}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{quote.customerName} • {formatQuoteMoney(totals.total, totals.currency)}</p>
                </div>
                <QuoteStatusBadge status={quote.status} />
              </div>
            </Link>
          );
        }) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm dark:border-hicotech-dark-border dark:bg-slate-900/30">
            <p className="font-bold text-hicotech-navy dark:text-white">{empty}</p>
            <p className="mt-1 text-slate-500 dark:text-slate-300">Créez un devis depuis le workspace Devis ou depuis une opportunité commerciale.</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
