import Link from "next/link";
import {
  Bot,
  PackageOpen,
  ReceiptText,
  TrendingUp,
  Wallet,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type HealthAccent = "green" | "blue" | "orange" | "red" | "emerald" | "purple";

type BusinessHealthCard = {
  icon: LucideIcon;
  title: string;
  badge: string;
  value: string;
  subtitle: string;
  footer: string;
  href?: string;
  accent: HealthAccent;
};

const healthCards: BusinessHealthCard[] = [
  {
    icon: Wallet,
    title: "Cash Flow",
    badge: "Healthy",
    value: "64 280 MAD",
    subtitle: "Disponible",
    footer: "Stable cette semaine",
    accent: "green"
  },
  {
    icon: TrendingUp,
    title: "Sales",
    badge: "Excellent",
    value: "+18%",
    subtitle: "Croissance mensuelle",
    footer: "Objectif atteint",
    accent: "blue"
  },
  {
    icon: PackageOpen,
    title: "Stock",
    badge: "Attention",
    value: "12 produits",
    subtitle: "À réapprovisionner",
    footer: "Voir Produits",
    href: "/stock",
    accent: "orange"
  },
  {
    icon: ReceiptText,
    title: "Payments",
    badge: "Critical",
    value: "8 factures",
    subtitle: "En retard",
    footer: "Relancer",
    href: "/factures",
    accent: "red"
  },
  {
    icon: WalletCards,
    title: "Profitability",
    badge: "Good",
    value: "31%",
    subtitle: "Marge nette",
    footer: "Supérieure au mois dernier",
    accent: "emerald"
  },
  {
    icon: Bot,
    title: "AI Assistant",
    badge: "Ready",
    value: "2 recommandations",
    subtitle: "Disponibles",
    footer: "Ouvrir Assistant IA",
    href: "/assistant-ia",
    accent: "purple"
  }
];

const accentClasses: Record<HealthAccent, { icon: string; badge: string; border: string; footer: string }> = {
  green: {
    icon: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-100",
    badge: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-100",
    border: "hover:border-green-300/80 dark:hover:border-green-400/50",
    footer: "text-green-700 dark:text-green-100"
  },
  blue: {
    icon: "bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/15 dark:text-blue-100",
    badge: "bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/15 dark:text-blue-100",
    border: "hover:border-blue-300/80 dark:hover:border-blue-400/50",
    footer: "text-hicotech-blue dark:text-blue-100"
  },
  orange: {
    icon: "bg-orange-50 text-hicotech-orange dark:bg-orange-500/15 dark:text-orange-100",
    badge: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-100",
    border: "hover:border-orange-300/80 dark:hover:border-orange-400/50",
    footer: "text-hicotech-orange dark:text-orange-100"
  },
  red: {
    icon: "bg-red-50 text-hicotech-red dark:bg-red-500/15 dark:text-red-100",
    badge: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-100",
    border: "hover:border-red-300/80 dark:hover:border-red-400/50",
    footer: "text-hicotech-red dark:text-red-100"
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-100",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-100",
    border: "hover:border-emerald-300/80 dark:hover:border-emerald-400/50",
    footer: "text-emerald-700 dark:text-emerald-100"
  },
  purple: {
    icon: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-100",
    badge: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-100",
    border: "hover:border-violet-300/80 dark:hover:border-violet-400/50",
    footer: "text-violet-700 dark:text-violet-100"
  }
};

export function BusinessHealthSection() {
  return (
    <section className="space-y-4" aria-labelledby="business-health-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">
            Business Health
          </p>
          <h2 id="business-health-title" className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white">
            Santé de l&apos;entreprise
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">
          Vue synthétique de votre activité.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {healthCards.map((card, index) => (
          <HealthCard key={card.title} card={card} index={index} />
        ))}
      </div>
    </section>
  );
}

function HealthCard({ card, index }: { card: BusinessHealthCard; index: number }) {
  const classes = accentClasses[card.accent];
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span className={`grid size-11 shrink-0 place-items-center rounded-lg ${classes.icon}`}>
          <card.icon size={20} aria-hidden="true" />
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${classes.badge}`}>
          {card.badge}
        </span>
      </div>

      <div className="mt-5">
        <h3 className="font-display text-base font-bold text-hicotech-navy dark:text-white">
          {card.title}
        </h3>
        <p className="mt-3 font-display text-3xl font-bold tracking-normal text-hicotech-navy dark:text-white">
          {card.value}
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
          {card.subtitle}
        </p>
      </div>

      <p className={`mt-5 text-sm font-bold ${classes.footer}`}>
        {card.footer}
      </p>
    </>
  );

  const className = `group block min-h-52 rounded-lg border border-slate-200 bg-white p-5 shadow-soft outline-none transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card ${classes.border}`;
  const style = { animation: "health-card-in 320ms ease-out both", animationDelay: `${index * 150}ms` };

  if (card.href) {
    return (
      <Link href={card.href} className={className} style={style} aria-label={`${card.title}: ${card.footer}`}>
        {content}
      </Link>
    );
  }

  return (
    <article className={`${className} cursor-pointer`} style={style} tabIndex={0} aria-label={`${card.title}: ${card.value}`}>
      {content}
    </article>
  );
}
