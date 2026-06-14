"use client";

import { AlertTriangle, X } from "lucide-react";

export function ConfirmDeleteDialog({
  title,
  description,
  onCancel,
  onConfirm
}: {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-red-50 text-hicotech-red dark:bg-red-950/30">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-hicotech-navy dark:text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 p-2 text-hicotech-navy dark:border-hicotech-dark-border dark:text-white" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">
            Annuler
          </button>
          <button type="button" onClick={onConfirm} className="rounded-lg bg-hicotech-red px-4 py-2.5 text-sm font-bold text-white shadow-soft">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
