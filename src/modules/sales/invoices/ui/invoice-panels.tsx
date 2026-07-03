"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import type { CompanyId } from "@/modules/crm/companies";
import type { ContactId } from "@/modules/crm/contacts";
import { formatQuoteMoney } from "@/modules/sales/quotes";
import { SectionCard } from "@/ui";
import { invoiceService } from "../invoice.store";
import { getInvoiceTotals } from "../invoice.utils";
import { SALES_QUOTES_WORKSPACE_ID } from "@/modules/sales/quotes";
import { InvoiceStatusBadge } from "./invoices-workspace";

export function CompanyInvoicesPanel({ companyId }: { companyId: CompanyId }) {
  const invoices = invoiceService.listInvoices({ workspaceId: SALES_QUOTES_WORKSPACE_ID, companyId }).invoices;
  return <InvoicesPanel title="Factures" description="Factures reliées à cette société." empty="Aucune facture liée à cette société." invoices={invoices} />;
}

export function ContactInvoicesPanel({ contactId }: { contactId: ContactId }) {
  const invoices = invoiceService.listInvoices({ workspaceId: SALES_QUOTES_WORKSPACE_ID, contactId }).invoices;
  return <InvoicesPanel title="Factures liées" description="Factures associées à ce contact." empty="Aucune facture liée à ce contact." invoices={invoices} />;
}

function InvoicesPanel({ description, empty, invoices, title }: { description: string; empty: string; invoices: ReturnType<typeof invoiceService.listInvoices>["invoices"]; title: string }) {
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
        {invoices.length > 0 ? invoices.map((invoice) => {
          const totals = getInvoiceTotals(invoice);
          return (
            <Link key={invoice.id} href={`/sales/invoices/${invoice.id}`} className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-hicotech-blue/30 hover:bg-white dark:border-hicotech-dark-border dark:bg-slate-900/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{invoice.number}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{invoice.customerName} • {formatQuoteMoney(totals.total, totals.currency)}</p>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </Link>
          );
        }) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm dark:border-hicotech-dark-border dark:bg-slate-900/30">
            <p className="font-bold text-hicotech-navy dark:text-white">{empty}</p>
            <p className="mt-1 text-slate-500 dark:text-slate-300">Générez une facture depuis un devis accepté pour alimenter cet espace.</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
