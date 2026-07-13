import type { ModuleActivationResult } from "./module-activation.types";
import { getCurrentAlphaActivation } from "./module-activation.current";
import { bosiacoModuleRegistry } from "./module-activation.current";
import { getActiveModuleNavigationItems } from "./module-navigation";
import type { ModuleDescriptor, ModuleId } from "./module.types";

export type RouteOwner = Readonly<{
  moduleId: ModuleId;
  route: string;
  exact: boolean;
  source: "module" | "compatibility";
}>;

export type RouteAvailabilityDecision = Readonly<{
  pathname: string;
  normalizedPathname: string;
  available: boolean;
  owner?: RouteOwner;
  redirectTo?: string;
  reason: "active" | "legacy-redirect" | "inactive-module" | "unknown";
}>;

export const legacyRouteRedirects: Readonly<Record<string, string>> = Object.freeze({
  "/clients": "/crm/companies",
  "/devis": "/sales/quotes",
  "/factures": "/sales/invoices",
  "/livraisons": "/sales/invoices",
  "/paiements": "/sales/payments",
  "/pdf": "/sales/invoices",
  "/utilisateurs": "/parametres",
  "/ventes": "/sales/quotes",
  "/crm/activities": "/crm/companies",
  "/crm/opportunities": "/sales/quotes"
});

export const inactiveLegacyFallbackRoutes = Object.freeze([
  "/achats",
  "/assistant-ia",
  "/caisse",
  "/fournisseurs",
  "/rh",
  "/rh/absences",
  "/rh/avances",
  "/rh/conges",
  "/rh/contrats",
  "/rh/documents",
  "/rh/employes",
  "/rh/presences",
  "/rh/salaires",
  "/statistiques",
  "/stock"
]);

export function normalizeRoutePath(pathname: string) {
  const withoutHash = pathname.split("#")[0] ?? pathname;
  const withoutQuery = withoutHash.split("?")[0] ?? withoutHash;
  const withSlash = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

export function listRouteOwners() {
  const moduleOwners = bosiacoModuleRegistry
    .list()
    .filter((descriptor): descriptor is ModuleDescriptor & { route: string } => Boolean(descriptor.route))
    .map((descriptor) => toRouteOwner(descriptor.id, descriptor.route, "module" as const));

  const compatibilityOwners = Object.keys(legacyRouteRedirects).map((route) =>
    toRouteOwner(getModuleRouteOwner(legacyRouteRedirects[route])?.moduleId ?? "core.dashboard", route, "compatibility" as const, true)
  );

  return Object.freeze([...moduleOwners, ...compatibilityOwners].sort(compareRouteOwners));
}

export function listRoutesForModule(moduleId: ModuleId) {
  return Object.freeze(listRouteOwners().filter((owner) => owner.moduleId === moduleId).map((owner) => owner.route));
}

export function getRouteOwner(pathname: string): RouteOwner | undefined {
  const normalizedPathname = normalizeRoutePath(pathname);

  return listRouteOwners().find((owner) =>
    owner.exact
      ? normalizedPathname === owner.route
      : normalizedPathname === owner.route || normalizedPathname.startsWith(`${owner.route}/`)
  );
}

export function getModuleForRoute(pathname: string) {
  const owner = getRouteOwner(pathname);
  return owner ? bosiacoModuleRegistry.get(owner.moduleId) : undefined;
}

export function isRouteOwned(pathname: string) {
  return Boolean(getRouteOwner(pathname));
}

export function isRouteAvailable(
  pathname: string,
  activation: ModuleActivationResult = getCurrentAlphaActivation()
) {
  return getRouteAvailabilityDecision(pathname, activation).available;
}

export function getRouteAvailabilityDecision(
  pathname: string,
  activation: ModuleActivationResult = getCurrentAlphaActivation()
): RouteAvailabilityDecision {
  const normalizedPathname = normalizeRoutePath(pathname);
  const legacyRedirect = legacyRouteRedirects[normalizedPathname];

  if (legacyRedirect) {
    const redirectTo = getAvailableRedirectDestination(legacyRedirect, activation);
    return Object.freeze({
      pathname,
      normalizedPathname,
      available: false,
      owner: getRouteOwner(normalizedPathname),
      redirectTo,
      reason: "legacy-redirect"
    });
  }

  if (inactiveLegacyFallbackRoutes.includes(normalizedPathname)) {
    return Object.freeze({
      pathname,
      normalizedPathname,
      available: false,
      redirectTo: getFallbackRouteForUnavailableModule(activation),
      reason: "inactive-module"
    });
  }

  const owner = getRouteOwner(normalizedPathname);
  if (!owner) {
    return Object.freeze({
      pathname,
      normalizedPathname,
      available: true,
      reason: "unknown"
    });
  }

  const available = activation.activeModuleIdSet.has(owner.moduleId);
  return Object.freeze({
    pathname,
    normalizedPathname,
    available,
    owner,
    redirectTo: available ? undefined : getFallbackRouteForUnavailableModule(activation),
    reason: available ? "active" : "inactive-module"
  });
}

export function getFallbackRouteForUnavailableModule(
  activation: ModuleActivationResult = getCurrentAlphaActivation()
) {
  if (activation.activeModuleIdSet.has("core.dashboard")) return "/dashboard";

  return getActiveModuleNavigationItems(activation)[0]?.href ?? "/";
}

export function getAvailableRedirectDestination(
  preferredRoute: string,
  activation: ModuleActivationResult = getCurrentAlphaActivation()
) {
  const normalizedPreferredRoute = normalizeRoutePath(preferredRoute);
  const preferredDecision = getRouteAvailabilityDecisionWithoutLegacy(normalizedPreferredRoute, activation);
  return preferredDecision.available ? normalizedPreferredRoute : getFallbackRouteForUnavailableModule(activation);
}

export function validateRouteAvailabilityConfiguration(
  activation: ModuleActivationResult = getCurrentAlphaActivation()
) {
  const errors: string[] = [];
  const routeToOwners = new Map<string, RouteOwner[]>();

  for (const owner of listRouteOwners()) {
    const owners = routeToOwners.get(owner.route) ?? [];
    owners.push(owner);
    routeToOwners.set(owner.route, owners);
  }

  for (const [route, owners] of routeToOwners.entries()) {
    const moduleOwners = owners.filter((owner) => owner.source === "module");
    if (moduleOwners.length > 1) {
      errors.push(`Duplicate module route ownership for "${route}".`);
    }
  }

  for (const [route, destination] of Object.entries(legacyRouteRedirects)) {
    if (normalizeRoutePath(destination) === normalizeRoutePath(route)) {
      errors.push(`Compatibility redirect loop detected for "${route}".`);
    }

    if (!getRouteAvailabilityDecisionWithoutLegacy(destination, activation).available) {
      errors.push(`Compatibility route "${route}" points to unavailable destination "${destination}".`);
    }
  }

  const fallbackRoute = getFallbackRouteForUnavailableModule(activation);
  if (!getRouteAvailabilityDecisionWithoutLegacy(fallbackRoute, activation).available) {
    errors.push(`Fallback route "${fallbackRoute}" is unavailable.`);
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors)
  });
}

function getRouteAvailabilityDecisionWithoutLegacy(
  pathname: string,
  activation: ModuleActivationResult
) {
  const normalizedPathname = normalizeRoutePath(pathname);
  const owner = getRouteOwner(normalizedPathname);
  const available = !owner || activation.activeModuleIdSet.has(owner.moduleId);

  return {
    available,
    owner
  };
}

function getModuleRouteOwner(pathname: string): RouteOwner | undefined {
  const normalizedPathname = normalizeRoutePath(pathname);

  return bosiacoModuleRegistry
    .list()
    .filter((descriptor): descriptor is ModuleDescriptor & { route: string } => Boolean(descriptor.route))
    .map((descriptor) => toRouteOwner(descriptor.id, descriptor.route, "module" as const))
    .sort(compareRouteOwners)
    .find((owner) => normalizedPathname === owner.route || normalizedPathname.startsWith(`${owner.route}/`));
}

function toRouteOwner(
  moduleId: ModuleId,
  route: string,
  source: RouteOwner["source"],
  exact = false
): RouteOwner {
  return Object.freeze({
    moduleId,
    route: normalizeRoutePath(route),
    exact,
    source
  });
}

function compareRouteOwners(first: RouteOwner, second: RouteOwner) {
  return second.route.length - first.route.length || first.route.localeCompare(second.route);
}
