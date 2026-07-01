import { MetricCard } from "./metric-card";
import type { EntityMetric } from "../types/entity-ui.types";

export function EntityStatsCards({ metrics }: { metrics: readonly EntityMetric[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </section>
  );
}

