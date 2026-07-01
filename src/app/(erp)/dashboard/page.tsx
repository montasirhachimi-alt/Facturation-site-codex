import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BadgeDollarSign,
  Banknote,
  Boxes,
  Bot,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  ClipboardList,
  ContactRound,
  FileWarning,
  HandCoins,
  PackagePlus,
  Plus,
  Receipt,
  TriangleAlert,
  ReceiptText,
  TrendingUp,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BusinessHealthSection } from "@/components/business-health-section";
import { DashboardWorkspaceBridge } from "@/components/dashboard-workspace-bridge";
import { ExecutiveWorkspaceSection } from "@/components/executive-workspace-section";
import { SmartInsightsSection } from "@/components/smart-insights-section";
import { StatCard } from "@/components/stat-card";
import { ProductRanking } from "@/components/product-ranking";
import { FinanceBarsChart, MarginDonutChart, SalesEvolutionChart, TopClientsPanel } from "@/components/dashboard-widgets";
import { dashboardStats } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const userFirstName = user?.name.split(" ")[0] ?? "Administrateur";
  const syncTime = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
  const quickActions: QuickActionCardProps[] = [
    {
      icon: Receipt,
      label: "Nouvelle facture",
      description: "Créer ou consulter les factures",
      href: "/factures",
      tone: "blue"
    },
    {
      icon: ClipboardList,
      label: "Nouveau devis",
      description: "Préparer une proposition client",
      href: "/devis",
      tone: "green"
    },
    {
      icon: ContactRound,
      label: "Nouveau client",
      description: "Ouvrir le module clients",
      href: "/clients",
      tone: "purple"
    },
    {
      icon: PackagePlus,
      label: "Nouveau produit",
      description: "Gérer le catalogue et le stock",
      href: "/stock",
      tone: "orange"
    },
    {
      icon: WalletCards,
      label: "Encaisser",
      description: "Accéder à la caisse",
      href: "/caisse",
      tone: "blue"
    },
    {
      icon: HandCoins,
      label: "Nouvel achat",
      description: "Suivre les factures d'achat",
      href: "/achats",
      tone: "red"
    }
  ];
  const priorities: PriorityCardProps[] = [
    {
      icon: FileWarning,
      title: "Factures à relancer",
      value: `${dashboardStats.overdueInvoices} factures`,
      description: "En attente de paiement",
      action: "Voir les factures",
      href: "/factures",
      tone: "red"
    },
    {
      icon: TriangleAlert,
      title: "Stock critique",
      value: `${dashboardStats.criticalStock} produits`,
      description: "À réapprovisionner",
      action: "Voir le stock",
      href: "/stock",
      tone: "orange"
    },
    {
      icon: ClipboardList,
      title: "Devis en attente",
      value: "5 devis",
      description: "À envoyer aujourd'hui",
      action: "Ouvrir les devis",
      href: "/devis",
      tone: "green"
    },
    {
      icon: WalletCards,
      title: "Paiements reçus",
      value: "4 paiements",
      description: "Aujourd'hui",
      action: "Voir la caisse",
      href: "/caisse",
      tone: "blue"
    },
    {
      icon: CheckCircle2,
      title: "Tâches importantes",
      value: "3 tâches",
      description: "À traiter aujourd'hui",
      action: "Voir les tâches",
      tone: "purple"
    },
    {
      icon: Bot,
      title: "Assistant IA",
      value: "Suggestion du jour",
      description: "Votre chiffre d'affaires augmente de 18%. Pensez à relancer les factures impayées.",
      action: "Ouvrir Assistant IA",
      href: "/assistant-ia",
      tone: "ai"
    }
  ];

  return (
    <DashboardWorkspaceBridge>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
          <div className="grid gap-6 p-6 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-hicotech-blue/15 bg-hicotech-sky px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-hicotech-blue dark:border-hicotech-blue/30 dark:bg-hicotech-blue/15 dark:text-blue-100">
                <Activity size={14} />
                Pilot Center
              </div>
              <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-hicotech-navy dark:text-white md:text-5xl">
                Bonjour, {userFirstName}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-500 dark:text-slate-300">
                Votre espace de pilotage réunit les signaux importants, les actions rapides et les priorités de la journée.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <HeroPill label="Workspace" value="HicoPilot CRM" />
                <HeroPill label="Mode" value="Executive" />
                <HeroPill label="Status" value="Synchronisé" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-hicotech-cloud p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-white text-hicotech-blue shadow-sm dark:bg-hicotech-dark-card dark:text-white">
                  <Clock3 size={18} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Dernière synchronisation
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-hicotech-navy dark:text-white">
                    Aujourd&apos;hui à {syncTime}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <WorkspaceSummaryStrip />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">
              Actions rapides
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white">
              Démarrer en un clic
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">
            Les raccourcis essentiels pour créer, encaisser et suivre l&apos;activité sans chercher dans les menus.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {quickActions.map((action) => (
            <QuickActionCard key={action.label} {...action} />
          ))}
        </div>
      </section>

      <BusinessHealthSection />

      <SmartInsightsSection />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">
              Aujourd&apos;hui
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white">
              Priorités du jour
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">
            Les points qui méritent votre attention avant de poursuivre la journée.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {priorities.map((priority) => (
            <PriorityCard key={priority.title} {...priority} />
          ))}
        </div>
      </section>

      <ExecutiveWorkspaceSection />

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
    </DashboardWorkspaceBridge>
  );
}

type PriorityTone = "red" | "orange" | "green" | "blue" | "purple" | "ai";

type QuickActionTone = "red" | "orange" | "green" | "blue" | "purple";

type QuickActionCardProps = {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
  tone: QuickActionTone;
};

const quickActionToneClasses: Record<QuickActionTone, string> = {
  red: "bg-red-50 text-hicotech-red dark:bg-red-500/15 dark:text-red-100",
  orange: "bg-orange-50 text-hicotech-orange dark:bg-orange-500/15 dark:text-orange-100",
  green: "bg-emerald-50 text-hicotech-green dark:bg-emerald-500/15 dark:text-emerald-100",
  blue: "bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/15 dark:text-blue-100",
  purple: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-100"
};

function QuickActionCard({ icon: Icon, label, description, href, tone }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-32 flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-hicotech-blue/30 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-hicotech-blue/40 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none dark:hover:border-hicotech-blue/50"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${quickActionToneClasses[tone]}`}>
          <Icon size={19} />
        </span>
        <span className="grid size-8 place-items-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-hicotech-sky group-hover:text-hicotech-blue dark:bg-hicotech-dark-page/60 dark:text-slate-300 dark:group-hover:bg-hicotech-blue/15 dark:group-hover:text-white">
          <Plus size={16} />
        </span>
      </div>
      <div className="mt-4">
        <h3 className="font-display text-base font-bold text-hicotech-navy dark:text-white">
          {label}
        </h3>
        <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-300">
          {description}
        </p>
      </div>
    </Link>
  );
}

type PriorityCardProps = {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
  action: string;
  href?: string;
  tone: PriorityTone;
};

const priorityToneClasses: Record<PriorityTone, { icon: string; ring: string; button: string }> = {
  red: {
    icon: "bg-red-50 text-hicotech-red dark:bg-red-500/15 dark:text-red-100",
    ring: "hover:border-red-200 dark:hover:border-red-400/40",
    button: "text-hicotech-red hover:bg-red-50 dark:text-red-100 dark:hover:bg-red-500/10"
  },
  orange: {
    icon: "bg-orange-50 text-hicotech-orange dark:bg-orange-500/15 dark:text-orange-100",
    ring: "hover:border-orange-200 dark:hover:border-orange-400/40",
    button: "text-hicotech-orange hover:bg-orange-50 dark:text-orange-100 dark:hover:bg-orange-500/10"
  },
  green: {
    icon: "bg-emerald-50 text-hicotech-green dark:bg-emerald-500/15 dark:text-emerald-100",
    ring: "hover:border-emerald-200 dark:hover:border-emerald-400/40",
    button: "text-hicotech-green hover:bg-emerald-50 dark:text-emerald-100 dark:hover:bg-emerald-500/10"
  },
  blue: {
    icon: "bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/15 dark:text-blue-100",
    ring: "hover:border-blue-200 dark:hover:border-blue-400/40",
    button: "text-hicotech-blue hover:bg-hicotech-sky dark:text-blue-100 dark:hover:bg-hicotech-blue/10"
  },
  purple: {
    icon: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-100",
    ring: "hover:border-violet-200 dark:hover:border-violet-400/40",
    button: "text-violet-600 hover:bg-violet-50 dark:text-violet-100 dark:hover:bg-violet-500/10"
  },
  ai: {
    icon: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-100",
    ring: "hover:border-indigo-200 dark:hover:border-indigo-400/40",
    button: "text-indigo-600 hover:bg-indigo-50 dark:text-indigo-100 dark:hover:bg-indigo-500/10"
  }
};

function PriorityCard({ icon: Icon, title, value, description, action, href, tone }: PriorityCardProps) {
  const classes = priorityToneClasses[tone];
  const actionClass = `mt-5 inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold transition ${classes.button}`;

  return (
    <article
      className={`group rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none ${classes.ring}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`grid size-11 shrink-0 place-items-center rounded-lg ${classes.icon}`}>
          <Icon size={20} />
        </span>
        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:bg-hicotech-dark-page/60 dark:text-slate-300">
          Priorité
        </span>
      </div>
      <div className="mt-5">
        <h3 className="font-display text-base font-bold text-hicotech-navy dark:text-white">
          {title}
        </h3>
        <p className="mt-3 font-display text-2xl font-bold text-hicotech-navy dark:text-white">
          {value}
        </p>
        <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500 dark:text-slate-300">
          {description}
        </p>
      </div>
      {href ? (
        <Link href={href} className={actionClass}>
          {action}
          <ArrowUpRight size={16} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      ) : (
        <button type="button" disabled className={`${actionClass} cursor-not-allowed opacity-60`}>
          {action}
          <ArrowUpRight size={16} />
        </button>
      )}
    </article>
  );
}

function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-hicotech-navy shadow-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page dark:text-white">
      <span className="text-slate-400">{label}</span>
      {value}
    </span>
  );
}

function WorkspaceSummaryStrip() {
  const items = [
    { icon: ContactRound, label: "Relations CRM", value: "Companies actives", helper: "Workspace prêt pour contacts et ventes" },
    { icon: CalendarCheck, label: "Agenda du jour", value: "3 rendez-vous", helper: "Réunion, livraison, fournisseur" },
    { icon: Bot, label: "AI Insights", value: "2 suggestions", helper: "Relances et stock à surveiller" }
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-3" aria-label="Résumé du workspace">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.label} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-200/60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/15 dark:text-blue-100">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{item.label}</p>
                <p className="mt-1 font-display text-lg font-bold text-hicotech-navy dark:text-white">{item.value}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{item.helper}</p>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
