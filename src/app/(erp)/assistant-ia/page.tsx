import { Bot, MessageSquareText } from "lucide-react";
import { SectionHeader } from "@/components/section-header";

export default function AssistantIaPage() {
  const prompts = [
    "Quel est mon chiffre d'affaires ce mois-ci ?",
    "Quels clients n'ont pas payé ?",
    "Quels produits sont en stock critique ?",
    "Quelle est ma marge brute ?"
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Assistant IA"
        title="Analyse métier préparée"
        description="Espace prévu pour interroger plus tard les données isolées de chaque entreprise."
      />
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-hicotech-sky p-3 text-hicotech-blue">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-hicotech-navy dark:text-white">
              Questions rapides
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Les connecteurs IA pourront utiliser le contexte entreprise et les droits utilisateur.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-hicotech-navy transition hover:border-hicotech-blue hover:bg-hicotech-sky dark:border-white/10 dark:text-white dark:hover:bg-white/10"
            >
              <MessageSquareText size={18} />
              {prompt}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
