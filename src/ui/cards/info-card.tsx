export function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-hicotech-sky px-4 py-3 text-sm font-bold text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
      {children}
    </div>
  );
}

