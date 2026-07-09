export function EntityFilterPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid flex-1 gap-2.5 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_repeat(3,minmax(140px,170px))]">
      {children}
    </div>
  );
}
