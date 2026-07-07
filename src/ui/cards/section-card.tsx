export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40 transition-colors dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none ${className}`}>
      {children}
    </section>
  );
}
