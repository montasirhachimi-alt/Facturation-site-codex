import { BriefcaseBusiness, FileText, HandCoins, ReceiptText, ShoppingCart, TrendingUp, UsersRound } from "lucide-react";
import { MetricCard } from "@/ui";

const summaryCards = [
  { icon: UsersRound, label: "Contacts", value: "0", helper: "Disponibles via l'onglet Contacts" },
  { icon: UsersRound, label: "Clients liés", value: "0", helper: "Module client connecté plus tard" },
  { icon: BriefcaseBusiness, label: "Projets", value: "0", helper: "Module projets à venir" },
  { icon: ReceiptText, label: "Factures", value: "0", helper: "Connexion facturation future" },
  { icon: HandCoins, label: "Opportunités ouvertes", value: "Voir", helper: "Pipeline commercial préparé" },
  { icon: FileText, label: "Devis ouverts", value: "0", helper: "Module devis à connecter" },
  { icon: ShoppingCart, label: "Commandes ouvertes", value: "0", helper: "Moteur de ventes futur" },
  { icon: TrendingUp, label: "Revenu", value: "0 MAD", helper: "Placeholder financier" }
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
