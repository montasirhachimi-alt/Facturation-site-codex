import { SectionCard } from "@/ui";

export function CompanyPlaceholderTab({ label }: { label: string }) {
  return (
    <SectionCard className="p-6">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Section masquée</p>
        <h2 className="mt-3 font-display text-xl font-bold text-hicotech-navy dark:text-white">{formatCompanyTabLabel(label)}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
          Cette section n&apos;est pas affichée dans l&apos;édition CRM actuelle afin de garder le workspace concentré sur les surfaces opérationnelles.
        </p>
      </div>
    </SectionCard>
  );
}

function formatCompanyTabLabel(label: string) {
  const labels: Record<string, string> = {
    customers: "Clients liés",
    sales: "Ventes",
    projects: "Projets",
    invoices: "Factures",
    activity: "Activité",
    notes: "Notes",
    settings: "Paramètres"
  };
  return labels[label] ?? label;
}
