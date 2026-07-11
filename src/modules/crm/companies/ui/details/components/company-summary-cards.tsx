import { BriefcaseBusiness, FileText, ReceiptText, UsersRound } from "lucide-react";
import { MetricCard } from "@/ui";

const summaryCards = [
  { icon: UsersRound, label: "Contacts", value: "0", helper: "Disponibles via l'onglet Contacts" },
  { icon: BriefcaseBusiness, label: "Opportunités", value: "Voir", helper: "Pipeline commercial" },
  { icon: FileText, label: "Devis", value: "Voir", helper: "Documents commerciaux liés" },
  { icon: ReceiptText, label: "Factures", value: "Voir", helper: "Suivi de facturation" }
];

export function CompanySummaryCards() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </section>
  );
}
