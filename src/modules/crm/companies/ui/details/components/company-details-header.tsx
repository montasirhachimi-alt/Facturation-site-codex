import Link from "next/link";
import { ArrowLeft, Building2, Mail, Pencil, Phone, Pin, Plus, Settings, Star } from "lucide-react";
import { InfoCard, SectionCard } from "@/ui";
import type { Company } from "../../../company.types";
import { CompanyStatusBadge } from "../../components/company-status-badge";

export function CompanyDetailsHeader({ canWrite, company }: { canWrite: boolean; company: Company }) {
  return (
    <SectionCard className="overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
        <Link href="/crm/companies" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 transition hover:text-hicotech-blue dark:text-slate-300">
          <ArrowLeft size={14} />
          Sociétés
        </Link>
      </div>
      <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="grid size-20 place-items-center rounded-2xl bg-hicotech-navy text-2xl font-bold text-white shadow-lg shadow-slate-300/70 dark:bg-hicotech-blue dark:shadow-none">
            {company.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-hicotech-navy dark:text-white md:text-4xl">{company.displayName}</h1>
              <CompanyStatusBadge status={company.status} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-300">
              <span>{company.industry}</span>
              <span>•</span>
              <span>{company.country ?? "Pays non défini"}</span>
              <span>•</span>
              <span>Owner : {company.ownerId ?? "Non assigné"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <QuickAction icon={<Star size={16} />} label="Favori" />
          <QuickAction icon={<Pin size={16} />} label="Épingler" />
          <QuickAction href={company.email ? `mailto:${company.email}` : undefined} icon={<Mail size={16} />} label="Email" />
          <QuickAction href={company.phone ? `tel:${company.phone}` : undefined} icon={<Phone size={16} />} label="Appeler" />
          <QuickAction disabled={!canWrite} icon={<Pencil size={16} />} label="Modifier" />
          <QuickAction disabled={!canWrite} icon={<Plus size={16} />} label="Relation" />
          <QuickAction icon={<Settings size={16} />} label="Options" />
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-200 bg-slate-50/45 px-6 py-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/20 md:grid-cols-3">
        <InfoCard>
          <span className="inline-flex items-center gap-2">
            <Building2 size={16} />
            {company.legalName}
          </span>
        </InfoCard>
        <InfoCard>{company.email ?? "Email non renseigné"}</InfoCard>
        <InfoCard>{company.phone ?? "Téléphone non renseigné"}</InfoCard>
      </div>
    </SectionCard>
  );
}

function QuickAction({
  disabled,
  href,
  icon,
  label
}: {
  disabled?: boolean;
  href?: string;
  icon: React.ReactNode;
  label: string;
}) {
  const className =
    "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-hicotech-navy shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:border-hicotech-blue/30 hover:bg-hicotech-sky/50 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 disabled:cursor-not-allowed disabled:opacity-40 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page dark:text-white dark:shadow-none dark:hover:bg-hicotech-dark-card";

  if (href && !disabled) {
    return (
      <a href={href} className={className}>
        {icon}
        {label}
      </a>
    );
  }

  return (
    <button type="button" disabled={disabled} className={className}>
      {icon}
      {label}
    </button>
  );
}
