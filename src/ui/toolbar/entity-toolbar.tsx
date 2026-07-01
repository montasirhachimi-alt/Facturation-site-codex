export function EntityToolbar({
  actions,
  children
}: {
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-200/60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {children}
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
}
