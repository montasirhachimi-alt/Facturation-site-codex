import { CalendarDays, Hash, Mail, MapPinned, Phone, Tags, UserRound } from "lucide-react";
import { SectionCard } from "@/ui";
import type { Company } from "../../../company.types";

export function CompanyOverview({ company }: { company: Company }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <DetailsSection title="Informations générales">
        <DetailItem icon={<Hash size={16} />} label="Raison sociale" value={company.legalName} />
        <DetailItem icon={<Hash size={16} />} label="Registre de commerce" value={company.registrationNumber} />
        <DetailItem icon={<Hash size={16} />} label="Identifiant fiscal" value={company.taxNumber} />
        <DetailItem icon={<UserRound size={16} />} label="Responsable" value={company.ownerId} />
      </DetailsSection>

      <DetailsSection title="Communication">
        <DetailItem icon={<Mail size={16} />} label="Email" value={company.email} />
        <DetailItem icon={<Phone size={16} />} label="Téléphone" value={company.phone} />
        <DetailItem icon={<Hash size={16} />} label="Site web" value={company.website} />
      </DetailsSection>

      <DetailsSection title="Adresse">
        <DetailItem icon={<MapPinned size={16} />} label="Adresse" value={company.address} />
        <DetailItem icon={<MapPinned size={16} />} label="Ville" value={company.city} />
        <DetailItem icon={<MapPinned size={16} />} label="Pays" value={company.country} />
      </DetailsSection>

      <DetailsSection title="Espace de travail">
        <DetailItem icon={<CalendarDays size={16} />} label="Créé" value={formatDate(company.createdAt)} />
        <DetailItem icon={<CalendarDays size={16} />} label="Mis à jour" value={formatDate(company.updatedAt)} />
        <DetailItem icon={<Hash size={16} />} label="Espace" value={company.workspaceId} />
      </DetailsSection>

      <DetailsSection title="Tags">
        <div className="flex flex-wrap gap-2">
          {company.tags.length > 0 ? (
            company.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-hicotech-sky px-3 py-1 text-xs font-bold text-hicotech-blue dark:bg-hicotech-blue/20 dark:text-blue-200">
                <Tags size={13} />
                {tag}
              </span>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-300">Aucun tag.</p>
          )}
        </div>
      </DetailsSection>

      <DetailsSection title="Notes">
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{company.notes ?? "Aucune note enregistrée pour cette société."}</p>
      </DetailsSection>
    </div>
  );
}

function DetailsSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <SectionCard className="p-5">
      <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </SectionCard>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
      <span className="mt-0.5 text-hicotech-blue">{icon}</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-semibold text-hicotech-navy dark:text-white">{value || "-"}</p>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
