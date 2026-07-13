import {
  BriefcaseBusiness,
  Building2,
  ContactRound,
  HandCoins,
  PackageCheck,
  Plus,
  Receipt
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { bosiacoModuleRegistry, getCurrentAlphaActivation } from "@/platform/modules";
import type { ModuleActivationResult } from "@/platform/modules";
import type { UniversalSearchItem, UniversalSearchSection } from "./universal-search.types";

export type QuickCreateActionId =
  | "quick-create.company"
  | "quick-create.contact"
  | "quick-create.quote"
  | "quick-create.invoice"
  | "quick-create.supplier"
  | "quick-create.purchase-order"
  | "quick-create.goods-receipt";

export type QuickCreateAction = Readonly<{
  id: QuickCreateActionId;
  title: string;
  description: string;
  icon: LucideIcon;
  keywords: readonly string[];
}>;

const quickCreateActionIds = new Set<string>([
  "quick-create.company",
  "quick-create.contact",
  "quick-create.quote",
  "quick-create.invoice",
  "quick-create.supplier",
  "quick-create.purchase-order",
  "quick-create.goods-receipt"
]);

const seedQuickCreateActions: readonly QuickCreateAction[] = [
  {
    id: "quick-create.company",
    title: "Nouvelle société",
    description: "Créer une société depuis le centre de commandes.",
    icon: Building2,
    keywords: ["new", "create", "nouveau", "nouvelle", "société", "societe", "company", "entreprise", "compte"]
  },
  {
    id: "quick-create.contact",
    title: "Nouveau contact",
    description: "Ajouter une personne clé sans ouvrir d'abord le CRM.",
    icon: ContactRound,
    keywords: ["new", "create", "nouveau", "contact", "personne", "interlocuteur", "cont"]
  },
  {
    id: "quick-create.quote",
    title: "Nouveau devis",
    description: "Ouvrir le flux de création d'un devis.",
    icon: BriefcaseBusiness,
    keywords: ["new", "create", "nouveau", "devis", "quote", "quo", "proposition"]
  },
  {
    id: "quick-create.invoice",
    title: "Nouvelle facture",
    description: "Préparer une facture depuis le centre de commandes.",
    icon: Receipt,
    keywords: ["new", "create", "nouveau", "facture", "invoice", "inv", "billing", "fact"]
  },
  {
    id: "quick-create.supplier",
    title: "Nouveau fournisseur",
    description: "Créer un fournisseur dans Procurement.",
    icon: Building2,
    keywords: ["new", "create", "nouveau", "fournisseur", "supplier", "vendor"]
  },
  {
    id: "quick-create.purchase-order",
    title: "Nouvelle commande fournisseur",
    description: "Créer une commande fournisseur.",
    icon: HandCoins,
    keywords: ["new", "create", "nouveau", "achat", "commande fournisseur", "purchase order", "po"]
  },
  {
    id: "quick-create.goods-receipt",
    title: "Nouvelle réception",
    description: "Réceptionner une commande fournisseur vers le stock.",
    icon: PackageCheck,
    keywords: ["new", "create", "nouveau", "réception", "reception", "goods receipt", "bon de réception", "stock"]
  }
];

export class ActionRegistry {
  private readonly actions = new Map<QuickCreateActionId, QuickCreateAction>();

  register(action: QuickCreateAction) {
    this.actions.set(action.id, action);
    return this;
  }

  registerMany(actions: readonly QuickCreateAction[]) {
    actions.forEach((action) => this.register(action));
    return this;
  }

  getAll() {
    return Array.from(this.actions.values());
  }

  search(query: string) {
    const normalizedQuery = normalizeActionText(query);
    const actions = this.getAll();

    if (!normalizedQuery) return actions;

    return actions
      .map((action) => ({
        action,
        score: scoreAction(action, normalizedQuery)
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.action.title.localeCompare(b.action.title, "en"))
      .map((result) => result.action);
  }
}

export function createActionRegistry() {
  return new ActionRegistry().registerMany(seedQuickCreateActions);
}

export function getQuickCreateSection(query: string, activation: ModuleActivationResult = getCurrentAlphaActivation()): UniversalSearchSection {
  const activeActionIds = getActiveQuickCreateActionIds(activation);
  const items = createActionRegistry().search(query).filter((action) => activeActionIds.has(action.id)).map(actionToSearchItem);

  return {
    id: "quick-create",
    title: "Créer",
    description: query ? "Créer immédiatement depuis le centre de commandes." : "Actions de création prêtes à lancer.",
    emptyTitle: "Aucune action de création",
    emptyDescription: "Essayez nouveau, société, contact, devis ou facture.",
    items
  };
}

export function isQuickCreateActionId(value: string | undefined): value is QuickCreateActionId {
  return Boolean(value && quickCreateActionIds.has(value));
}

function actionToSearchItem(action: QuickCreateAction): UniversalSearchItem {
  return {
    id: action.id,
    title: action.title,
    description: action.description,
    actionId: action.id,
    badge: "Création rapide",
    eyebrow: "Créer",
    icon: action.icon ?? Plus,
    keywords: action.keywords,
    tone: "create"
  };
}

function scoreAction(action: QuickCreateAction, normalizedQuery: string) {
  const values = [action.title, action.description, action.id, ...action.keywords].map(normalizeActionText);
  let bestScore = 0;

  for (const value of values) {
    if (!value) continue;
    if (value === normalizedQuery) bestScore = Math.max(bestScore, 140);
    if (value.startsWith(normalizedQuery)) bestScore = Math.max(bestScore, 110);
    if (value.includes(normalizedQuery)) bestScore = Math.max(bestScore, 80);

    const words = value.split(" ");
    if (words.some((word) => word.startsWith(normalizedQuery))) {
      bestScore = Math.max(bestScore, 100);
    }
  }

  return bestScore;
}

function normalizeActionText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getActiveQuickCreateActionIds(activation: ModuleActivationResult) {
  const ids = new Set<QuickCreateActionId>();
  for (const descriptor of bosiacoModuleRegistry.list()) {
    if (!activation.activeModuleIdSet.has(descriptor.id)) continue;
    descriptor.commandCenter?.quickCreateKeys?.forEach((id) => {
      if (isQuickCreateActionId(id)) ids.add(id);
    });
  }
  return ids;
}
