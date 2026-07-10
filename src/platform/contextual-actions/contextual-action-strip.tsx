"use client";

import Link from "next/link";
import { useRef } from "react";
import type { KeyboardEvent } from "react";
import type { ContextualAction } from "./contextual-action.types";
import { getContextualActionToneClass } from "./contextual-action.utils";

export function ContextualActionStrip({
  actions,
  description = "Actions suggérées pour continuer sans changer de contexte.",
  title = "Prochaines actions"
}: {
  actions: readonly ContextualAction[];
  description?: string;
  title?: string;
}) {
  const itemRefs = useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>([]);

  if (actions.length === 0) return null;

  function focusSibling(currentIndex: number, direction: 1 | -1) {
    for (let step = 1; step <= actions.length; step += 1) {
      const nextIndex = (currentIndex + direction * step + actions.length) % actions.length;
      if (!actions[nextIndex]?.disabled) {
        itemRefs.current[nextIndex]?.focus();
        return;
      }
    }
  }

  function onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusSibling(index, 1);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusSibling(index, -1);
    }

    if (event.key === " ") {
      const target = event.currentTarget;
      if (target instanceof HTMLAnchorElement) {
        event.preventDefault();
        target.click();
      }
    }
  }

  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-slate-200/85 bg-white px-4 py-3 shadow-sm shadow-slate-200/60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-hicotech-blue">{title}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2" role="toolbar" aria-label={title}>
          {actions.map((action, index) => (
            <ActionChip
              key={action.id}
              action={action}
              refCallback={(node) => {
                itemRefs.current[index] = node;
              }}
              onKeyDown={(event) => onKeyDown(event, index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ActionChip({
  action,
  onKeyDown,
  refCallback
}: {
  action: ContextualAction;
  onKeyDown: (event: KeyboardEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  refCallback: (node: HTMLAnchorElement | HTMLButtonElement | null) => void;
}) {
  const Icon = action.icon;
  const className = [
    "inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition duration-200 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/15 disabled:cursor-not-allowed disabled:opacity-45",
    getContextualActionToneClass(action.tone)
  ].join(" ");
  const ariaLabel = action.ariaLabel ?? action.label;

  if (action.href && !action.disabled) {
    return (
      <Link
        ref={refCallback}
        href={action.href}
        aria-label={ariaLabel}
        title={action.description}
        onKeyDown={onKeyDown}
        className={className}
      >
        <Icon size={15} aria-hidden="true" />
        {action.label}
      </Link>
    );
  }

  return (
    <button
      ref={refCallback}
      type="button"
      aria-label={ariaLabel}
      title={action.disabled ? action.disabledReason : action.description}
      disabled={action.disabled}
      onClick={action.onSelect}
      onKeyDown={onKeyDown}
      className={className}
    >
      <Icon size={15} aria-hidden="true" />
      {action.label}
    </button>
  );
}
