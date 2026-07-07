export function EntityFilterPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(300px,1fr)_repeat(3,minmax(150px,180px))]">
      {children}
    </div>
  );
}
