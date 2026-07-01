import { SectionCard } from "@/ui";

export function CompanyPlaceholderTab({ label }: { label: string }) {
  return (
    <SectionCard className="p-6">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Future module</p>
        <h2 className="mt-3 font-display text-xl font-bold text-hicotech-navy dark:text-white">{label}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
          Available in future module. This workspace is prepared so CRM, Sales, Projects and Billing data can attach here without redesign.
        </p>
      </div>
    </SectionCard>
  );
}
