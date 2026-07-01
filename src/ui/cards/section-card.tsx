export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/60 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none ${className}`}>
      {children}
    </section>
  );
}
