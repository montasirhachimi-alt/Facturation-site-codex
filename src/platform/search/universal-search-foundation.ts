import { Building2, Clock3, FileText, LayoutDashboard, LifeBuoy, Receipt, Search, Sparkles } from "lucide-react";
import type { UniversalSearchSection } from "./universal-search.types";

export function getFoundationSearchSections(): readonly UniversalSearchSection[] {
  return [
    {
      id: "recent",
      title: "Recent",
      description: "Vos derniers accès apparaîtront ici.",
      emptyTitle: "Aucune recherche récente",
      emptyDescription: "Les éléments ouverts depuis la recherche seront proposés dans cette section.",
      items: [
        {
          id: "recent-dashboard",
          title: "Tableau de bord",
          description: "Revenir au cockpit business.",
          eyebrow: "Récent",
          icon: LayoutDashboard
        },
        {
          id: "recent-crm",
          title: "Centre de relation client",
          description: "Retrouver sociétés, contacts et activités.",
          eyebrow: "Récent",
          icon: Building2
        }
      ]
    },
    {
      id: "suggestions",
      title: "Suggestions",
      description: "Raccourcis préparés pour les actions fréquentes.",
      emptyTitle: "Aucune suggestion",
      emptyDescription: "Les suggestions seront alimentées par les futurs providers de recherche.",
      items: [
        {
          id: "suggestion-new-quote",
          title: "Nouveau devis",
          description: "Préparer une proposition commerciale.",
          eyebrow: "Action",
          icon: FileText
        },
        {
          id: "suggestion-payment",
          title: "Nouveau paiement",
          description: "Accéder au suivi des encaissements.",
          eyebrow: "Action",
          icon: Receipt
        },
        {
          id: "suggestion-help",
          title: "Besoin d'aide",
          description: "Retrouver les futurs guides et raccourcis d'assistance.",
          eyebrow: "Aide",
          icon: LifeBuoy
        }
      ]
    },
    {
      id: "navigation",
      title: "Navigation",
      description: "Points d'entrée majeurs de l'application.",
      emptyTitle: "Aucune destination",
      emptyDescription: "La navigation globale sera connectée lors d'un prochain sprint.",
      items: [
        {
          id: "nav-dashboard",
          title: "Dashboard",
          description: "Commencer par les priorités du jour.",
          eyebrow: "Accueil",
          icon: Clock3
        },
        {
          id: "nav-search",
          title: "Recherche globale",
          description: "Fondation prête pour les futurs providers.",
          eyebrow: "Système",
          icon: Search
        },
        {
          id: "nav-assistant-ready",
          title: "Assistant IA",
          description: "Préparation de l'entrée unifiée, sans fonctionnalité IA.",
          eyebrow: "Préparation",
          icon: Sparkles
        }
      ]
    }
  ];
}
