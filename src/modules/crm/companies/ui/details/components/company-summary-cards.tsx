import { Activity, BriefcaseBusiness, FileText, HandCoins, ReceiptText, ShoppingCart, UsersRound } from "lucide-react";
import { MetricCard } from "@/ui";

const summaryCards = [
  { icon: UsersRound, label: "Contacts", value: "Future", helper: "Available in future module" },
  { icon: UsersRound, label: "Customers", value: "Future", helper: "Available in future module" },
  { icon: BriefcaseBusiness, label: "Projects", value: "Future", helper: "Available in future module" },
  { icon: ReceiptText, label: "Invoices", value: "Future", helper: "Available in future module" },
  { icon: HandCoins, label: "Opportunities", value: "Future", helper: "Available in future module" },
  { icon: FileText, label: "Quotes", value: "Future", helper: "Available in future module" },
  { icon: ShoppingCart, label: "Orders", value: "Future", helper: "Available in future module" },
  { icon: Activity, label: "Activity", value: "Future", helper: "Available in future module" }
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
