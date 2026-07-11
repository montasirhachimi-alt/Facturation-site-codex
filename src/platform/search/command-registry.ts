import {
  BarChart3,
  Boxes,
  Building2,
  CalendarCheck,
  ClipboardList,
  ContactRound,
  FileText,
  LayoutDashboard,
  PackageCheck,
  Receipt,
  ScrollText,
  Settings,
  UserRound,
  Users,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { coreModuleDefinitions } from "@/core/config/modules";
import { getBusinessModules } from "@/modules/business-modules";
import type { UniversalSearchItem, UniversalSearchSection } from "./universal-search.types";

export type CommandCenterCommand = Readonly<{
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  group: string;
  keywords?: readonly string[];
}>;

type CommandNavigationItem = Readonly<{
  id: string;
  label: string;
  route: string;
  children?: readonly CommandNavigationItem[];
  metadata?: Record<string, string | number | boolean | null | undefined>;
}>;

const iconByName: Record<string, LucideIcon> = {
  BarChart3,
  Boxes,
  Building2,
  CalendarCheck,
  ClipboardList,
  ContactRound,
  FileText,
  HandCoins: WalletCards,
  LayoutDashboard,
  PackageCheck,
  Receipt,
  ScrollText,
  Settings,
  UserRound,
  Users,
  WalletCards
};

const seedCommands: readonly CommandCenterCommand[] = [
  {
    id: "command.dashboard",
    title: "Dashboard",
    description: "Ouvrir le cockpit exécutif.",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "Navigation",
    keywords: ["accueil", "home", "tableau de bord", "pilot", "command center"]
  },
  {
    id: "command.sales",
    title: "Sales",
    description: "Accéder à l'espace ventes.",
    href: "/sales/quotes",
    icon: WalletCards,
    group: "Navigation",
    keywords: ["ventes", "commercial", "revenue", "devis", "factures", "paiements"]
  },
  {
    id: "command.hr",
    title: "HR",
    description: "Ouvrir l'espace équipe et ressources humaines.",
    href: "/rh",
    icon: ContactRound,
    group: "Navigation",
    keywords: ["rh", "équipe", "equipe", "people", "employés", "employees"]
  },
  {
    id: "command.reports",
    title: "Reports",
    description: "Consulter les analyses et rapports.",
    href: "/statistiques",
    icon: BarChart3,
    group: "Navigation",
    keywords: ["rapports", "reports", "analytics", "analyse", "statistiques", "bi"]
  }
];

const coreCommandIds = new Set(["products", "settings"]);

const coreCommandOverrides: Partial<Record<string, Partial<CommandCenterCommand>>> = {
  dashboard: {
    title: "Dashboard",
    description: "Ouvrir le cockpit exécutif.",
    keywords: ["accueil", "home", "tableau de bord", "pilot", "command center"]
  },
  products: {
    title: "Produits",
    description: "Ouvrir le catalogue produits et stock.",
    keywords: ["produits", "products", "stock", "inventory"]
  },
  settings: {
    title: "Settings",
    description: "Ouvrir les paramètres.",
    keywords: ["settings", "paramètres", "parametres", "configuration"]
  }
};

const commandAliases: Record<string, readonly string[]> = {
  "/crm": ["crm", "relation client", "sociétés", "societes", "comptes"],
  "/crm/companies": ["sociétés", "societes", "soc", "companies", "entreprises", "comptes", "clients", "customers", "customer", "cli"],
  "/crm/contacts": ["contacts", "contact", "cont", "personnes"],
  "/crm/activities": ["activités", "activites", "activity", "timeline"],
  "/crm/meetings": ["réunions", "reunions", "meetings", "agenda"],
  "/crm/tasks": ["tâches", "taches", "tasks", "todo"],
  "/crm/notes": ["notes", "note"],
  "/crm/opportunities": ["pipeline", "opportunités", "opportunites", "opportunities", "deals"],
  "/sales/quotes": ["quotes", "devis", "quote", "quo", "propositions"],
  "/sales/invoices": ["invoices", "factures", "fact", "billing"],
  "/sales/payments": ["payments", "paiements", "pay", "encaissements"],
  "/paiements": ["payments", "paiements", "pay", "suivi paiements"],
  "/stock": ["produits", "products", "stock", "inventory"],
  "/parametres": ["settings", "paramètres", "parametres", "configuration"]
};

export class CommandCenterRegistry {
  private readonly commands = new Map<string, CommandCenterCommand>();

  register(command: CommandCenterCommand) {
    this.commands.set(command.id, command);
    return this;
  }

  registerMany(commands: readonly CommandCenterCommand[]) {
    commands.forEach((command) => this.register(command));
    return this;
  }

  getAll() {
    return Array.from(this.commands.values());
  }

  search(query: string) {
    const normalizedQuery = normalizeCommandText(query);
    const commands = this.getAll();

    if (!normalizedQuery) return commands;

    return commands
      .map((command) => ({
        command,
        score: scoreCommand(command, normalizedQuery)
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.command.title.localeCompare(b.command.title, "fr"))
      .map((result) => result.command);
  }
}

export function createNavigationCommandRegistry() {
  const registry = new CommandCenterRegistry().registerMany(seedCommands);

  getBusinessModules().forEach((moduleDefinition) => {
    registerBusinessNavigation(registry, moduleDefinition.navigation, moduleDefinition.navigation.label);
  });

  coreModuleDefinitions
    .filter((moduleDefinition) => coreCommandIds.has(moduleDefinition.id))
    .forEach((moduleDefinition) => {
      const overrides = coreCommandOverrides[moduleDefinition.id] ?? {};

      registry.register({
        id: `core.${moduleDefinition.id}`,
        title: overrides.title ?? moduleDefinition.name,
        description: overrides.description ?? `Ouvrir ${moduleDefinition.name}.`,
        href: overrides.href ?? moduleDefinition.route,
        icon: overrides.icon ?? iconByName[moduleDefinition.icon] ?? FileText,
        group: overrides.group ?? "Navigation",
        keywords: overrides.keywords ?? commandAliases[moduleDefinition.route] ?? moduleDefinition.aliases
      });
    });

  return registry;
}

export function getCommandCenterSections(query: string): readonly UniversalSearchSection[] {
  const commands = createNavigationCommandRegistry().search(query);
  const items = commands.map(commandToSearchItem);

  return [
    {
      id: "navigation",
      title: "Navigation",
      description: query ? "Résultats locaux instantanés." : "Tapez pour ouvrir rapidement un espace de travail.",
      emptyTitle: "Aucune destination",
      emptyDescription: "Essayez CRM, devis, factures, contacts, paiements ou paramètres.",
      items
    }
  ];
}

function registerBusinessNavigation(
  registry: CommandCenterRegistry,
  item: CommandNavigationItem,
  group: string
) {
  const iconName = typeof item.metadata?.icon === "string" ? item.metadata.icon : item.id === "sales" ? "WalletCards" : "FileText";
  const href = item.id === "sales" ? "/sales/quotes" : item.route;

  if (item.id !== "sales") {
    registry.register({
      id: `business.${item.id}`,
      title: item.label,
      description: `Ouvrir ${item.label}.`,
      href,
      icon: iconByName[iconName] ?? FileText,
      group,
      keywords: commandAliases[href] ?? commandAliases[item.route] ?? []
    });
  }

  item.children?.forEach((child) => registerBusinessNavigation(registry, child, group));
}

function commandToSearchItem(command: CommandCenterCommand): UniversalSearchItem {
  return {
    id: command.id,
    title: command.title,
    description: command.description,
    eyebrow: command.group,
    icon: command.icon,
    iconKey: commandIconKey(command.href),
    href: command.href,
    keywords: command.keywords
  };
}

function commandIconKey(href: string) {
  if (href.includes("dashboard")) return "dashboard";
  if (href.includes("sales") || href.includes("ventes")) return "sales";
  if (href.includes("stock")) return "product";
  if (href.includes("statistiques")) return "analytics";
  if (href.includes("param")) return "settings";
  if (href.includes("crm")) return "company";
  return "navigation";
}

function scoreCommand(command: CommandCenterCommand, normalizedQuery: string) {
  const values = [command.title, command.description, command.href, command.group, ...(command.keywords ?? [])].map(normalizeCommandText);

  let bestScore = 0;

  for (const value of values) {
    if (!value) continue;
    if (value === normalizedQuery) bestScore = Math.max(bestScore, 120);
    if (value.startsWith(normalizedQuery)) bestScore = Math.max(bestScore, 90);
    if (value.includes(normalizedQuery)) bestScore = Math.max(bestScore, 60);

    const words = value.split(" ");
    if (words.some((word) => word.startsWith(normalizedQuery))) {
      bestScore = Math.max(bestScore, 80);
    }
  }

  return bestScore;
}

function normalizeCommandText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
