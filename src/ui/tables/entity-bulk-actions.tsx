export function EntityBulkActions({
  actions,
  selectedCount
}: {
  actions?: React.ReactNode;
  selectedCount: number;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <span className="text-xs font-bold text-hicotech-blue">{selectedCount} sélectionné(s)</span>
      {actions}
    </div>
  );
}

