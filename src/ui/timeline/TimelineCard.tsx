import type { TimelineEvent as TimelineEventRecord } from "@/runtime/timeline";
import { TimelineEvent } from "./TimelineEvent";

type TimelineCardProps = {
  events: readonly TimelineEventRecord[];
  emptyMessage?: string;
};

export function TimelineCard({ events, emptyMessage = "Aucun événement disponible." }: TimelineCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/30" data-testid="business-timeline-card">
      {events.length ? (
        <ol className="space-y-2" data-testid="business-timeline-list">
          {events.map((event) => (
            <TimelineEvent event={event} key={event.id} />
          ))}
        </ol>
      ) : (
        <p className="rounded-md border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:text-slate-300" data-testid="business-timeline-empty">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}
