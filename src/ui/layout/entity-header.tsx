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
    <header className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
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
          <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-hicotech-navy dark:text-white md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>
        </div>
        {meta}
      </div>
    </header>
  );
}
