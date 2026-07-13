import {
  Building2,
  Boxes,
  CalendarCheck,
  ContactRound,
  FileText,
  LayoutDashboard,
  PackageCheck,
  Receipt,
  ScrollText,
  Settings,
  Users,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCurrentAlphaActivation } from "@/platform/modules/module-activation.current";
import { getActiveModuleNavigationItems } from "@/platform/modules/module-navigation";
import { isRouteAvailable } from "@/platform/modules/module-route-availability";
import type { ActiveModuleNavigationItem } from "@/platform/modules/module-navigation";
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

const iconByName: Record<string, LucideIcon> = {
  Building2,
  Boxes,
  CalendarCheck,
  ContactRound,
  FileText,
  HandCoins: WalletCards,
  LayoutDashboard,
  PackageCheck,
  Receipt,
  ScrollText,
  Settings,
  Users,
  WalletCards
};

const commandAliases: Record<string, readonly string[]> = {
  "/crm": ["crm", "relation client", "sociétés", "societes", "comptes"],
  "/crm/companies": ["sociétés", "societes", "soc", "companies", "entreprises", "comptes", "clients", "customers", "customer", "cli"],
  "/crm/contacts": ["contacts", "contact", "cont", "personnes"],
  "/crm/activities": ["activités", "activites", "activity", "timeline"],
  "/crm/meetings": ["réunions", "reunions", "meetings", "agenda"],
  "/crm/tasks": ["tâches", "taches", "tasks", "todo"],
  "/crm/notes": ["notes", "note"],
  "/sales/quotes": ["quotes", "devis", "quote", "quo", "propositions"],
  "/sales/invoices": ["invoices", "factures", "fact", "billing"],
  "/sales/payments": ["payments", "paiements", "pay", "encaissements"],
  "/sales/products": ["produits", "catalogue", "sku", "articles"],
  "/inventory": ["stock", "inventaire", "entrepôts", "entrepots", "mouvements"],
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

export function createNavigationCommandRegistry(activation = getCurrentAlphaActivation()) {
  const registry = new CommandCenterRegistry();
  const navigationItems = getActiveModuleNavigationItems(activation).filter((item) =>
    isRouteAvailable(item.href, activation)
  );

  navigationItems.forEach((item) => registry.register(navigationItemToCommand(item)));

  const firstSalesItem = navigationItems.find((item) => item.group === "Ventes");
  if (firstSalesItem) {
    registry.register({
      id: "module.sales",
      title: "Ventes",
      description: "Accéder à l'espace ventes.",
      href: firstSalesItem.href,
      icon: WalletCards,
      group: "Navigation",
      keywords: ["ventes", "commercial", "revenue", "devis", "factures", "paiements"]
    });
  }

  return registry;
}

export function getCommandCenterSections(query: string, activation = getCurrentAlphaActivation()): readonly UniversalSearchSection[] {
  const commands = createNavigationCommandRegistry(activation).search(query);
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

function navigationItemToCommand(item: ActiveModuleNavigationItem): CommandCenterCommand {
  return {
    id: `module.${item.moduleId}`,
    title: item.label,
    description: commandDescription(item),
    href: item.href,
    icon: iconByName[item.iconKey] ?? FileText,
    group: "Navigation",
    keywords: [...(commandAliases[item.href] ?? []), ...(item.searchKeywords ?? [])]
  };
}

function commandDescription(item: ActiveModuleNavigationItem) {
  if (item.href === "/dashboard") return "Ouvrir le cockpit exécutif.";
  if (item.href === "/parametres") return "Ouvrir les paramètres.";
  return `Ouvrir ${item.label}.`;
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
  if (href.includes("stock") || href.includes("inventory")) return "product";
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
