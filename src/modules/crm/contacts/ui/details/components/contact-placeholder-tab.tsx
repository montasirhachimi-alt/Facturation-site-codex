import { Clock3 } from "lucide-react";
import { EntityEmptyState, SectionCard } from "@/ui";

export function ContactPlaceholderTab({ label }: { label: string }) {
  return (
    <SectionCard className="p-6">
      <EntityEmptyState
        icon={Clock3}
        title={`${formatLabel(label)} sera disponible prochainement`}
        description="Ce workspace est préparé pour les futurs modules CRM connectés sans ajouter de logique métier prématurée."
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
