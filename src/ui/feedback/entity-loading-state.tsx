export function EntityLoadingState({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <div className="space-y-3 p-4" aria-label="Chargement des données">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="grid animate-pulse gap-4 rounded-lg border border-slate-100 p-4 dark:border-hicotech-dark-border"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, itemIndex) => (
            <div key={itemIndex} className="h-4 rounded bg-slate-200 dark:bg-white/10" />
          ))}
        </div>
      ))}
    </div>
  );
}

