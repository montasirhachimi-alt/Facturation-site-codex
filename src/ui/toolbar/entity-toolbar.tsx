export function EntityToolbar({
  actions,
  children
}: {
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.15rem] border border-slate-200/80 bg-white p-4 shadow-[0_14px_42px_rgba(10,30,63,0.07)] shadow-slate-200/60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {children}
        {actions && <div className="flex flex-wrap gap-2 xl:justify-end">{actions}</div>}
      </div>
    </section>
  );
}
