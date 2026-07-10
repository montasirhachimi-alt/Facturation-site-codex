"use client";

import { Command, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { buildShortcutDisplay } from "./keyboard-shortcut.utils";

const implementedShortcuts = [
  {
    id: "global-command-center",
    key: "k",
    modifiers: ["meta", "ctrl"] as const,
    label: "Centre de commandes",
    description: "Ouvrir la navigation, les records, les favoris, les récents et la création rapide.",
    category: "Global" as const,
    scope: "global" as const
  },
  {
    id: "global-workspace-create",
    key: "n",
    modifiers: ["meta", "ctrl"] as const,
    label: "Créer dans l'espace actif",
    description: "Ouvrir la création principale quand l'espace de travail le supporte.",
    category: "Global" as const,
    scope: "workspace" as const
  },
  {
    id: "global-shortcut-help",
    key: "?",
    label: "Aide clavier",
    description: "Afficher les raccourcis disponibles.",
    category: "Global" as const,
    scope: "global" as const
  },
  {
    id: "form-submit-enter",
    key: "Enter",
    modifiers: ["meta", "ctrl"] as const,
    label: "Soumettre le formulaire",
    description: "Créer ou enregistrer depuis un formulaire stable.",
    category: "Formulaires" as const,
    scope: "form" as const
  },
  {
    id: "form-submit-save",
    key: "s",
    modifiers: ["meta", "ctrl"] as const,
    label: "Enregistrer le formulaire",
    description: "Utiliser le même chemin que le bouton principal du formulaire.",
    category: "Formulaires" as const,
    scope: "form" as const
  },
  {
    id: "table-navigation",
    key: "ArrowDown",
    label: "Naviguer les lignes",
    description: "Utiliser ↑ ↓, Home, End puis Enter pour ouvrir une ligne active.",
    category: "Navigation" as const,
    scope: "table" as const
  },
  {
    id: "escape-close",
    key: "Escape",
    label: "Fermer la surface active",
    description: "Fermer le menu, l'aperçu, le dialogue ou l'aide au premier plan.",
    category: "Navigation" as const,
    scope: "dialog" as const
  },
  {
    id: "contextual-actions",
    key: "ArrowRight",
    label: "Actions contextuelles",
    description: "Utiliser ← → puis Enter ou Espace pour activer une action.",
    category: "Actions contextuelles" as const,
    scope: "contextual-actions" as const
  }
];

export function KeyboardShortcutsHelp({ onClose, open }: { onClose: () => void; open: boolean }) {
  const shortcuts = useMemo(() => buildShortcutDisplay(implementedShortcuts), []);
  const grouped = useMemo(() => {
    return shortcuts.reduce<Record<string, typeof shortcuts>>((groups, shortcut) => {
      groups[shortcut.category] = [...(groups[shortcut.category] ?? []), shortcut];
      return groups;
    }, {});
  }, [shortcuts]);

  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-hicotech-navy/35 px-3 pt-[8vh] backdrop-blur-md dark:bg-black/55" role="presentation">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Fermer l'aide clavier" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-help-title"
        aria-describedby="keyboard-help-description"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_28px_90px_rgba(10,30,63,0.24)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 dark:border-hicotech-dark-border sm:px-5">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-hicotech-navy text-white dark:bg-hicotech-blue">
              <Command size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 id="keyboard-help-title" className="font-display text-xl font-black text-hicotech-navy dark:text-white">Raccourcis clavier</h2>
              <p id="keyboard-help-description" className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">
                Les raccourcis actifs restent contextuels et ne se déclenchent pas pendant la saisie.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-hicotech-navy transition hover:bg-hicotech-cloud focus:outline-none focus:ring-4 focus:ring-hicotech-blue/10 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" aria-label="Fermer l'aide clavier">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-3">
            {Object.entries(grouped).map(([category, items]) => (
              <section key={category} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
                <h3 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{category}</h3>
                <div className="mt-3 divide-y divide-slate-200 dark:divide-hicotech-dark-border">
                  {items.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-hicotech-navy dark:text-white">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">{item.description}</p>
                      </div>
                      <kbd className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-black text-slate-600 shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white">
                        {item.shortcut}
                      </kbd>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

