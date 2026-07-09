import { Search } from "lucide-react";

export function EntitySearchBar({
  onChange,
  placeholder,
  value
}: {
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm shadow-slate-200/30 transition focus-within:border-hicotech-blue focus-within:bg-white focus-within:ring-4 focus-within:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:shadow-none">
      <Search size={15} className="shrink-0 text-slate-400 transition group-focus-within:text-hicotech-blue" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-sm font-semibold text-hicotech-navy outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-400"
        placeholder={placeholder}
      />
    </label>
  );
}
