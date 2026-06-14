"use client";

export type FilterOption = {
  label: string;
  value: string;
};

export function Filters({
  filters
}: {
  filters: Array<{
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:flex">
      {filters.map((filter) => (
        <label key={filter.label} className="block">
          <span className="sr-only">{filter.label}</span>
          <select
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white xl:min-w-44"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
