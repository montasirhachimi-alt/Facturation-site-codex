export function EntityErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold leading-6 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
      {message}
    </section>
  );
}
