import type { ModuleActivationResult } from "./module-activation.types";
import { getCurrentAlphaActivation } from "./module-activation.current";
import type { ModuleDescriptor, ModuleId, ModuleNavigationDescriptor } from "./module.types";

export type ActiveModuleNavigationItem = Readonly<{
  moduleId: ModuleId;
  label: string;
  href: string;
  iconKey: string;
  group: string;
  order: number;
  exactMatch?: boolean;
  badgeKey?: string;
  parentModuleId?: ModuleId;
  mobileLabel?: string;
  searchKeywords?: readonly string[];
}>;

export type ActiveModuleNavigationGroup = Readonly<{
  label: string;
  order: number;
  items: readonly ActiveModuleNavigationItem[];
}>;

const navigationGroupOrder: Record<string, number> = {
  Accueil: 10,
  CRM: 20,
  Ventes: 30,
  Système: 90
};

export function getActiveModuleNavigationItems(
  activation: ModuleActivationResult = getCurrentAlphaActivation()
) {
  const items = activation.activeModules
    .filter((descriptor) => isVisibleNavigableModule(descriptor, activation))
    .map((descriptor) => toNavigationItem(descriptor, descriptor.navigation!));

  return Object.freeze(items.sort(compareNavigationItemsByGroup));
}

export function getActiveModuleNavigationGroups(
  activation: ModuleActivationResult = getCurrentAlphaActivation()
) {
  const groups = new Map<string, ActiveModuleNavigationItem[]>();

  for (const item of getActiveModuleNavigationItems(activation)) {
    const groupItems = groups.get(item.group) ?? [];
    groupItems.push(item);
    groups.set(item.group, groupItems);
  }

  const grouped = [...groups.entries()].map(([label, items]) => {
    const orderedItems = items.sort(compareNavigationItems);

    return Object.freeze({
      label,
      order: getNavigationGroupOrder(label),
      items: Object.freeze(orderedItems)
    });
  });

  return Object.freeze(grouped.sort((first, second) => first.order - second.order || first.label.localeCompare(second.label, "fr")));
}

export function getNavigationItemForModule(
  moduleId: ModuleId,
  activation: ModuleActivationResult = getCurrentAlphaActivation()
) {
  return getActiveModuleNavigationItems(activation).find((item) => item.moduleId === moduleId);
}

function isVisibleNavigableModule(descriptor: ModuleDescriptor, activation: ModuleActivationResult) {
  return Boolean(
    activation.activeModuleIdSet.has(descriptor.id) &&
    !descriptor.hidden &&
    descriptor.navigation &&
    !descriptor.navigation.hidden &&
    descriptor.navigation.href
  );
}

function toNavigationItem(
  descriptor: ModuleDescriptor,
  navigation: ModuleNavigationDescriptor
): ActiveModuleNavigationItem {
  return Object.freeze({
    moduleId: descriptor.id,
    label: navigation.label,
    href: navigation.href,
    iconKey: navigation.iconKey,
    group: navigation.group,
    order: navigation.order ?? descriptor.order,
    exactMatch: navigation.exactMatch,
    badgeKey: navigation.badgeKey,
    parentModuleId: navigation.parentModuleId,
    mobileLabel: navigation.mobileLabel,
    searchKeywords: navigation.searchKeywords
  });
}

function compareNavigationItems(first: ActiveModuleNavigationItem, second: ActiveModuleNavigationItem) {
  return first.order - second.order || first.href.localeCompare(second.href) || first.label.localeCompare(second.label, "fr");
}

function compareNavigationItemsByGroup(first: ActiveModuleNavigationItem, second: ActiveModuleNavigationItem) {
  return getNavigationGroupOrder(first.group) - getNavigationGroupOrder(second.group) || compareNavigationItems(first, second);
}

function getNavigationGroupOrder(group: string) {
  return navigationGroupOrder[group] ?? 50;
}
