import type { LucideIcon } from "lucide-react";
import { MetricCard } from "@/ui";

export function CustomerStatCard({
  icon: Icon,
  label,
  value,
  helper
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
}) {
  return <MetricCard icon={Icon} label={label} value={value} helper={helper} />;
}
