export function EntityToolbar({
  actions,
  children
}: {
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.05rem] border border-slate-200/80 bg-white p-3.5 shadow-[0_10px_30px_rgba(10,30,63,0.06)] shadow-slate-200/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        {children}
        {actions && <div className="flex flex-wrap items-center gap-2 xl:justify-end">{actions}</div>}
      </div>
    </section>
  );
}
