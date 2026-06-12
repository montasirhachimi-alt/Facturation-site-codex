import { SectionHeader } from "@/components/section-header";

const labels: Record<string, string> = {
  statistiques: "Statistiques",
  paiements: "Suivi paiements",
  devis: "Devis",
  factures: "Factures",
  livraisons: "Bons de livraison",
  achats: "Factures d'achat",
  caisse: "Journal de caisse",
  fournisseurs: "Fournisseurs",
  rapports: "Rapports",
  parametres: "Paramètres"
};

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const label = labels[module] ?? "Module";

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Module ERP"
        title={label}
        description={"Module préparé dans l'architecture. Les formulaires, règles métier et permissions seront ajoutés étape par étape."}
        action="Nouvelle entrée"
      />
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
        <div className="grid gap-4 md:grid-cols-3">
          {["Recherche et filtres", "Workflow métier", "Export Excel et PDF"].map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
              <p className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{item}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
                Bloc prévu pour respecter les droits utilisateur et l&apos;isolation par entreprise.
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
