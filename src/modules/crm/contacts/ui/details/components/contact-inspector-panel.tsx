import Link from "next/link";
import { Building2, CalendarClock, Pin, UserRound } from "lucide-react";
import { SectionCard } from "@/ui";
import type { Company } from "@/modules/crm/companies";
import type { Contact } from "../../../contact.types";

export function ContactInspectorPanel({ company, contact }: { company?: Company; contact: Contact }) {
  const sections = [
    { icon: Building2, title: "Société", text: company?.displayName ?? "Non définie", href: company ? `/crm/companies/${company.id}` : undefined },
    { icon: UserRound, title: "Responsable", text: contact.ownerId ?? "Non assigné" },
    { icon: Pin, title: "Statut", text: contact.status },
    { icon: CalendarClock, title: "Créé", text: formatDate(contact.createdAt) },
    { icon: CalendarClock, title: "Mis à jour", text: formatDate(contact.updatedAt) }
  ];

  return (
    <aside className="space-y-4 xl:sticky xl:top-40 xl:self-start">
      <SectionCard className="p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">Inspecteur</p>
        <h2 className="mt-2 font-display text-lg font-bold text-hicotech-navy dark:text-white">Contexte contact</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">Société, responsabilité et état de la fiche contact.</p>
      </SectionCard>

      {sections.map((section) => {
        const Icon = section.icon;
        const content = (
          <div className="flex items-start gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20">
              <Icon size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-hicotech-navy dark:text-white">{section.title}</h3>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-300">{section.text}</p>
            </div>
          </div>
        );

        return (
          <SectionCard key={section.title} className="p-4 transition hover:-translate-y-0.5 hover:border-hicotech-blue/25">
            {section.href ? (
              <Link href={section.href} className="block rounded-lg transition hover:opacity-80 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10">
                {content}
              </Link>
            ) : (
              content
            )}
          </SectionCard>
        );
      })}
    </aside>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(new Date(value));
}
