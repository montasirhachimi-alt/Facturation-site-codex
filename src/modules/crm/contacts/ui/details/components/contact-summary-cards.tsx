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
    { icon: Target, label: "Activités ouvertes", value: String(summary.openActivities), helper: "Liées à ce contact" },
    { icon: CalendarClock, label: "Réunions", value: String(summary.meetings), helper: "Workflow réunions actif" },
    { icon: MessageSquareText, label: "Tâches", value: String(summary.tasks), helper: "Actions de suivi" },
    { icon: Mail, label: "Emails", value: String(summary.emails), helper: "Module email futur" },
    { icon: StickyNote, label: "Notes", value: String(summary.notes), helper: "Contexte commercial" },
    { icon: Timer, label: "Dernière interaction", value: summary.lastInteraction, helper: "Depuis ActivityService" }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </section>
  );
}
