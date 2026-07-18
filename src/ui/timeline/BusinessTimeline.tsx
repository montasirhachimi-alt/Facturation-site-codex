import type { TimelineEvent as TimelineEventRecord } from "@/runtime/timeline";
import { TimelineCard } from "./TimelineCard";

type BusinessTimelineProps = {
  events: readonly TimelineEventRecord[];
  title?: string;
  description?: string;
  emptyMessage?: string;
};

export function BusinessTimeline({
  events,
  title = "Timeline business",
  description,
  emptyMessage
}: BusinessTimelineProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      <TimelineCard emptyMessage={emptyMessage} events={events} />
    </div>
  );
}
