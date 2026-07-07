import Link from "next/link";
import { ArrowLeft, Building2, Mail, Pencil, Phone, Pin, Plus, Settings, Star } from "lucide-react";
import { InfoCard, SectionCard } from "@/ui";
import type { Company } from "../../../company.types";
import { CompanyStatusBadge } from "../../components/company-status-badge";

export function CompanyDetailsHeader({ canWrite, company }: { canWrite: boolean; company: Company }) {
  return (
    <SectionCard className="overflow-hidden">
      <div className="bg-hicotech-navy px-6 py-4 text-white dark:bg-hicotech-dark-card">
        <Link href="/crm/companies" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-50/70 transition hover:text-white">
          <ArrowLeft size={14} />
          Sociétés
        </Link>
      </div>
      <div className="grid gap-6 bg-hicotech-navy px-6 pb-7 text-white xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="grid size-24 place-items-center rounded-[1.5rem] bg-white text-3xl font-bold text-hicotech-blue shadow-2xl shadow-black/20">
            {company.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-bold leading-tight text-white md:text-5xl">{company.displayName}</h1>
              <CompanyStatusBadge status={company.status} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-cyan-50/75">
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

      <div className="grid gap-3 border-t border-slate-200 bg-white px-6 py-5 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/20 md:grid-cols-3">
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
    "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white shadow-sm shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white/18 focus:outline-none focus:ring-4 focus:ring-white/15 disabled:cursor-not-allowed disabled:opacity-40";

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
