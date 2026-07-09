"use client";

import Link from "next/link";
import { ArrowLeft, Building2, CalendarClock, FileText, NotebookPen, WalletCards } from "lucide-react";
import { CompanyService } from "@/modules/crm/companies";
import { CRM_COMPANIES_WORKSPACE_ID, crmCompanySeed } from "@/modules/crm/companies/ui/companies.seed";
import { invoiceService, type InvoiceId } from "@/modules/sales/invoices";
import { SALES_QUOTES_WORKSPACE_ID, formatQuoteMoney } from "@/modules/sales/quotes";
import { EntityEmptyState, EntityHeader, EntityPageLayout, InfoCard, MetricCard, SectionCard } from "@/ui";
import { PAYMENT_METHOD_LABELS } from "../payment.constants";
import { paymentService } from "../payment.store";
import type { PaymentId } from "../payment.types";
import { PaymentStatusBadge } from "./payments-workspace";

const companyService = new CompanyService({ seed: crmCompanySeed });
const companies = companyService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID }).companies;
const companyById = new Map(companies.map((company) => [company.id, company]));

export function PaymentDetailsWorkspace({ paymentId }: { paymentId: string }) {
  const payment = paymentService.getPayment(paymentId as PaymentId, SALES_QUOTES_WORKSPACE_ID);

  if (!payment) {
    return (
      <EntityPageLayout>
        <EntityEmptyState icon={WalletCards} title="Paiement introuvable" description="Ce paiement n'existe pas dans l'espace de travail actif." />
      </EntityPageLayout>
    );
  }

  const company = companyById.get(payment.companyId);
  const invoice = invoiceService.getInvoice(payment.invoiceId as InvoiceId, SALES_QUOTES_WORKSPACE_ID);

  return (
    <EntityPageLayout>
      <EntityHeader
        breadcrumb={["Ventes", "Paiements", payment.number]}
        title={payment.number}
        description={`Paiement client pour ${payment.invoiceNumber}.`}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <InfoCard>{payment.customerName}</InfoCard>
            <PaymentStatusBadge status={payment.status} />
            <Link href="/sales/payments" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-hicotech-blue dark:border-hicotech-dark-border">
              <ArrowLeft size={14} />
              Retour aux paiements
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={WalletCards} label="Montant reçu" value={formatQuoteMoney(payment.amount, payment.currency)} helper={PAYMENT_METHOD_LABELS[payment.method]} />
        <MetricCard icon={FileText} label="Facture" value={payment.invoiceNumber} helper={invoice?.status === "paid" ? "Soldée" : "En suivi"} />
        <MetricCard icon={Building2} label="Société" value={company?.displayName ?? "Non définie"} helper="Compte CRM" />
        <MetricCard icon={CalendarClock} label="Reçu le" value={formatDate(payment.receivedAt)} helper="Date d'encaissement" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-4">
          <SectionCard className="p-4">
            <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Informations paiement</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <InfoRow label="Client" value={payment.customerName} />
              <InfoRow label="Société" value={company?.displayName ?? "Non définie"} />
              <InfoRow label="Facture liée" value={payment.invoiceNumber} href={`/sales/invoices/${payment.invoiceId}`} />
              <InfoRow label="Mode" value={PAYMENT_METHOD_LABELS[payment.method]} />
              <InfoRow label="Référence" value={payment.reference ?? "Non renseignée"} />
              <InfoRow label="Responsable" value={payment.ownerId} />
            </div>
          </SectionCard>
        </main>

        <aside className="space-y-4">
          <SectionCard className="p-4">
            <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">Suivi finance</h2>
            <div className="mt-4 space-y-3">
              <InfoRow label="Statut" value={payment.status === "recorded" ? "Enregistré" : payment.status} />
              <InfoRow label="Montant" value={formatQuoteMoney(payment.amount, payment.currency)} />
              <InfoRow label="Créé le" value={formatDate(payment.createdAt)} />
            </div>
          </SectionCard>
          <PlaceholderCard icon={NotebookPen} title="Notes internes" description={payment.notes ?? "Aucune note interne pour ce paiement."} />
        </aside>
      </div>
    </EntityPageLayout>
  );
}

function InfoRow({ href, label, value }: { href?: string; label: string; value: string }) {
  const content = (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-hicotech-dark-border dark:bg-slate-900/30">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-sm font-bold text-hicotech-navy dark:text-white">{value}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function PlaceholderCard({ description, icon: Icon, title }: { description: string; icon: typeof NotebookPen; title: string }) {
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
