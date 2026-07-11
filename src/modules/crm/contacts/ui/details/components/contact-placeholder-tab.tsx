import { Clock3 } from "lucide-react";
import { EntityEmptyState, SectionCard } from "@/ui";

export function ContactPlaceholderTab({ label }: { label: string }) {
  return (
    <SectionCard className="p-6">
      <EntityEmptyState
        icon={Clock3}
        title={`${formatLabel(label)} est masqué dans cette édition`}
        description="Cette section n'est pas affichée dans le workspace Contact actuel afin de préserver une expérience complète et claire."
      />
    </SectionCard>
  );
}

function formatLabel(label: string) {
  const labels: Record<string, string> = {
    emails: "Emails",
    documents: "Documents",
    settings: "Paramètres"
  };
  return labels[label] ?? label.charAt(0).toUpperCase() + label.slice(1);
}
