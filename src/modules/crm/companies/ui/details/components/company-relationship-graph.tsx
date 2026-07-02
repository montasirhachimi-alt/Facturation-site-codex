import { BriefcaseBusiness, Building2, HandCoins, ReceiptText, ShoppingCart, UsersRound } from "lucide-react";
import { SectionCard } from "@/ui";

const nodes = [
  { icon: Building2, label: "Company", active: true },
  { icon: UsersRound, label: "Contacts" },
  { icon: UsersRound, label: "Customers" },
  { icon: BriefcaseBusiness, label: "Projects" },
  { icon: ReceiptText, label: "Invoices" },
  { icon: HandCoins, label: "Sales" },
  { icon: ShoppingCart, label: "Orders" }
];

export function CompanyRelationshipGraph() {
  return (
    <SectionCard className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">Relationship Graph</p>
          <h2 className="mt-2 font-display text-lg font-bold text-hicotech-navy dark:text-white">Connected business context</h2>
        </div>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-300">Future modules will attach here as the company operating graph grows.</p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-7">
        {nodes.map((node, index) => {
          const Icon = node.icon;
          return (
            <div key={node.label} className="relative">
              <div className={`rounded-xl border p-4 text-center ${node.active ? "border-hicotech-blue bg-hicotech-sky dark:bg-hicotech-blue/20" : "border-slate-200 bg-white dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50"}`}>
                <span className="mx-auto grid size-10 place-items-center rounded-xl bg-white text-hicotech-blue shadow-sm dark:bg-hicotech-dark-card dark:text-blue-100">
                  <Icon size={18} />
                </span>
                <p className="mt-3 text-sm font-bold text-hicotech-navy dark:text-white">{node.label}</p>
                {!node.active && <p className="mt-1 text-xs text-slate-400">Future</p>}
              </div>
              {index < nodes.length - 1 && <span className="absolute left-full top-1/2 hidden h-px w-3 bg-slate-200 lg:block dark:bg-hicotech-dark-border" />}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
