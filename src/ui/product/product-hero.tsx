import type { LucideIcon } from "lucide-react";

type ProductHeroAction = Readonly<{
  href: string;
  icon?: LucideIcon;
  label: string;
  tone?: "primary" | "secondary";
}>;

type ProductHeroSignal = Readonly<{
  helper: string;
  label: string;
  value: string;
}>;

export function ProductHero({
  actions,
  eyebrow,
  icon: Icon,
  insight,
  personality = "default",
  signals,
  subtitle,
  title
}: {
  actions?: readonly ProductHeroAction[];
  eyebrow: string;
  icon: LucideIcon;
  insight?: React.ReactNode;
  personality?: "default" | "dashboard" | "crm" | "sales" | "hr" | "reports";
  signals?: readonly ProductHeroSignal[];
  subtitle: string;
  title: string;
}) {
  const style = heroStyles[personality];

  return (
    <section className={`overflow-hidden rounded-[2rem] border border-slate-200 ${style.surface} text-white shadow-[0_30px_90px_rgba(10,30,63,0.28)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none`}>
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <div className="relative p-6 sm:p-9">
          <span className={`absolute right-8 top-8 hidden h-24 w-24 rounded-full ${style.glow} blur-2xl sm:block`} />
          <p className={`relative inline-flex items-center gap-2 rounded-full border border-white/10 ${style.badge} px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-50`}>
            <Icon size={14} />
            {eyebrow}
          </p>
          <h1 className="relative mt-7 max-w-4xl font-display text-5xl font-bold leading-[1.02] md:text-6xl">{title}</h1>
          <p className="relative mt-5 max-w-2xl text-lg leading-8 text-cyan-50/75">{subtitle}</p>
          {actions && actions.length > 0 ? (
            <div className="relative mt-8 flex flex-wrap gap-3">
              {actions.map((action) => (
                <ProductHeroActionButton key={action.label} action={action} />
              ))}
            </div>
          ) : null}
        </div>

        <div className={`border-t border-white/10 ${style.side} p-6 xl:border-l xl:border-t-0`}>
          {insight ?? (
            <div className="grid gap-3 sm:grid-cols-2">
              {(signals ?? []).map((signal) => (
                <ProductHeroSignalCard key={signal.label} {...signal} signalClassName={style.signal} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProductHeroActionButton({ action }: { action: ProductHeroAction }) {
  const Icon = action.icon;
  const className =
    action.tone === "secondary"
      ? "inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/20"
      : "inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-hicotech-navy shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-cyan-50 focus:outline-none focus:ring-4 focus:ring-white/30";

  const content = (
    <>
      {action.label}
      {Icon ? <Icon size={16} /> : null}
    </>
  );

  return (
    <a href={action.href} className={className}>
      {content}
    </a>
  );
}

const heroStyles = {
  default: {
    badge: "bg-white/10",
    glow: "bg-white/10",
    side: "bg-white/[0.06]",
    signal: "bg-white/10",
    surface: "bg-hicotech-navy"
  },
  dashboard: {
    badge: "bg-white/10",
    glow: "bg-cyan-300/20",
    side: "bg-white/[0.07]",
    signal: "bg-white/10",
    surface: "bg-hicotech-navy"
  },
  crm: {
    badge: "bg-sky-300/15",
    glow: "bg-sky-300/25",
    side: "bg-sky-300/[0.08]",
    signal: "bg-sky-300/10",
    surface: "bg-hicotech-navy"
  },
  sales: {
    badge: "bg-emerald-300/15",
    glow: "bg-emerald-300/25",
    side: "bg-emerald-300/[0.08]",
    signal: "bg-emerald-300/10",
    surface: "bg-hicotech-navy"
  },
  hr: {
    badge: "bg-violet-300/15",
    glow: "bg-violet-300/25",
    side: "bg-violet-300/[0.08]",
    signal: "bg-violet-300/10",
    surface: "bg-hicotech-navy"
  },
  reports: {
    badge: "bg-amber-300/15",
    glow: "bg-amber-300/25",
    side: "bg-amber-300/[0.08]",
    signal: "bg-amber-300/10",
    surface: "bg-hicotech-navy"
  }
};

function ProductHeroSignalCard({ helper, label, signalClassName, value }: ProductHeroSignal & { signalClassName: string }) {
  return (
    <article className={`rounded-2xl border border-white/10 ${signalClassName} p-4 shadow-lg shadow-black/10`}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-50/60">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-cyan-50/65">{helper}</p>
    </article>
  );
}
