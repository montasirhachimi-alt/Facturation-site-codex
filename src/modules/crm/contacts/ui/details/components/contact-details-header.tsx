import Link from "next/link";
import { ArrowLeft, Building2, Mail, Pencil, Phone, Pin, Settings, Star } from "lucide-react";
import { InfoCard, SectionCard } from "@/ui";
import { getContactAvatarLabel } from "../../../contact.utils";
import type { Contact } from "../../../contact.types";
import type { Company } from "@/modules/crm/companies";
import { ContactStatusBadge } from "../../components/contact-status-badge";

export function ContactDetailsHeader({ canWrite, company, contact }: { canWrite: boolean; company?: Company; contact: Contact }) {
  return (
    <SectionCard className="overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
        <Link href={company ? `/crm/companies/${company.id}` : "/crm/companies"} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 transition hover:text-hicotech-blue dark:text-slate-300">
          <ArrowLeft size={14} />
          {company ? company.displayName : "Companies"}
        </Link>
      </div>
      <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="grid size-20 place-items-center rounded-2xl bg-hicotech-navy text-2xl font-bold text-white shadow-soft dark:bg-hicotech-blue">
            {getContactAvatarLabel(contact)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-hicotech-navy dark:text-white md:text-4xl">{contact.fullName}</h1>
              <ContactStatusBadge status={contact.status} />
              {contact.isPrimaryContact && <Badge label="Primary Contact" />}
              {contact.isDecisionMaker && <Badge label="Decision Maker" />}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-300">
              <span>{contact.jobTitle ?? "Fonction non définie"}</span>
              <span>•</span>
              <span>{contact.department ?? "Département non défini"}</span>
              <span>•</span>
              <span>{company?.displayName ?? "Société non définie"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <QuickAction icon={<Star size={16} />} label="Favori" />
          <QuickAction icon={<Pin size={16} />} label="Épingler" />
          <QuickAction href={contact.email ? `mailto:${contact.email}` : undefined} icon={<Mail size={16} />} label="Email" />
          <QuickAction href={contact.mobilePhone ? `tel:${contact.mobilePhone}` : undefined} icon={<Phone size={16} />} label="Appeler" />
          <QuickAction disabled={!canWrite} icon={<Pencil size={16} />} label="Modifier" />
          <QuickAction icon={<Settings size={16} />} label="Options" />
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-200 px-5 py-4 dark:border-hicotech-dark-border md:grid-cols-3">
        <InfoCard>
          <span className="inline-flex items-center gap-2">
            <Building2 size={16} />
            {company?.displayName ?? "Société non définie"}
          </span>
        </InfoCard>
        <InfoCard>{contact.email ?? "Email non renseigné"}</InfoCard>
        <InfoCard>{contact.mobilePhone ?? contact.officePhone ?? "Téléphone non renseigné"}</InfoCard>
      </div>
    </SectionCard>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-full bg-hicotech-sky px-2.5 py-1 text-xs font-bold text-hicotech-blue dark:bg-hicotech-blue/20 dark:text-blue-100">{label}</span>;
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
    "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 disabled:cursor-not-allowed disabled:opacity-40 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page dark:text-white dark:hover:bg-hicotech-dark-card";

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
