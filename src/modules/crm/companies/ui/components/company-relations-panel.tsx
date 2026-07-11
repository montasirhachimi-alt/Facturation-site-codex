import { BriefcaseBusiness, FileText, HandCoins, ReceiptText, ShoppingCart, UsersRound } from "lucide-react";
import { SectionCard } from "@/ui";

const relations = [
  { label: "Contacts", icon: UsersRound, value: "Connecté" },
  { label: "Clients", icon: UsersRound, value: "Masqué" },
  { label: "Projets", icon: BriefcaseBusiness, value: "Masqué" },
  { label: "Factures", icon: ReceiptText, value: "Connecté" },
  { label: "Opportunités", icon: HandCoins, value: "Connecté" },
  { label: "Devis", icon: FileText, value: "Connecté" },
  { label: "Commandes", icon: ShoppingCart, value: "Masqué" }
];

export function CompanyRelationsPanel() {
  return (
    <SectionCard className="p-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-base font-bold text-hicotech-navy dark:text-white">Relations CRM</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-300">État des liens disponibles autour de la société.</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {relations.map((relation) => {
          const Icon = relation.icon;
          return (
            <div key={relation.label} className="rounded-lg border border-slate-200 p-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-hicotech-navy dark:text-white">{relation.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">{relation.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
