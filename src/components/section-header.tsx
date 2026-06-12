"use client";

import { Check, Plus, X } from "lucide-react";
import { FormEvent, useState } from "react";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: string;
};

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpen(false);
    setSaved(true);
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-hicotech-blue">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white md:text-3xl">
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
            {description}
          </p>
          {saved && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-hicotech-green">
              <Check size={16} />
              Brouillon enregistré
            </p>
          )}
        </div>
        {action && (
          <button
            type="button"
            onClick={() => {
              setSaved(false);
              setOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700"
          >
            <Plus size={18} />
            {action}
          </button>
        )}
      </div>

      {action && open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-navy/40 px-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#07152d]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-hicotech-blue">
                  {eyebrow}
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white">
                  {action}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 p-2 text-hicotech-navy transition hover:bg-hicotech-cloud dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-hicotech-navy dark:text-white">
                  Libellé
                </span>
                <input
                  required
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4 dark:border-white/10 dark:bg-white/5"
                  placeholder="Ex. nouvelle opération"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-hicotech-navy dark:text-white">
                  Description
                </span>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4 dark:border-white/10 dark:bg-white/5"
                  placeholder="Notes internes"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-hicotech-navy dark:text-white">
                  Statut
                </span>
                <select className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4 dark:border-white/10 dark:bg-white/5">
                  <option>Brouillon</option>
                  <option>En cours</option>
                  <option>Validé</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-cloud dark:border-white/10 dark:text-white dark:hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700"
              >
                <Check size={18} />
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
