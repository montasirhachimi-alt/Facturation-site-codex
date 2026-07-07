export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60 transition duration-200 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none ${className}`}>
      {children}
    </section>
  );
}
