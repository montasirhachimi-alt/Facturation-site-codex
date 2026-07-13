"use client";

import Link from "next/link";

export function ProcurementOverviewPage() {
  return (
    <main className="min-h-screen bg-hicotech-cloud px-4 py-4 dark:bg-hicotech-dark-page lg:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-hicotech-blue">Procurement</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-hicotech-navy dark:text-white">Achats fournisseurs</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">Fondation achats contrôlée pour gérer les fournisseurs et préparer les commandes fournisseur sans réception, stock ou comptabilité automatique.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/procurement/suppliers" className="rounded-xl bg-hicotech-blue px-4 py-2 text-sm font-bold text-white">Fournisseurs</Link>
          <Link href="/procurement/purchase-orders" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Commandes fournisseur</Link>
          <Link href="/procurement/goods-receipts" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Réceptions</Link>
        </div>
      </section>
    </main>
  );
}
