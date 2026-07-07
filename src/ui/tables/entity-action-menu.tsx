import { clsx } from "clsx";

export function EntityActionButton({
  danger,
  disabled,
  icon,
  label,
  onClick
}: {
  danger?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-bold transition hover:-translate-y-0.5 focus:outline-none focus:ring-4",
        danger
          ? "border-red-100 text-red-600 hover:bg-red-50 focus:ring-red-100 dark:border-red-400/20 dark:text-red-300 dark:hover:bg-red-400/10"
          : "border-slate-200 text-hicotech-navy hover:bg-hicotech-cloud focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-dark-page",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function EntityActionMenu({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}
