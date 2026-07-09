export function EntityBulkActions({
  actions,
  selectedCount
}: {
  actions?: React.ReactNode;
  selectedCount: number;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-hicotech-blue/20 bg-hicotech-sky/70 px-3 py-2 shadow-sm shadow-blue-100/50 dark:border-hicotech-blue/30 dark:bg-hicotech-blue/10">
      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-hicotech-blue shadow-sm dark:bg-hicotech-dark-card">{selectedCount} sélectionné(s)</span>
      {actions}
    </div>
  );
}
