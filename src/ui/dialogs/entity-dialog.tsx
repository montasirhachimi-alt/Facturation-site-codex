import { X } from "lucide-react";
import type { FormEvent } from "react";

export function EntityDialog({
  children,
  description,
  error,
  eyebrow,
  footer,
  onClose,
  onSubmit,
  open,
  title
}: {
  children: React.ReactNode;
  description?: string;
  error?: string | null;
  eyebrow: string;
  footer: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  open: boolean;
  title: string;
}) {
  if (!open) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-hicotech-blue">{eyebrow}</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-hicotech-navy transition hover:bg-hicotech-cloud dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">{error}</p>}

        {children}
        {footer}
      </form>
    </div>
  );
}

