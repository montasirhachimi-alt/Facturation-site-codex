export function EntityLoadingState({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <div className="space-y-3 p-5" aria-label="Chargement des données">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="grid animate-pulse gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, itemIndex) => (
            <div key={itemIndex} className="h-4 rounded-full bg-slate-200 dark:bg-white/10" />
          ))}
        </div>
      ))}
    </div>
  );
}
