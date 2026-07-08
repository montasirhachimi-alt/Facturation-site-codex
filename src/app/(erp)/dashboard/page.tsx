import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  ContactRound,
  FileText,
  HandCoins,
  Receipt,
  Sparkles,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardWorkspaceBridge } from "@/components/dashboard-workspace-bridge";
import { dashboardStats } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { MetricCard, ProductActionCard, ProductHero, ProductSectionHeader, SectionCard } from "@/ui";

const quickActions: QuickActionCardProps[] = [
  {
    icon: ContactRound,
    label: "Nouveau client",
    description: "Créer ou retrouver une relation client.",
    href: "/clients"
  },
  {
    icon: FileText,
    label: "Nouveau devis",
    description: "Préparer une proposition commerciale.",
    href: "/sales/quotes"
  },
  {
    icon: Receipt,
    label: "Nouvelle facture",
    description: "Suivre les factures commerciales.",
    href: "/sales/invoices"
  },
  {
    icon: WalletCards,
    label: "Nouveau paiement",
    description: "Consulter les encaissements clients.",
    href: "/sales/payments"
  },
  {
    icon: HandCoins,
    label: "Nouvelle opportunité",
    description: "Ouvrir le pipeline commercial.",
    href: "/crm/opportunities"
  }
];

const priorities: PriorityItem[] = [
  {
    icon: Receipt,
    title: "Factures en attente",
    value: `${dashboardStats.overdueInvoices} factures`,
    helper: "À relancer en priorité",
    href: "/sales/invoices"
  },
  {
    icon: WalletCards,
    title: "Paiements reçus aujourd'hui",
    value: "4 paiements",
    helper: "Encaissements à rapprocher",
    href: "/sales/payments"
  },
  {
    icon: FileText,
    title: "Devis à envoyer",
    value: "5 devis",
    helper: "Propositions à finaliser",
    href: "/sales/quotes"
  },
  {
    icon: CalendarCheck,
    title: "Réunions",
    value: "3 rendez-vous",
    helper: "Échanges clients à préparer",
    href: "/crm"
  },
  {
    icon: CheckCircle2,
    title: "Tâches prioritaires",
    value: "3 tâches",
    helper: "Actions commerciales du jour",
    href: "/crm"
  }
];

const recentActivity = [
  {
    title: "Facture FAC-2026-002 partiellement payée",
    description: "Acompte enregistré pour Al Hikma Clinic.",
    time: "Aujourd'hui, 14:00"
  },
  {
    title: "Devis DEV-2026-036 accepté",
    description: "Maintenance annuelle prête pour facturation.",
    time: "Hier, 13:00"
  },
  {
    title: "Nouvelle opportunité ouverte",
    description: "Renouvellement Al Hikma ajouté au pipeline.",
    time: "Cette semaine"
  },
  {
    title: "Réunion commerciale confirmée",
    description: "Point de suivi avec le contact principal.",
    time: "Cette semaine"
  }
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const userFirstName = user?.name.split(" ")[0] ?? "Administrateur";

  return (
    <DashboardWorkspaceBridge>
      <div className="space-y-6">
        <ProductHero
          eyebrow="Tableau de bord"
          icon={Sparkles}
          title={`Bonjour ${userFirstName}`}
          subtitle="Voici ce qui mérite votre attention aujourd'hui : revenu, encaissements, propositions et actions commerciales à traiter."
          actions={[
            { href: "/sales/quotes", icon: FileText, label: "Créer un devis" },
            { href: "/crm", icon: HandCoins, label: "Ouvrir le CRM", tone: "secondary" }
          ]}
          insight={
            <div className="rounded-[1.75rem] border border-white/10 bg-white p-5 text-hicotech-navy shadow-2xl shadow-black/20">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">Espace actif</p>
              <h2 className="mt-2 font-display text-2xl font-bold">BOSIACO Business OS</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Une lecture courte pour savoir ce qui s&apos;est passé, ce qui réclame votre attention et quoi faire ensuite.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <HeroInsight label="Reste à encaisser" value={formatCurrency(dashboardStats.outstanding)} />
                <HeroInsight label="Pipeline" value="9 opportunités" />
              </div>
            </div>
          }
        />

        <section className="space-y-3">
          <ProductSectionHeader icon={Sparkles} title="Actions rapides" description="Les chemins les plus utiles pour démarrer sans chercher dans les menus." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {quickActions.map((action) => (
              <ProductActionCard key={action.label} {...action} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <ProductSectionHeader icon={BadgeDollarSign} title="Vue d'ensemble business" description="Les indicateurs essentiels, sans bruit inutile." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={BadgeDollarSign} label="Chiffre d'affaires" value={formatCurrency(dashboardStats.revenue)} helper="+12,5% ce mois" />
            <MetricCard icon={WalletCards} label="Reste à encaisser" value={formatCurrency(dashboardStats.outstanding)} helper="Factures ouvertes" />
            <MetricCard icon={HandCoins} label="Marge brute" value={formatCurrency(dashboardStats.grossMargin)} helper="61,5% du CA" />
            <MetricCard icon={ClipboardList} label="Pipeline actif" value="9 opportunités" helper="À suivre cette semaine" />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <SectionCard className="overflow-hidden">
            <div className="border-b border-slate-200/80 px-5 py-4 dark:border-hicotech-dark-border">
              <ProductSectionHeader title="Priorités du jour" description="Ce que l'utilisateur doit traiter ensuite." />
            </div>
            <div className="divide-y divide-slate-100 dark:divide-hicotech-dark-border">
              {priorities.map((priority) => (
                <PriorityRow key={priority.title} {...priority} />
              ))}
            </div>
          </SectionCard>

          <SectionCard className="p-5">
            <ProductSectionHeader title="Activité récente" description="Un fil compact pour comprendre ce qui vient de se passer." />
            <div className="mt-5 space-y-4">
              {recentActivity.map((activity, index) => (
                <TimelineItem key={activity.title} last={index === recentActivity.length - 1} {...activity} />
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardWorkspaceBridge>
  );
}

type QuickActionCardProps = {
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
};

function HeroInsight({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl bg-hicotech-sky p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-hicotech-blue">{label}</p>
      <p className="mt-2 font-display text-xl font-bold text-hicotech-navy">{value}</p>
    </article>
  );
}

type PriorityItem = {
  helper: string;
  href: string;
  icon: LucideIcon;
  title: string;
  value: string;
};

function PriorityRow({ helper, href, icon: Icon, title, value }: PriorityItem) {
  return (
    <Link href={href} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-hicotech-dark-page/60">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-50 text-hicotech-blue ring-1 ring-slate-100 dark:bg-white/10 dark:ring-white/10">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-bold text-hicotech-navy dark:text-white">{title}</span>
        <span className="mt-1 block text-sm text-slate-500 dark:text-slate-300">{helper}</span>
      </span>
      <span className="text-right">
        <span className="block font-display text-sm font-bold text-hicotech-navy dark:text-white">{value}</span>
        <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-hicotech-blue">
          Ouvrir
          <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

function TimelineItem({ description, last, time, title }: { description: string; last: boolean; time: string; title: string }) {
  return (
    <div className="relative flex gap-3">
      {!last && <span className="absolute left-4 top-9 h-[calc(100%-1rem)] w-px bg-slate-200 dark:bg-hicotech-dark-border" />}
      <span className="z-10 mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-hicotech-blue text-white">
        <CheckCircle2 size={15} />
      </span>
      <div>
        <p className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{title}</p>
        <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-300">{description}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{time}</p>
      </div>
    </div>
  );
}
