"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { ArrowLeft, Building2, ContactRound, Mail, Pencil, Phone, Pin, Star } from "lucide-react";
import { isCommandCenterFavorite, toggleCommandCenterFavorite } from "@/platform/search/command-center-favorites";
import type { UniversalSearchItem } from "@/platform/search/universal-search.types";
import { InfoCard, SectionCard } from "@/ui";
import { getContactAvatarLabel } from "../../../contact.utils";
import type { Contact } from "../../../contact.types";
import type { Company } from "@/modules/crm/companies";
import { ContactStatusBadge } from "../../components/contact-status-badge";

export function ContactDetailsHeader({
  canWrite,
  company,
  contact,
  onEdit
}: {
  canWrite: boolean;
  company?: Company;
  contact: Contact;
  onEdit: () => void;
}) {
  const favoriteItem = useMemo(() => createContactFavoriteItem(contact, company), [company, contact]);
  const [favoriteActive, setFavoriteActive] = useState(false);
  const phoneNumber = contact.mobilePhone ?? contact.officePhone;

  useEffect(() => {
    setFavoriteActive(isCommandCenterFavorite(favoriteItem));
  }, [favoriteItem]);

  function toggleFavorite() {
    setFavoriteActive(toggleCommandCenterFavorite(favoriteItem));
  }

  return (
    <SectionCard className="overflow-hidden">
      <div className="bg-hicotech-navy px-6 py-4 text-white dark:bg-hicotech-dark-card">
        <Link href={company ? `/crm/companies/${company.id}` : "/crm/companies"} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-cyan-50/70 transition hover:text-white">
          <ArrowLeft size={14} />
          {company ? company.displayName : "Sociétés"}
        </Link>
      </div>
      <div className="grid gap-6 bg-hicotech-navy px-6 pb-7 text-white xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="grid size-24 place-items-center rounded-[1.5rem] bg-white text-3xl font-bold text-hicotech-blue shadow-2xl shadow-black/20">
            {getContactAvatarLabel(contact)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-bold leading-tight text-white md:text-5xl">{contact.fullName}</h1>
              <ContactStatusBadge status={contact.status} />
              {contact.isPrimaryContact && <Badge label="Contact principal" />}
              {contact.isDecisionMaker && <Badge label="Décideur" />}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-cyan-50/75">
              <span>{contact.jobTitle ?? "Fonction non définie"}</span>
              <span>•</span>
              <span>{contact.department ?? "Département non défini"}</span>
              <span>•</span>
              <span>{company?.displayName ?? "Société non définie"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <QuickAction active={favoriteActive} icon={<Star size={16} className={favoriteActive ? "fill-current" : undefined} />} label={favoriteActive ? "Favori actif" : "Favori"} onClick={toggleFavorite} pressed={favoriteActive} />
          <QuickAction disabled disabledReason="Épinglage non disponible sur les fiches contact." icon={<Pin size={16} />} label="Épingler" />
          <QuickAction disabled={!contact.email} disabledReason="Email non renseigné pour ce contact." href={contact.email ? `mailto:${contact.email}` : undefined} icon={<Mail size={16} />} label="Email" />
          <QuickAction disabled={!phoneNumber} disabledReason="Téléphone non renseigné pour ce contact." href={phoneNumber ? `tel:${phoneNumber}` : undefined} icon={<Phone size={16} />} label="Appeler" />
          <QuickAction disabled={!canWrite} disabledReason="Modification contact non autorisée." icon={<Pencil size={16} />} label="Modifier" onClick={onEdit} />
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-200 bg-white px-6 py-5 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/20 md:grid-cols-3">
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
  return <span className="rounded-full bg-white/12 px-2.5 py-1 text-xs font-bold text-white ring-1 ring-white/15">{label}</span>;
}

function QuickAction({
  active,
  disabled,
  disabledReason,
  href,
  icon,
  label,
  onClick,
  pressed
}: {
  active?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  href?: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  pressed?: boolean;
}) {
  if (!href && !onClick && !disabled) return null;

  const className = clsx(
    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold text-white shadow-sm shadow-black/10 transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-white/15 disabled:cursor-not-allowed disabled:opacity-45",
    active ? "border-amber-200/50 bg-amber-300/22 text-amber-50 hover:bg-amber-300/30" : "border-white/15 bg-white/10 hover:bg-white/18"
  );

  if (href && !disabled) {
    return (
      <a href={href} className={className} onClick={(event) => event.stopPropagation()}>
        {icon}
        {label}
      </a>
    );
  }

  return (
    <button type="button" aria-pressed={pressed} disabled={disabled} title={disabled ? disabledReason : undefined} aria-label={disabled && disabledReason ? `${label} - ${disabledReason}` : label} onClick={(event) => {
      event.stopPropagation();
      onClick?.();
    }} className={className}>
      {icon}
      {label}
    </button>
  );
}

function createContactFavoriteItem(contact: Contact, company?: Company): UniversalSearchItem {
  return {
    id: `record.contact.${contact.id}`,
    title: contact.fullName,
    description: `${company?.displayName ?? "Société inconnue"} · ${contact.jobTitle ?? contact.department ?? "Contact CRM"}`,
    badge: "Contact",
    eyebrow: "Record",
    href: `/crm/contacts/${contact.id}`,
    icon: ContactRound,
    iconKey: "contact",
    keywords: [
      contact.fullName,
      contact.firstName,
      contact.lastName,
      contact.email,
      contact.mobilePhone,
      contact.jobTitle,
      contact.department,
      company?.displayName,
      ...(contact.tags ?? [])
    ].filter(Boolean) as string[]
  };
}
