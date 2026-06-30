import type { CoreModuleId } from "@/core/registry";
import type { ModuleSearchResult } from "@/core/search";
import { SearchService } from "./SearchService";

export type HeaderSearchResult = ModuleSearchResult;

const headerSearchLabels: Partial<Record<CoreModuleId, string>> = {
  dashboard: "Dashboard",
  clients: "Clients",
  suppliers: "Fournisseurs",
  products: "Produits & stock",
  documents: "Documents",
  quotes: "Devis",
  invoices: "Factures",
  delivery_notes: "Bons de livraison",
  purchases: "Achats",
  cash: "Caisse",
  payments: "Suivi paiements",
  employees: "Employés",
  contracts: "Contrats",
  attendance: "Présences",
  absences: "Absences",
  leaves: "Congés",
  payroll: "Salaires",
  advances: "Avances",
  hr_documents: "Documents RH",
  statistics: "Statistiques",
  reports: "Rapports",
  pdf: "Documents PDF",
  ai_assistant: "Assistant IA",
  settings: "Paramètres",
  users: "Utilisateurs"
};

const headerSearchKeywords: Partial<Record<CoreModuleId, string[]>> = {
  invoices: ["fac", "facture", "factures"],
  quotes: ["devis", "proposition"],
  payments: ["paiement", "paiements", "encaissement", "fac"],
  purchases: ["achat", "achats", "facture achat", "fac"],
  products: ["produit", "produits", "stock"],
  clients: ["client", "clients", "crm"],
  ai_assistant: ["assistant ia", "ia", "ai"]
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getKeywordBoost(moduleId: CoreModuleId, query: string) {
  if (!query) return 0;
  const normalizedQuery = normalize(query);
  const keywords = headerSearchKeywords[moduleId] ?? [];

  return keywords.some((keyword) => normalize(keyword).includes(normalizedQuery)) ? 25 : 0;
}

export function getHeaderSearchResults(query: string, limit = 8, searchService = new SearchService()): HeaderSearchResult[] {
  return searchService
    .getSearchResults(query, 100)
    .map((result) => ({
      ...result,
      title: headerSearchLabels[result.module.id] ?? result.title,
      score: result.score + getKeywordBoost(result.module.id, query)
    }))
    .sort((first, second) => second.score - first.score || first.title.localeCompare(second.title))
    .slice(0, limit);
}

export function getHeaderSearchResultByRoute(route: string, searchService = new SearchService()) {
  return getHeaderSearchResults("", 100, searchService).find((result) => result.route === route);
}
