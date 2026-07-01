import {
  Brain,
  Package,
  TrendingUp,
  Wallet
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type InsightAccent = "blue" | "green" | "orange" | "purple";

type SmartInsight = {
  icon: LucideIcon;
  title: string;
  message: string;
  badge: string;
  accent: InsightAccent;
};

const insights: SmartInsight[] = [
  {
    icon: TrendingUp,
    title: "Croissance",
    message: "Votre chiffre d'affaires augmente de 18% ce mois.",
    badge: "Positive",
    accent: "blue"
  },
  {
    icon: Wallet,
    title: "Trésorerie",
    message: "Votre trésorerie reste stable pour les 30 prochains jours.",
    badge: "Healthy",
    accent: "green"
  },
  {
    icon: Package,
    title: "Stock",
    message: "12 produits doivent être réapprovisionnés prochainement.",
    badge: "Attention",
    accent: "orange"
  },
  {
    icon: Brain,
    title: "Assistant IA",
    message: "Relancez aujourd'hui les factures impayées de plus de 30 jours.",
    badge: "Suggestion",
    accent: "purple"
  }
];

const insightAccentClasses: Record<InsightAccent, { icon: string; badge: string; border: string }> = {
  blue: {
    icon: "bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/15 dark:text-blue-100",
    badge: "bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/15 dark:text-blue-100",
    border: "hover:border-blue-300/80 dark:hover:border-blue-400/50"
  },
  green: {
    icon: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-100",
    badge: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-100",
    border: "hover:border-green-300/80 dark:hover:border-green-400/50"
  },
  orange: {
    icon: "bg-orange-50 text-hicotech-orange dark:bg-orange-500/15 dark:text-orange-100",
    badge: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-100",
    border: "hover:border-orange-300/80 dark:hover:border-orange-400/50"
  },
  purple: {
    icon: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-100",
    badge: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-100",
    border: "hover:border-violet-300/80 dark:hover:border-violet-400/50"
  }
};

export function SmartInsightsSection() {
  return (
    <section className="space-y-4" aria-labelledby="smart-insights-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">
            Smart Insights
          </p>
          <h2 id="smart-insights-title" className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white">
            Insights intelligents
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">
          Les informations importantes générées à partir de votre activité.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight, index) => (
          <InsightCard key={insight.title} insight={insight} index={index} />
        ))}
      </div>
    </section>
  );
}

function InsightCard({ insight, index }: { insight: SmartInsight; index: number }) {
  const classes = insightAccentClasses[insight.accent];
  const Icon = insight.icon;

  return (
    <article
      tabIndex={0}
      aria-label={`${insight.title}: ${insight.message}`}
      className={`group min-h-40 cursor-pointer rounded-xl border border-slate-200/90 bg-white p-5 outline-none shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:shadow-soft focus-visible:ring-2 focus-visible:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none ${classes.border}`}
      style={{ animation: "insight-card-in 300ms ease-out both", animationDelay: `${index * 150}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`grid size-12 shrink-0 place-items-center rounded-lg ${classes.icon}`}>
          <Icon size={22} aria-hidden="true" />
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${classes.badge}`}>
          {insight.badge}
        </span>
      </div>

      <h3 className="mt-4 font-display text-base font-bold text-hicotech-navy dark:text-white">
        {insight.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {insight.message}
      </p>
    </article>
  );
}
