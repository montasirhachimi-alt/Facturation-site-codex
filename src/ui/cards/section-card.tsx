export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[1.4rem] border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(10,30,63,0.08)] shadow-slate-200/70 transition duration-200 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card dark:shadow-none ${className}`}>
      {children}
    </section>
  );
}
