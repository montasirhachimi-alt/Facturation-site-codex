import { Building2, Clock, Languages, Mail, MapPin, Phone, Tags, UserRound } from "lucide-react";
import { SectionCard } from "@/ui";
import type { Company } from "@/modules/crm/companies";
import type { Contact } from "../../../contact.types";

export function ContactOverview({ company, contact }: { company?: Company; contact: Contact }) {
  return (
    <div className="grid gap-6 2xl:grid-cols-2">
      <SectionCard className="p-5">
        <SectionTitle eyebrow="Vue d'ensemble" title="Informations personnelles" />
        <InfoRows
          rows={[
            ["Nom complet", contact.fullName, UserRound],
            ["Prénom", contact.firstName, UserRound],
            ["Nom", contact.lastName, UserRound],
            ["Statut", contact.status, UserRound],
            ["Rôle", contact.role ?? "Non défini", UserRound]
          ]}
        />
      </SectionCard>

      <SectionCard className="p-5">
        <SectionTitle eyebrow="Travail" title="Informations professionnelles" />
        <InfoRows
          rows={[
            ["Société", company?.displayName ?? "Société non définie", Building2],
            ["Fonction", contact.jobTitle ?? "Non défini", UserRound],
            ["Département", contact.department ?? "Non défini", Building2],
            ["Responsable", contact.ownerId ?? "Non assigné", UserRound]
          ]}
        />
      </SectionCard>

      <SectionCard className="p-5">
        <SectionTitle eyebrow="Communication" title="Coordonnées" />
        <InfoRows
          rows={[
            ["Email", contact.email ?? "Non renseigné", Mail],
            ["Mobile", contact.mobilePhone ?? "Non renseigné", Phone],
            ["Téléphone bureau", contact.officePhone ?? "Non renseigné", Phone],
            ["LinkedIn", contact.linkedin ?? "Non renseigné", UserRound]
          ]}
        />
      </SectionCard>

      <SectionCard className="p-5">
        <SectionTitle eyebrow="Contexte" title="Localisation et tags" />
        <InfoRows
          rows={[
            ["Langue", contact.preferredLanguage ?? "Non défini", Languages],
            ["Fuseau horaire", contact.timezone ?? "Non défini", Clock],
            ["Pays société", company?.country ?? "Non défini", MapPin],
            ["Tags", contact.tags.length > 0 ? contact.tags.join(", ") : "Aucun tag", Tags]
          ]}
        />
        {contact.notes && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-hicotech-dark-page/50 dark:text-slate-300">{contact.notes}</p>}
      </SectionCard>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">{eyebrow}</p>
      <h2 className="mt-2 font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h2>
    </div>
  );
}

function InfoRows({ rows }: { rows: Array<[string, string, React.ComponentType<{ size?: number; className?: string }>] > }) {
  return (
    <dl className="mt-5 space-y-3">
      {rows.map(([label, value, Icon]) => (
        <div key={label} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
          <dt className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            <Icon size={15} />
            {label}
          </dt>
          <dd className="text-right text-sm font-semibold text-hicotech-navy dark:text-white">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
