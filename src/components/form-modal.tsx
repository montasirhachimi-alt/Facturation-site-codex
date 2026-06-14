"use client";

import type { FormEvent } from "react";
import { X } from "lucide-react";

export function FormModal({
  title,
  children,
  submitLabel = "Enregistrer",
  maxWidth = "max-w-4xl",
  onClose,
  onSubmit
}: {
  title: string;
  children: React.ReactNode;
  submitLabel?: string;
  maxWidth?: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className={`${maxWidth} max-h-[92vh] w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card`}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-hicotech-navy dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-hicotech-navy dark:border-hicotech-dark-border dark:text-white" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">
            Annuler
          </button>
          <button type="submit" className="rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft">
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
