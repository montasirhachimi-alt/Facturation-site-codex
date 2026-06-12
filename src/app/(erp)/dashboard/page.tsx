import { Activity, BadgeDollarSign, Boxes, FileWarning, WalletCards } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { SalesChart } from "@/components/sales-chart";
import { ProductRanking } from "@/components/product-ranking";
import { SectionHeader } from "@/components/section-header";
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
          icon={WalletCards}
          label="Reste à encaisser"
          value={formatCurrency(dashboardStats.outstanding)}
          detail="8 factures ouvertes"
          tone="red"
        />
        <StatCard
          icon={Activity}
          label="Résultat net"
          value={formatCurrency(dashboardStats.netResult)}
          trend="Marge 31%"
          tone="green"
        />
        <StatCard
          icon={Boxes}
          label="Stock critique"
          value={dashboardStats.criticalStock.toString()}
          detail="Produits à réapprovisionner"
          tone="orange"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SalesChart />
        <ProductRanking />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={FileWarning} label="Factures en retard" value="6" detail="Relances à envoyer" tone="red" />
        <StatCard icon={BadgeDollarSign} label="Achats" value={formatCurrency(48300)} detail="Ce mois" tone="blue" />
        <StatCard icon={Boxes} label="Valeur stock TTC" value={formatCurrency(214800)} detail="Inventaire actuel" tone="green" />
      </div>
    </div>
  );
}
