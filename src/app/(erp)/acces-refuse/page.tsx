import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <section className="max-w-lg rounded-lg border border-slate-200 bg-white p-8 text-center shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="mx-auto grid size-14 place-items-center rounded-lg bg-red-50 text-hicotech-red dark:bg-red-950/30">
          <ShieldAlert size={28} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-hicotech-navy dark:text-white">Accès refusé</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">
          Votre rôle ne dispose pas de la permission nécessaire pour consulter ce module.
        </p>
        <Link href="/dashboard" className="mt-6 inline-flex rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white">
          Retour au tableau de bord
        </Link>
      </section>
    </div>
  );
}
