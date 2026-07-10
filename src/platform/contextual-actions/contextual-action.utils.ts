import type { ContextualAction, ContextualActionTone } from "./contextual-action.types";

export function sortContextualActions(actions: readonly ContextualAction[]) {
  return [...actions].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) || a.label.localeCompare(b.label, "fr"));
}

export function getContextualActionToneClass(tone: ContextualActionTone = "neutral") {
  const classes: Record<ContextualActionTone, string> = {
    neutral:
      "border-slate-200 bg-white text-hicotech-navy shadow-sm shadow-slate-200/70 hover:border-hicotech-blue/30 hover:bg-hicotech-cloud dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-white dark:shadow-none dark:hover:bg-hicotech-dark-page",
    primary:
      "border-hicotech-blue bg-hicotech-blue text-white shadow-soft hover:bg-blue-700 dark:border-hicotech-blue dark:bg-hicotech-blue",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-100/70 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
    warning:
      "border-amber-200 bg-amber-50 text-amber-800 shadow-sm shadow-amber-100/70 hover:border-amber-300 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
  };

  return classes[tone];
}
