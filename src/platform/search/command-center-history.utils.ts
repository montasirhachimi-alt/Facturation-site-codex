import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Clock,
  ContactRound,
  FileText,
  LayoutDashboard,
  PackageCheck,
  Receipt,
  Settings,
  Star,
  TrendingUp,
  UserRound,
  Users,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CommandCenterHistoryItem, CommandCenterHistoryKind } from "./command-center-history.types";
import type { UniversalSearchItem, UniversalSearchSection } from "./universal-search.types";

const iconByKey: Record<string, LucideIcon> = {
  analytics: BarChart3,
  company: Building2,
  contact: ContactRound,
  customer: Users,
  dashboard: LayoutDashboard,
  default: FileText,
  favorite: Star,
  invoice: Receipt,
  navigation: FileText,
  opportunity: TrendingUp,
  payment: WalletCards,
  product: PackageCheck,
  quote: BriefcaseBusiness,
  recent: Clock,
  sales: WalletCards,
  settings: Settings,
  user: UserRound
};

export function getCommandCenterHistoryId(item: UniversalSearchItem) {
  const snapshot = createCommandCenterHistoryItem(item, Date.now());
  return snapshot?.id;
}

export function createCommandCenterHistoryItem(item: UniversalSearchItem, timestamp: number): CommandCenterHistoryItem | null {
  if (!item.href || item.disabled || item.actionId) return null;

  const entity = inferEntity(item);
  const route = item.href;

  return {
    id: entity.id,
    kind: entity.kind,
    entityType: entity.entityType,
    title: item.title,
    subtitle: item.description,
    route,
    iconKey: item.iconKey ?? entity.iconKey,
    searchValue: [item.title, item.description, item.href, item.badge, item.eyebrow, ...(item.keywords ?? [])].filter(Boolean).join(" "),
    timestamp,
    source: "command-center"
  };
}

export function historyItemToSearchItem(item: CommandCenterHistoryItem, section: "favorites" | "recent"): UniversalSearchItem {
  return {
    id: `${section}.${item.id}`,
    title: item.title,
    description: item.subtitle,
    badge: item.kind === "record" ? item.entityType : "Navigation",
    eyebrow: section === "favorites" ? "Favori" : "Récent",
    href: item.route,
    icon: iconByKey[item.iconKey] ?? iconByKey.default,
    iconKey: item.iconKey,
    keywords: [item.searchValue, item.entityType, item.route],
    historyId: item.id,
    historyKind: item.kind
  };
}

export function buildHistorySection({
  description,
  emptyDescription,
  emptyTitle,
  id,
  items,
  title
}: {
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  id: "favorites" | "recent";
  items: readonly CommandCenterHistoryItem[];
  title: string;
}): UniversalSearchSection {
  return {
    id,
    title,
    description,
    emptyTitle,
    emptyDescription,
    items: items.map((item) => historyItemToSearchItem(item, id))
  };
}

function inferEntity(item: UniversalSearchItem): { id: string; kind: CommandCenterHistoryKind; entityType: string; iconKey: string } {
  const recordMatch = /^record\.([^.]+)\.(.+)$/.exec(item.id);

  if (recordMatch) {
    const entityType = recordMatch[1] ?? "record";
    const rawId = recordMatch[2] ?? item.href ?? item.id;
    return {
      id: `record:${entityType}:${rawId}`,
      kind: "record",
      entityType,
      iconKey: iconKeyForEntityType(entityType)
    };
  }

  const route = item.href ?? item.id;
  return {
    id: `nav:${route}`,
    kind: "navigation",
    entityType: "navigation",
    iconKey: iconKeyForRoute(route)
  };
}

function iconKeyForEntityType(entityType: string) {
  const keys: Record<string, string> = {
    company: "company",
    contact: "contact",
    customer: "customer",
    invoice: "invoice",
    opportunity: "opportunity",
    payment: "payment",
    quote: "quote"
  };

  return keys[entityType] ?? "default";
}

function iconKeyForRoute(route: string) {
  if (route.includes("dashboard")) return "dashboard";
  if (route.includes("crm")) return "company";
  if (route.includes("sales") || route.includes("ventes")) return "sales";
  if (route.includes("invoice") || route.includes("facture")) return "invoice";
  if (route.includes("quote") || route.includes("devis")) return "quote";
  if (route.includes("payment") || route.includes("paiement")) return "payment";
  if (route.includes("stock") || route.includes("produit")) return "product";
  if (route.includes("statistique")) return "analytics";
  if (route.includes("param")) return "settings";
  return "navigation";
}
