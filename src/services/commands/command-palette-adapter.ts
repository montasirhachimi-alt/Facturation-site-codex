import type { ModuleSearchResult } from "@/core/search";
import { CommandService } from "./CommandService";

export type CommandPaletteItem = ModuleSearchResult & {
  commandId: string;
  commandCategory: string;
  shortcut?: string[];
};

const commandLabels: Record<string, string> = {
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

const commandIconByRoute: Record<string, string> = {
  "/dashboard": "LayoutDashboard",
  "/clients": "Users",
  "/fournisseurs": "Building2",
  "/stock": "Boxes",
  "/ventes": "FileText",
  "/devis": "ClipboardList",
  "/factures": "Receipt",
  "/livraisons": "Truck",
  "/achats": "HandCoins",
  "/caisse": "CircleDollarSign",
  "/paiements": "WalletCards",
  "/rh/employes": "ContactRound",
  "/rh/contrats": "ScrollText",
  "/rh/presences": "CalendarCheck",
  "/rh/absences": "CalendarX",
  "/rh/conges": "ShieldCheck",
  "/rh/salaires": "Landmark",
  "/rh/avances": "WalletCards",
  "/rh/documents": "FileArchive",
  "/statistiques": "BarChart3",
  "/rapports": "PackageCheck",
  "/pdf": "FileOutput",
  "/assistant-ia": "Bot",
  "/parametres": "Settings",
  "/utilisateurs": "UserCog"
};

function scoreCommand(query: string, values: string[]) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return 1;

  return values.some((value) => value.toLowerCase() === normalizedQuery)
    ? 100
    : values.some((value) => value.toLowerCase().startsWith(normalizedQuery))
      ? 80
      : values.some((value) => value.toLowerCase().includes(normalizedQuery))
        ? 60
        : 0;
}

export function getCommandPaletteItems(query: string, limit = 8, commandService = new CommandService()): CommandPaletteItem[] {
  return commandService
    .searchCommands(query)
    .map((command) => {
      const moduleId = command.id.replace(/^open-/, "");
      const route = command.href ?? "";
      const title = commandLabels[moduleId] ?? command.label;
      const score = scoreCommand(query, [title, command.label, command.category, route, ...(command.keywords ?? [])]);

      return {
        id: command.id,
        commandId: command.id,
        commandCategory: command.category,
        title,
        category: command.category,
        route,
        icon: commandIconByRoute[route] ?? "FileText",
        score,
        matchedOn: "name",
        shortcut: command.shortcut,
        module: {
          id: moduleId,
          name: title,
          category: "system",
          icon: commandIconByRoute[route] ?? "FileText",
          route,
          permissions: command.permissions ?? [],
          searchable: true,
          favorite: false,
          widgets: [],
          enabled: true
        }
      } satisfies CommandPaletteItem;
    })
    .filter((item) => !query.trim() || item.score > 0)
    .sort((first, second) => second.score - first.score || first.title.localeCompare(second.title))
    .slice(0, limit);
}

export function getCommandPaletteGroups(query: string, commandService = new CommandService()) {
  return getCommandPaletteItems(query, 100, commandService).reduce<Record<string, CommandPaletteItem[]>>((groups, item) => {
    groups[item.commandCategory] = [...(groups[item.commandCategory] ?? []), item];
    return groups;
  }, {});
}
