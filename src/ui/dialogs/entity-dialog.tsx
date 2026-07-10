import { AlertCircle, X } from "lucide-react";
import type { FormEvent, KeyboardEvent } from "react";
import { isModKey } from "@/platform/keyboard/keyboard-shortcut.utils";

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

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    const shouldSubmit = isModKey(event.nativeEvent) && (event.key === "Enter" || event.key.toLowerCase() === "s");
    if (!shouldSubmit || event.repeat) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.requestSubmit();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/65 px-4 py-6 backdrop-blur-sm">
      <form
        onSubmit={submit}
        onKeyDown={handleKeyDown}
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_28px_90px_rgba(10,30,63,0.24)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-keyshortcuts="Meta+Enter Control+Enter Meta+S Control+S Escape"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-hicotech-dark-border">
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-hicotech-blue">{eyebrow}</p>
            <h2 className="mt-1.5 font-display text-xl font-bold text-hicotech-navy dark:text-white">{title}</h2>
            {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-hicotech-navy transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold leading-6 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        {children}
        {footer}
      </form>
    </div>
  );
}
