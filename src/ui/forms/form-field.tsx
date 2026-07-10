export const entityInputClassName = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-hicotech-navy outline-none ring-hicotech-blue/10 transition placeholder:text-slate-400 focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white dark:placeholder:text-slate-400";

export function FormField({
  children,
  help,
  label,
  required
}: {
  children: React.ReactNode;
  help?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-sm font-bold text-hicotech-navy dark:text-white">
        {label}
        {required && <span className="text-hicotech-blue" aria-label="Champ obligatoire">*</span>}
      </span>
      {children}
      {help && <span className="mt-1 block text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{help}</span>}
    </label>
  );
}

export function FormSection({
  children,
  description,
  title
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/35">
      <div className="mb-3">
        <h3 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{title}</h3>
        {description && <p className="mt-0.5 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function FormActions({
  cancelLabel = "Annuler",
  children,
  onCancel,
  submitLabel
}: {
  cancelLabel?: string;
  children?: React.ReactNode;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 dark:border-hicotech-dark-border sm:flex-row sm:items-center sm:justify-end">
      {children}
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        aria-keyshortcuts="Meta+Enter Control+Enter Meta+S Control+S"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(13,110,253,0.18)] transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/20"
      >
        {submitLabel}
        <span className="hidden rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-black sm:inline-flex">⌘/Ctrl Enter</span>
      </button>
    </div>
  );
}

export function FormBooleanField({
  checked,
  description,
  label,
  onChange
}: {
  checked: boolean;
  description?: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-hicotech-blue/30 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 rounded border-slate-300 text-hicotech-blue focus:ring-hicotech-blue"
      />
      <span>
        <span className="block text-sm font-bold text-hicotech-navy dark:text-white">{label}</span>
        {description && <span className="mt-0.5 block text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{description}</span>}
      </span>
    </label>
  );
}
