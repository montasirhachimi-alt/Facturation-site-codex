"use client";

import Link from "next/link";
import { WalletCards } from "lucide-react";
import type { CompanyId } from "@/modules/crm/companies";
import { SALES_QUOTES_WORKSPACE_ID, formatQuoteMoney } from "@/modules/sales/quotes";
import { SectionCard } from "@/ui";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "../payment.constants";
import { paymentService } from "../payment.store";

export function CompanyPaymentsPanel({ companyId }: { companyId: CompanyId }) {
  const payments = paymentService.listPayments({ workspaceId: SALES_QUOTES_WORKSPACE_ID, companyId }).payments;

  return (
    <SectionCard className="p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20">
          <WalletCards size={19} />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Paiements</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Encaissements reliés à cette société.</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {payments.length > 0 ? payments.map((payment) => (
          <Link key={payment.id} href={`/sales/payments/${payment.id}`} className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-hicotech-blue/30 hover:bg-white dark:border-hicotech-dark-border dark:bg-slate-900/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{payment.number}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{payment.invoiceNumber} • {formatQuoteMoney(payment.amount, payment.currency)}</p>
              </div>
              <p className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10">
                {PAYMENT_STATUS_LABELS[payment.status]} · {PAYMENT_METHOD_LABELS[payment.method]}
              </p>
            </div>
          </Link>
        )) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm dark:border-hicotech-dark-border dark:bg-slate-900/30">
            <p className="font-bold text-hicotech-navy dark:text-white">Aucun paiement lié à cette société.</p>
            <p className="mt-1 text-slate-500 dark:text-slate-300">Enregistrez un paiement depuis une facture pour alimenter cet espace.</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
