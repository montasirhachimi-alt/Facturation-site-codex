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
  signals,
  subtitle,
  title
}: {
  actions?: readonly ProductHeroAction[];
  eyebrow: string;
  icon: LucideIcon;
  insight?: React.ReactNode;
  signals?: readonly ProductHeroSignal[];
  subtitle: string;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-hicotech-navy text-white shadow-[0_30px_90px_rgba(10,30,63,0.28)] dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <div className="p-6 sm:p-9">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-50">
            <Icon size={14} />
            {eyebrow}
          </p>
          <h1 className="mt-7 max-w-4xl font-display text-5xl font-bold leading-[1.02] md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-cyan-50/75">{subtitle}</p>
          {actions && actions.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {actions.map((action) => (
                <ProductHeroActionButton key={action.label} action={action} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/10 bg-white/[0.06] p-6 xl:border-l xl:border-t-0">
          {insight ?? (
            <div className="grid gap-3 sm:grid-cols-2">
              {(signals ?? []).map((signal) => (
                <ProductHeroSignalCard key={signal.label} {...signal} />
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

function ProductHeroSignalCard({ helper, label, value }: ProductHeroSignal) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-lg shadow-black/10">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-50/60">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-cyan-50/65">{helper}</p>
    </article>
  );
}
