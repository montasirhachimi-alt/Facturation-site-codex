import Link from "next/link";
import type { TimelineEvent as TimelineEventRecord } from "@/runtime/timeline";

type TimelineEventProps = {
  event: TimelineEventRecord;
};

export function TimelineEvent({ event }: TimelineEventProps) {
  const actorLabel = typeof event.actor === "string" ? event.actor : event.actor?.name;
  const linkHref = typeof event.link === "string" ? event.link : event.link?.href;
  const linkLabel = typeof event.link === "string" ? "Ouvrir" : event.link?.label ?? "Ouvrir";
  const status = getTimelineStatus(event.status);

  return (
    <li className="list-none" data-testid="timeline-event">
      <article className="group relative rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold leading-5 text-slate-950 dark:text-white">{event.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-300">
                <time dateTime={event.date}>{formatTimelineDate(event.date)}</time>
                {actorLabel ? <span className="break-words">{actorLabel}</span> : null}
              </div>
            </div>
            <TimelineStatus status={status} />
          </div>

          {event.description ? <p className="mt-3 break-words text-sm leading-5 text-slate-600 dark:text-slate-300">{event.description}</p> : null}

          {linkHref ? (
            <div className="mt-3">
              <Link className="inline-flex max-w-full items-center rounded-md text-sm font-semibold text-slate-800 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-hicotech-blue/30 dark:text-white" href={linkHref}>
                <span className="truncate">{linkLabel}</span>
              </Link>
            </div>
          ) : null}
        </div>
      </article>
    </li>
  );
}

function TimelineStatus({ status }: { status: ReturnType<typeof getTimelineStatus> }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold ${status.className}`} aria-label={`Statut ${status.label}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`} />
      {status.label}
    </span>
  );
}

function getTimelineStatus(status = "neutral" as TimelineEventRecord["status"]) {
  const normalizedStatus = status ?? "neutral";
  const labels = {
    danger: "Alerte",
    info: "Info",
    neutral: "Suivi",
    success: "Validé",
    warning: "Attention"
  } satisfies Record<NonNullable<TimelineEventRecord["status"]>, string>;
  const classes = {
    danger: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200",
    info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200",
    neutral: "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
  } satisfies Record<NonNullable<TimelineEventRecord["status"]>, string>;
  const dotClasses = {
    danger: "bg-rose-500",
    info: "bg-blue-500",
    neutral: "bg-slate-400",
    success: "bg-emerald-500",
    warning: "bg-amber-500"
  } satisfies Record<NonNullable<TimelineEventRecord["status"]>, string>;

  return {
    className: classes[normalizedStatus],
    dotClassName: dotClasses[normalizedStatus],
    label: labels[normalizedStatus]
  };
}

function formatTimelineDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
