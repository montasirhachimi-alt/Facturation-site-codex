import { BriefcaseBusiness, FileText, HandCoins, ReceiptText, ShoppingCart, UsersRound } from "lucide-react";
import { SectionCard } from "@/ui";

const relations = [
  { label: "Contacts", icon: UsersRound, value: "Bientôt" },
  { label: "Customers", icon: UsersRound, value: "Bientôt" },
  { label: "Projects", icon: BriefcaseBusiness, value: "Bientôt" },
  { label: "Invoices", icon: ReceiptText, value: "Bientôt" },
  { label: "Opportunities", icon: HandCoins, value: "Bientôt" },
  { label: "Quotes", icon: FileText, value: "Bientôt" },
  { label: "Orders", icon: ShoppingCart, value: "Bientôt" }
];

export function CompanyRelationsPanel() {
  return (
    <SectionCard className="p-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-base font-bold text-hicotech-navy dark:text-white">Relations futures</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-300">Points d&apos;intégration préparés autour de Company.</p>
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
