export function CustomerLoadingState() {
  return (
    <div className="space-y-3 p-4" aria-label="Chargement des clients">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="grid animate-pulse grid-cols-[1.5fr_1fr_1fr_1fr_120px] gap-4 rounded-lg border border-slate-100 p-4 dark:border-hicotech-dark-border">
          <div className="h-4 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-4 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-4 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-4 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-4 rounded bg-slate-200 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}

