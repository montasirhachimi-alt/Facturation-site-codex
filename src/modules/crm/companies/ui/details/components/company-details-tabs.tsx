import type { CompanyDetailsTab } from "../hooks/use-company-details";

const tabs: Array<{ id: CompanyDetailsTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "contacts", label: "Contacts" },
  { id: "customers", label: "Customers" },
  { id: "sales", label: "Sales" },
  { id: "projects", label: "Projects" },
  { id: "invoices", label: "Invoices" },
  { id: "activity", label: "Activity" },
  { id: "notes", label: "Notes" },
  { id: "settings", label: "Settings" }
];

export function CompanyDetailsTabs({
  activeTab,
  onChange
}: {
  activeTab: CompanyDetailsTab;
  onChange: (tab: CompanyDetailsTab) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white p-2 shadow-sm shadow-slate-200/60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="flex min-w-max gap-1" role="tablist" aria-label="Company workspace tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onChange(tab.id)}
            className={`rounded-lg px-4 py-2.5 text-sm font-bold transition duration-200 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 ${
              activeTab === tab.id
                ? "bg-hicotech-navy text-white shadow-soft dark:bg-hicotech-blue"
                : "text-slate-600 hover:bg-hicotech-cloud dark:text-slate-300 dark:hover:bg-hicotech-dark-page"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
