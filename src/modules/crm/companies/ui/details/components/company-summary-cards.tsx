import { FileText, ReceiptText, UsersRound, WalletCards } from "lucide-react";
import { MetricCard } from "@/ui";

const summaryCards = [
  { icon: UsersRound, label: "Contacts", value: "0", helper: "Disponibles via l'onglet Contacts" },
  { icon: FileText, label: "Devis", value: "Voir", helper: "Documents commerciaux liés" },
  { icon: ReceiptText, label: "Factures", value: "Voir", helper: "Suivi de facturation" },
  { icon: WalletCards, label: "Paiements", value: "Voir", helper: "Encaissements liés" }
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
