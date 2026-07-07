export function EntityPagination({
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions = [5, 8, 12],
  total
}: {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  pageSizeOptions?: readonly number[];
  total: number;
}) {
  return (
    <footer className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-sm shadow-sm shadow-slate-200/60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none md:flex-row md:items-center md:justify-between">
      <p className="font-semibold text-slate-500 dark:text-slate-300">{total} résultat(s)</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pageSize}
          onChange={(event) => {
            onPageSizeChange(Number(event.target.value));
            onPageChange(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-hicotech-navy outline-none transition focus:border-hicotech-blue focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
          aria-label="Nombre de lignes par page"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option} lignes
            </option>
          ))}
        </select>
        <button type="button" disabled={!hasPreviousPage} onClick={() => onPageChange(Math.max(1, page - 1))} className="rounded-xl border border-slate-200 px-3 py-2 font-bold transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/50 disabled:opacity-40 dark:border-hicotech-dark-border dark:hover:bg-hicotech-dark-page">
          Précédent
        </button>
        <span className="font-bold text-hicotech-navy dark:text-white">Page {page}</span>
        <button type="button" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)} className="rounded-xl border border-slate-200 px-3 py-2 font-bold transition hover:border-hicotech-blue/30 hover:bg-hicotech-sky/50 disabled:opacity-40 dark:border-hicotech-dark-border dark:hover:bg-hicotech-dark-page">
          Suivant
        </button>
      </div>
    </footer>
  );
}
