import { productsRanking } from "@/lib/demo-data";

export function ProductRanking() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">
          Top 5 produits vendus
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-300">Quantités facturées</p>
      </div>
      <div className="space-y-3">
        {productsRanking.map((product, index) => (
          <div key={product.name} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40">
            <span className="grid size-8 place-items-center rounded-lg bg-hicotech-sky text-sm font-bold text-hicotech-blue">
              {index + 1}
            </span>
            <span className="flex-1 text-sm font-semibold text-hicotech-navy dark:text-white">
              {product.name}
            </span>
            <span className="rounded-md bg-hicotech-sky px-2 py-1 text-sm font-bold text-hicotech-blue">
              {product.quantity}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
