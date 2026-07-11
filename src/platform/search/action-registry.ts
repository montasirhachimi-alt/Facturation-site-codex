import {
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  ContactRound,
  FileText,
  Plus,
  Receipt,
  ScrollText,
  TrendingUp,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UniversalSearchItem, UniversalSearchSection } from "./universal-search.types";

export type QuickCreateActionId =
  | "quick-create.company"
  | "quick-create.contact"
  | "quick-create.meeting"
  | "quick-create.task"
  | "quick-create.note"
  | "quick-create.opportunity"
  | "quick-create.quote"
  | "quick-create.invoice"
  | "quick-create.payment";

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
  "quick-create.meeting",
  "quick-create.task",
  "quick-create.note",
  "quick-create.opportunity",
  "quick-create.quote",
  "quick-create.invoice",
  "quick-create.payment"
]);

const seedQuickCreateActions: readonly QuickCreateAction[] = [
  {
    id: "quick-create.company",
    title: "New Company",
    description: "Créer une société depuis le centre de commandes.",
    icon: Building2,
    keywords: ["new", "create", "nouveau", "nouvelle", "société", "societe", "company", "entreprise", "compte"]
  },
  {
    id: "quick-create.contact",
    title: "New Contact",
    description: "Ajouter une personne clé sans ouvrir d'abord le CRM.",
    icon: ContactRound,
    keywords: ["new", "create", "nouveau", "contact", "personne", "interlocuteur", "cont"]
  },
  {
    id: "quick-create.meeting",
    title: "New Meeting",
    description: "Ouvrir le workspace Réunions pour créer un rendez-vous CRM.",
    icon: CalendarCheck,
    keywords: ["new", "create", "nouveau", "réunion", "reunion", "meeting", "rendez-vous", "agenda"]
  },
  {
    id: "quick-create.task",
    title: "New Task",
    description: "Ouvrir le workspace Tâches pour créer une action de suivi.",
    icon: ScrollText,
    keywords: ["new", "create", "nouveau", "tâche", "tache", "task", "todo", "suivi"]
  },
  {
    id: "quick-create.note",
    title: "New Note",
    description: "Ouvrir le workspace Notes pour ajouter du contexte CRM.",
    icon: FileText,
    keywords: ["new", "create", "nouveau", "note", "notes", "contexte"]
  },
  {
    id: "quick-create.opportunity",
    title: "New Opportunity",
    description: "Préparer une opportunité commerciale rapidement.",
    icon: TrendingUp,
    keywords: ["new", "create", "nouveau", "opportunité", "opportunite", "opportunity", "deal", "pipeline"]
  },
  {
    id: "quick-create.quote",
    title: "New Quote",
    description: "Ouvrir le flux de création d'un devis.",
    icon: BriefcaseBusiness,
    keywords: ["new", "create", "nouveau", "devis", "quote", "quo", "proposition"]
  },
  {
    id: "quick-create.invoice",
    title: "New Invoice",
    description: "Préparer une facture depuis le centre de commandes.",
    icon: Receipt,
    keywords: ["new", "create", "nouveau", "facture", "invoice", "inv", "billing", "fact"]
  },
  {
    id: "quick-create.payment",
    title: "New Payment",
    description: "Préparer un paiement sans changer d'espace.",
    icon: WalletCards,
    keywords: ["new", "create", "nouveau", "paiement", "payment", "pay", "encaissement"]
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

export function getQuickCreateSection(query: string): UniversalSearchSection {
  const items = createActionRegistry().search(query).map(actionToSearchItem);

  return {
    id: "quick-create",
    title: "Quick Create",
    description: query ? "Créer immédiatement depuis le centre de commandes." : "Actions de création prêtes à lancer.",
    emptyTitle: "Aucune action de création",
    emptyDescription: "Essayez new, nouveau, quote, invoice, contact ou paiement.",
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
    badge: "Quick Create",
    eyebrow: "Action",
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
