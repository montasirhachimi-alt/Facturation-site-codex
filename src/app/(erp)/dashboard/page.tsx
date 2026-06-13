import {
  BadgeDollarSign,
  Banknote,
  Boxes,
  FileWarning,
  HandCoins,
  TriangleAlert,
  ReceiptText,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { ProductRanking } from "@/components/product-ranking";
import { SectionHeader } from "@/components/section-header";
import { FinanceBarsChart, MarginDonutChart, SalesEvolutionChart, TopClientsPanel } from "@/components/dashboard-widgets";
import { dashboardStats } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Tableau de bord"
        title="Bonjour, Administrateur"
        description="Vue synthétique de l'activité commerciale, financière et stock."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BadgeDollarSign}
          label="Chiffre d'affaires"
          value={formatCurrency(dashboardStats.revenue)}
          trend="+12,5%"
          tone="blue"
        />
        <StatCard
          icon={HandCoins}
          label="Achats"
          value={formatCurrency(dashboardStats.purchases)}
          detail="Ce mois"
          tone="orange"
        />
        <StatCard
          icon={ReceiptText}
          label="Dépenses"
          value={formatCurrency(dashboardStats.expenses)}
          detail="Charges enregistrées"
          tone="red"
        />
        <StatCard
          icon={WalletCards}
          label="Reste à encaisser"
          value={formatCurrency(dashboardStats.outstanding)}
          detail="8 factures ouvertes"
          tone="red"
        />
        <StatCard
          icon={TrendingUp}
          label="Marge brute"
          value={formatCurrency(dashboardStats.grossMargin)}
          trend="61,5% du CA"
          tone="green"
        />
        <StatCard
          icon={Banknote}
          label="Résultat net"
          value={formatCurrency(dashboardStats.netResult)}
          trend="Marge 31%"
          tone="green"
        />
        <StatCard
          icon={WalletCards}
          label="Solde caisse"
          value={formatCurrency(dashboardStats.cashBalance)}
          detail="Disponible estimé"
          tone="blue"
        />
        <StatCard
          icon={Boxes}
          label="Valeur stock"
          value={formatCurrency(dashboardStats.stockValue)}
          detail="Inventaire TTC"
          tone="green"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SalesEvolutionChart />
        <MarginDonutChart />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
        <FinanceBarsChart />
        <ProductRanking />
        <TopClientsPanel />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          icon={FileWarning}
          label="Factures en retard"
          value={dashboardStats.overdueInvoices.toString()}
          detail="Relances à envoyer"
          tone="red"
        />
        <StatCard
          icon={TriangleAlert}
          label="Stock critique"
          value={dashboardStats.criticalStock.toString()}
          detail="Produits à réapprovisionner"
          tone="orange"
        />
      </div>
    </div>
  );
}
