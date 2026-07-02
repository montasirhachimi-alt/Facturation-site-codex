import { BriefcaseBusiness, FileText, HandCoins, ReceiptText, ShoppingCart, TrendingUp, UsersRound } from "lucide-react";
import { MetricCard } from "@/ui";

const summaryCards = [
  { icon: UsersRound, label: "Contacts", value: "0", helper: "Available in future module" },
  { icon: UsersRound, label: "Customers", value: "0", helper: "Available in future module" },
  { icon: BriefcaseBusiness, label: "Projects", value: "0", helper: "Available in future module" },
  { icon: ReceiptText, label: "Invoices", value: "0", helper: "Available in future module" },
  { icon: HandCoins, label: "Open opportunities", value: "0", helper: "Available in future module" },
  { icon: FileText, label: "Open quotes", value: "0", helper: "Available in future module" },
  { icon: ShoppingCart, label: "Open orders", value: "0", helper: "Available in future module" },
  { icon: TrendingUp, label: "Revenue", value: "0 MAD", helper: "Placeholder revenue" }
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
