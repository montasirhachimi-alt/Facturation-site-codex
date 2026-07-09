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
    <label className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm shadow-slate-200/40 transition focus-within:border-hicotech-blue focus-within:ring-4 focus-within:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:shadow-none">
      <Search size={16} className="text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-sm font-medium outline-none dark:text-white dark:placeholder:text-slate-400"
        placeholder={placeholder}
      />
    </label>
  );
}
