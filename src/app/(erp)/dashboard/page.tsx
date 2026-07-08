import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  ContactRound,
  FileText,
  HandCoins,
  Receipt,
  Sparkles,
  TrendingUp,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardWorkspaceBridge } from "@/components/dashboard-workspace-bridge";
import { dashboardStats } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { MetricCard, ProductHero, ProductSectionHeader, SectionCard } from "@/ui";

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

const priorityLead = priorities[0];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const userFirstName = user?.name.split(" ")[0] ?? "Administrateur";

  return (
    <DashboardWorkspaceBridge>
      <div className="space-y-6">
        <ProductHero
          eyebrow="Tableau de bord"
          icon={Sparkles}
          title={`Bonjour ${userFirstName}, trois éléments méritent votre attention.`}
          subtitle={`${dashboardStats.overdueInvoices} facture(s) sont à suivre, ${formatCurrency(dashboardStats.outstanding)} restent à encaisser et le pipeline actif contient 9 opportunités.`}
          actions={[
            { href: priorityLead.href, icon: priorityLead.icon, label: "Traiter la priorité" },
            { href: "/crm/opportunities", icon: HandCoins, label: "Voir l'opportunité", tone: "secondary" }
          ]}
          insight={
            <div className="rounded-[1.75rem] border border-white/10 bg-white p-5 text-hicotech-navy shadow-2xl shadow-black/20">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">À faire en premier</p>
              <h2 className="mt-2 font-display text-2xl font-bold">{priorityLead.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {priorityLead.helper}. Cette action protège directement le cash et clarifie la journée.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <HeroInsight label={priorityLead.title} value={priorityLead.value} />
                <HeroInsight label="Reste à encaisser" value={formatCurrency(dashboardStats.outstanding)} />
              </div>
            </div>
          }
        />

        <section className="space-y-3">
          <ProductSectionHeader icon={BadgeDollarSign} title="Santé business" description="Le battement du jour : revenu, cash, marge et opportunités." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={BadgeDollarSign} label="Chiffre d'affaires" value={formatCurrency(dashboardStats.revenue)} helper="+12,5% ce mois" />
            <MetricCard icon={WalletCards} label="Reste à encaisser" value={formatCurrency(dashboardStats.outstanding)} helper="Factures ouvertes" />
            <MetricCard icon={HandCoins} label="Marge brute" value={formatCurrency(dashboardStats.grossMargin)} helper="61,5% du CA" />
            <MetricCard icon={ClipboardList} label="Pipeline actif" value="9 opportunités" helper="À suivre cette semaine" />
          </div>
        </section>

        <SectionCard className="overflow-hidden">
          <div className="grid gap-0 xl:grid-cols-[minmax(300px,0.42fr)_minmax(0,0.58fr)]">
            <div className="bg-hicotech-navy p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-50/65">Centre de priorité</p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight">Ce qui doit être traité aujourd&apos;hui.</h2>
              <p className="mt-3 text-sm leading-6 text-cyan-50/72">
                Le Dashboard commence par les décisions qui protègent le cash, les propositions et les échanges client.
              </p>
              <Link
                href={priorityLead.href}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-hicotech-navy shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-cyan-50 focus:outline-none focus:ring-4 focus:ring-white/25"
              >
                Commencer par ici
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-hicotech-dark-border">
              {priorities.map((priority, index) => (
                <PriorityRow key={priority.title} rank={index + 1} {...priority} />
              ))}
            </div>
          </div>
        </SectionCard>

        <section className="space-y-3">
          <ProductSectionHeader icon={BarChart3} title="Performance" description="La lecture business après les urgences : progression, encaissement et pipeline." />
          <div className="grid gap-4 lg:grid-cols-3">
            <PerformanceCard icon={TrendingUp} label="Progression commerciale" value="+12,5%" helper="Le chiffre d'affaires progresse ce mois-ci." />
            <PerformanceCard icon={WalletCards} label="Cash à sécuriser" value={formatCurrency(dashboardStats.outstanding)} helper="Montant ouvert à transformer en encaissement." />
            <PerformanceCard icon={HandCoins} label="Plus grande opportunité" value="9 opportunités" helper="Le pipeline reste le meilleur relais de croissance." />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
          <SectionCard className="p-5">
            <ProductSectionHeader icon={CheckCircle2} title="Changements récents" description="Les derniers mouvements business, dans l'ordre de lecture." />
            <div className="mt-5 space-y-4">
              {recentActivity.map((activity, index) => (
                <TimelineItem key={activity.title} last={index === recentActivity.length - 1} {...activity} />
              ))}
            </div>
          </SectionCard>

          <SectionCard className="p-5">
            <ProductSectionHeader icon={Sparkles} title="Actions rapides" description="Les raccourcis utiles, placés après la lecture executive." />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <CompactAction key={action.label} {...action} />
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

function PriorityRow({ helper, href, icon: Icon, rank, title, value }: PriorityItem & { rank: number }) {
  return (
    <Link href={href} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-hicotech-sky/45 dark:hover:bg-hicotech-dark-page/60">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10">
        {rank}
      </span>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-hicotech-blue shadow-sm ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
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

function PerformanceCard({ helper, icon: Icon, label, value }: { helper: string; icon: LucideIcon; label: string; value: string }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_rgba(10,30,63,0.08)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-300">{label}</p>
          <p className="mt-3 font-display text-3xl font-bold text-hicotech-navy dark:text-white">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-hicotech-navy text-white dark:bg-hicotech-blue">
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-300">{helper}</p>
    </article>
  );
}

function CompactAction({ description, href, icon: Icon, label }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 transition hover:-translate-y-0.5 hover:border-hicotech-blue/30 hover:bg-white hover:shadow-md hover:shadow-slate-200/60 focus:outline-none focus:ring-2 focus:ring-hicotech-blue/50 dark:border-hicotech-dark-border dark:bg-slate-900/30 dark:hover:bg-hicotech-dark-card"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-hicotech-blue shadow-sm ring-1 ring-slate-200 transition group-hover:bg-hicotech-blue group-hover:text-white dark:bg-white/10 dark:ring-white/10">
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-hicotech-navy dark:text-white">{label}</span>
        <span className="mt-1 block truncate text-xs font-medium text-slate-500 dark:text-slate-300">{description}</span>
      </span>
      <ArrowRight size={14} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-hicotech-blue" />
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
