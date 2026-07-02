import { CalendarClock, Mail, MessageSquareText, StickyNote, Target, Timer } from "lucide-react";
import { MetricCard } from "@/ui";

export function ContactSummaryCards({
  summary
}: {
  summary: Readonly<{
    openActivities: number;
    meetings: number;
    tasks: number;
    emails: number;
    notes: number;
    lastInteraction: string;
  }>;
}) {
  const cards = [
    { icon: Target, label: "Open Activities", value: String(summary.openActivities), helper: "Linked to this contact" },
    { icon: CalendarClock, label: "Meetings", value: String(summary.meetings), helper: "Future meetings ready" },
    { icon: MessageSquareText, label: "Tasks", value: String(summary.tasks), helper: "Follow-up actions" },
    { icon: Mail, label: "Emails", value: String(summary.emails), helper: "Future email module" },
    { icon: StickyNote, label: "Notes", value: String(summary.notes), helper: "Future notes module" },
    { icon: Timer, label: "Last Interaction", value: summary.lastInteraction, helper: "From ActivityService" }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </section>
  );
}
