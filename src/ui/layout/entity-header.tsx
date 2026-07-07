export function EntityHeader({
  breadcrumb,
  description,
  meta,
  title
}: {
  breadcrumb: readonly string[];
  description: string;
  meta?: React.ReactNode;
  title: string;
}) {
  return (
    <header className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_22px_70px_rgba(10,30,63,0.10)] shadow-slate-200/70 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <span className="absolute inset-x-0 top-0 h-1.5 bg-hicotech-blue" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-300" aria-label="Breadcrumb">
            {breadcrumb.map((item, index) => (
              <span key={`${item}-${index}`} className={index === breadcrumb.length - 1 ? "text-hicotech-blue" : undefined}>
                {index > 0 ? "/ " : ""}
                {item}
              </span>
            ))}
          </nav>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-hicotech-navy dark:text-white md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-300">{description}</p>
        </div>
        {meta}
      </div>
    </header>
  );
}
