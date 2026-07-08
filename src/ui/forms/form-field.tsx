export const entityInputClassName = "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-hicotech-navy outline-none ring-hicotech-blue/10 transition placeholder:text-slate-400 focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white dark:placeholder:text-slate-400";

export function FormField({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-hicotech-navy dark:text-white">{label}</span>
      {children}
    </label>
  );
}
