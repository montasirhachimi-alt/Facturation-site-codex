import { Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export function CustomerEmptyState({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="Aucun client trouvé"
      description="Aucun client ne correspond aux critères sélectionnés. Ajustez la recherche ou ajoutez un nouveau client."
      action={
        canCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-hicotech-blue/20"
          >
            <Plus size={18} />
            Ajouter client
          </button>
        ) : null
      }
    />
  );
}

