export function EntityFilterPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_repeat(3,160px)]">
      {children}
    </div>
  );
}

