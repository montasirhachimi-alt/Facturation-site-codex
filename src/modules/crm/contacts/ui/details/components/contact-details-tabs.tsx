import { clsx } from "clsx";
import { crmFeatureVisibility } from "@/modules/crm/crm-feature-visibility";
import type { ContactDetailsTab } from "../hooks/use-contact-details";

const tabs: Array<{ id: ContactDetailsTab; label: string }> = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "opportunities", label: "Opportunités" },
  { id: "quotes", label: "Devis" },
  { id: "invoices", label: "Factures" },
  { id: "activities", label: "Activités" },
  { id: "meetings", label: "Réunions" },
  { id: "tasks", label: "Tâches" },
  { id: "notes", label: "Notes" },
  ...(crmFeatureVisibility.contactTabs.emails ? [{ id: "emails" as const, label: "Emails" }] : []),
  ...(crmFeatureVisibility.contactTabs.documents ? [{ id: "documents" as const, label: "Documents" }] : []),
  ...(crmFeatureVisibility.contactTabs.settings ? [{ id: "settings" as const, label: "Paramètres" }] : [])
];

export function ContactDetailsTabs({ activeTab, onChange }: { activeTab: ContactDetailsTab; onChange: (tab: ContactDetailsTab) => void }) {
  return (
    <div className="sticky top-[4.75rem] z-20 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-hicotech-dark-border dark:bg-hicotech-dark-card/95 dark:shadow-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={clsx(
            "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10",
            activeTab === tab.id
              ? "bg-hicotech-navy text-white shadow-sm dark:bg-hicotech-blue"
              : "text-slate-500 hover:bg-hicotech-cloud hover:text-hicotech-navy dark:text-slate-300 dark:hover:bg-hicotech-dark-page dark:hover:text-white"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
