const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const srcRoot = path.join(root, "src");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(srcRoot, request.slice(2)), parent, isMain, options);
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2020
    },
    fileName: filename
  });

  module._compile(output.outputText, filename);
};

require.extensions[".tsx"] = require.extensions[".ts"];

const results = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function test(name, run) {
  try {
    run();
    results.push({ name, status: "pass" });
  } catch (error) {
    results.push({ name, status: "fail", error });
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function listFiles(relativeDir) {
  const dir = path.join(root, relativeDir);
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDir, entry.name);
    return entry.isDirectory() ? listFiles(relativePath) : [relativePath];
  });
}

function load(relativePath) {
  return require(path.join(root, relativePath));
}

test("Platform Event Runtime emits events and reaches subscribers", () => {
  const { PlatformEventRuntime } = load("src/runtime/platform-events");
  const runtime = new PlatformEventRuntime();
  let received;

  runtime.subscribe("sales.changed", (event) => {
    received = event;
  });

  const emitted = runtime.emit({
    type: "sales.changed",
    category: "sales.invoice",
    workspaceId: "workspace-main",
    payload: { total: 1280 }
  });

  assert(received === emitted, "Subscriber should receive the emitted event instance.");
  assert(Boolean(emitted.id), "Emitted events should receive an id.");
  assert(Boolean(emitted.timestamp), "Emitted events should receive a timestamp.");
});

test("Platform Event Runtime supports matcher objects by category/type", () => {
  const { PlatformEventRuntime } = load("src/runtime/platform-events");
  const runtime = new PlatformEventRuntime();
  let count = 0;

  runtime.subscribe({ category: "finance.payment", type: "finance.changed" }, () => {
    count += 1;
  });

  runtime.emit({ type: "finance.changed", category: "finance.payment" });
  runtime.emit({ type: "finance.changed", category: "finance.invoice" });

  assert(count === 1, "Matcher object should only receive matching category/type events.");
});

test("Platform Event Runtime supports unsubscribe, once and clearSubscriptions", () => {
  const { PlatformEventRuntime } = load("src/runtime/platform-events");
  const runtime = new PlatformEventRuntime();
  let persistentCount = 0;
  let onceCount = 0;
  let clearedCount = 0;

  const subscription = runtime.subscribe("widget.refreshed", () => {
    persistentCount += 1;
  });

  runtime.unsubscribe(subscription);
  runtime.emit({ type: "widget.refreshed", category: "widget.dashboard" });

  runtime.once("preferences.changed", () => {
    onceCount += 1;
  });
  runtime.emit({ type: "preferences.changed", category: "preferences.user" });
  runtime.emit({ type: "preferences.changed", category: "preferences.user" });

  runtime.subscribe("workspace.changed", () => {
    clearedCount += 1;
  });
  runtime.clearSubscriptions();
  runtime.emit({ type: "workspace.changed", category: "workspace.active" });

  assert(persistentCount === 0, "Unsubscribed handlers should not run.");
  assert(onceCount === 1, "Once handlers should run only once.");
  assert(clearedCount === 0, "Cleared handlers should not run.");
});

test("Platform Event Runtime avoids duplicate subscribers and isolates subscriber errors", () => {
  const { PlatformEventRuntime } = load("src/runtime/platform-events");
  const runtime = new PlatformEventRuntime();
  let count = 0;
  let safeSubscriberReached = false;
  const subscriber = () => {
    count += 1;
  };

  runtime.subscribe("audit.logged", subscriber);
  runtime.subscribe("audit.logged", subscriber);
  runtime.emit({ type: "audit.logged", category: "audit.system" });

  runtime.subscribe("security.detected", () => {
    throw new Error("subscriber failure");
  });
  runtime.subscribe("security.detected", () => {
    safeSubscriberReached = true;
  });
  runtime.emit({ type: "security.detected", category: "security.login" });
  runtime.emit({ type: "ai.suggested", category: "ai.recommendation" });

  assert(count === 1, "Identical subscriber registrations should not be duplicated.");
  assert(safeSubscriberReached, "One failing subscriber should not block later subscribers.");
});

test("Preferences Runtime derives preferences from Workspace Context and exposes stable accessors", () => {
  const providerSource = read("src/preferences/preferences-runtime-provider.tsx");
  const typeSource = read("src/preferences/preferences-runtime.types.ts");

  assert(providerSource.includes('import { useWorkspace } from "@/hooks"'), "Preferences Runtime should consume Workspace Context.");
  assert(!providerSource.includes("PreferencesService"), "Preferences Runtime should not call PreferencesService directly.");
  assert(providerSource.includes("workspaceSnapshot?.preferences ?? workspacePreferences"), "Preferences Runtime should derive preferences from snapshot with fallback.");
  assert(providerSource.includes("getPreferenceValue"), "Preferences Runtime should expose preference value access.");
  assert(providerSource.includes('getPreferenceValue("theme")'), "Preferences Runtime should expose theme formatting.");
  assert(providerSource.includes('getPreferenceValue("language")'), "Preferences Runtime should expose language formatting.");
  assert(typeSource.includes("PreferenceRuntimeValue"), "Preferences Runtime public value type should exist.");
  assert(typeSource.includes("workspacePreferences: HicoPilotPreference[]"), "Preferences Runtime should type workspace preferences.");
});

test("Widget Runtime receives workspace snapshot, preferences and typed widget metadata", () => {
  const providerSource = read("src/widgets/widget-runtime-provider.tsx");
  const typeSource = read("src/widgets/widget-runtime.types.ts");

  assert(providerSource.includes('import { usePreferencesRuntime } from "@/preferences"'), "Widget Runtime should consume Preferences Runtime.");
  assert(!providerSource.includes("WorkspaceService"), "Widget Runtime should not call WorkspaceService directly.");
  assert(providerSource.includes("workspaceSnapshot?.widgets ?? []"), "Widget Runtime should derive widgets from workspace snapshot.");
  assert(providerSource.includes("workspacePreferences: preferences"), "Widget Runtime should pass runtime preferences to widgets.");
  assert(providerSource.includes("loadingState"), "Widget Runtime should expose loading state.");
  assert(providerSource.includes("errorState"), "Widget Runtime should expose error state.");
  assert(providerSource.includes("permissions"), "Widget Runtime should expose widget permissions.");
  assert(typeSource.includes("metadata: HicoPilotWidget"), "Widget metadata should remain typed from core widget definitions.");
  assert(typeSource.includes("getWidgetRuntime"), "Widget Runtime should expose per-widget runtime access.");
});

test("Workspace Context delegates workspace operations to WorkspaceService", () => {
  const providerSource = read("src/providers/workspace-provider.tsx");
  const contextSource = read("src/context/workspace-context.ts");
  const { WorkspaceService } = load("src/services/workspace");
  const service = new WorkspaceService();
  const defaultWorkspace = service.getDefaultWorkspace();
  const snapshot = service.getWorkspaceSnapshot(defaultWorkspace.id);

  assert(providerSource.includes("new WorkspaceService()"), "WorkspaceProvider should instantiate WorkspaceService.");
  assert(providerSource.includes("service.switchWorkspace"), "WorkspaceProvider should delegate switching to WorkspaceService.");
  assert(providerSource.includes("service.getWorkspaceSnapshot"), "WorkspaceProvider should delegate snapshot loading to WorkspaceService.");
  assert(providerSource.includes("setIsLoading(true)") && providerSource.includes("setError"), "WorkspaceProvider should expose loading and error state.");
  assert(contextSource.includes("switchWorkspace") && contextSource.includes("refreshWorkspace") && contextSource.includes("reloadSnapshot"), "Workspace Context should expose required actions.");
  assert(snapshot.workspace.id === defaultWorkspace.id, "WorkspaceService should provide a valid snapshot for the default workspace.");
  assert(Array.isArray(snapshot.modules), "Workspace snapshot should include modules.");
  assert(Array.isArray(snapshot.preferences), "Workspace snapshot should include preferences.");
});

test("Platform Search separation keeps Core Search framework-agnostic", () => {
  const coreFiles = listFiles("src/core/search");
  const platformFiles = listFiles("src/platform/search");
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /from ["']lucide-react["']/,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/dashboard/,
    /@\/platform/
  ];

  assert(coreFiles.every((file) => !file.endsWith(".tsx")), "Core Search should not contain TSX files.");

  for (const file of coreFiles) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `Core Search should not import forbidden UI dependency in ${file}.`);
    }
  }

  const platformSource = platformFiles.map((file) => read(file)).join("\n");
  assert(platformSource.includes("react"), "Platform Search may own React-specific search code.");
  assert(platformSource.includes("@/core/search"), "Platform Search should consume Core Search.");
});

test("Platform Module Registry describes Alpha-ready modules without changing activation", () => {
  const {
    ModuleRegistry,
    bosiacoModuleDescriptors,
    validateModuleDescriptors
  } = load("src/platform/modules");
  const registry = new ModuleRegistry(bosiacoModuleDescriptors);
  const validation = registry.validate();
  const expectedVisibleIds = [
    "core.dashboard",
    "core.settings",
    "crm.overview",
    "crm.companies",
    "crm.contacts",
    "crm.meetings",
    "crm.tasks",
    "crm.notes",
    "sales.quotes",
    "sales.invoices",
    "sales.payments"
  ];
  const visibleIds = registry.listVisible().map((descriptor) => descriptor.id);
  const alphaReadyIds = registry.listAlphaReady().map((descriptor) => descriptor.id);

  assert(validation.valid, `Platform Module Registry should validate: ${validation.issues.map((issue) => issue.message).join("; ")}`);
  assert(expectedVisibleIds.every((id) => visibleIds.includes(id)), "Visible module list should contain every Alpha-ready product workspace.");
  assert(!visibleIds.includes("crm.opportunities"), "Hidden opportunities module should not be visible.");
  assert(!visibleIds.includes("inventory.stock"), "Hidden inventory module should not be visible.");
  assert(alphaReadyIds.includes("platform.command-center"), "Command Center should be represented as an Alpha-ready platform foundation.");
  assert(registry.listByCategory("crm").some((descriptor) => descriptor.id === "crm.companies"), "Registry should list modules by category.");

  assert(
    validateModuleDescriptors([
      {
        ...bosiacoModuleDescriptors[0],
        dependencies: ["missing.module"]
      }
    ]).issues.some((issue) => issue.code === "unknown-dependency"),
    "Registry validation should report unknown dependencies."
  );
});

test("Platform Module Registry rejects duplicates and circular dependencies", () => {
  const { ModuleRegistry, bosiacoModuleDescriptors, validateModuleDescriptors } = load("src/platform/modules");
  const registry = new ModuleRegistry([bosiacoModuleDescriptors[0]]);

  let duplicateRejected = false;
  try {
    registry.register(bosiacoModuleDescriptors[0]);
  } catch {
    duplicateRejected = true;
  }

  const circularValidation = validateModuleDescriptors([
    {
      ...bosiacoModuleDescriptors[0],
      id: "test.alpha",
      dependencies: ["test.beta"]
    },
    {
      ...bosiacoModuleDescriptors[1],
      id: "test.beta",
      route: "/test-beta",
      dependencies: ["test.alpha"]
    }
  ]);

  const hiddenDefaultValidation = validateModuleDescriptors([
    {
      ...bosiacoModuleDescriptors[0],
      id: "test.hidden",
      hidden: true,
      defaultEnabled: true
    }
  ]);

  assert(duplicateRejected, "Registering the same module twice should throw.");
  assert(circularValidation.issues.some((issue) => issue.code === "circular-dependency"), "Registry validation should detect circular dependencies.");
  assert(hiddenDefaultValidation.issues.some((issue) => issue.code === "hidden-default-enabled"), "Hidden modules should not be enabled by default.");
});

test("Platform Module Activation resolves the current Alpha profile deterministically", () => {
  const {
    alphaActivationProfile,
    bosiacoModuleRegistry,
    getCurrentAlphaActivation,
    ModuleActivationEngine
  } = load("src/platform/modules");
  const engine = new ModuleActivationEngine(bosiacoModuleRegistry);
  const first = engine.resolve(alphaActivationProfile);
  const second = engine.resolve(alphaActivationProfile);
  const visibleIds = first.activeModules.filter((descriptor) => !descriptor.hidden).map((descriptor) => descriptor.id);
  const expectedVisibleIds = [
    "core.dashboard",
    "core.settings",
    "crm.overview",
    "crm.companies",
    "crm.contacts",
    "crm.meetings",
    "crm.tasks",
    "crm.notes",
    "sales.quotes",
    "sales.invoices",
    "sales.payments"
  ];

  assert(first.errors.length === 0, `Alpha activation should resolve without errors: ${first.errors.map((issue) => issue.message).join("; ")}`);
  assert(JSON.stringify(first.activationOrder) === JSON.stringify(second.activationOrder), "Activation order should be deterministic.");
  assert(expectedVisibleIds.every((id) => visibleIds.includes(id)), "Alpha activation should include every visible Alpha module.");
  assert(!visibleIds.includes("crm.opportunities"), "Hidden opportunities module should not become visible.");
  assert(!visibleIds.includes("inventory.stock"), "Planned inventory module should not become visible in Alpha.");
  assert(first.activeModuleIds.includes("platform.persistence"), "Required hidden platform dependencies may activate as non-visible foundations.");
  assert(first.automaticallyEnabledModuleIds.includes("platform.persistence"), "Required dependencies should auto-enable deterministically.");
  assert(getCurrentAlphaActivation().profileKey === "alpha.crm-sales", "Current Alpha activation should expose the current Edition profile key.");
});

test("Edition Profiles validate the default Alpha Edition and future metadata", () => {
  const {
    bosiacoEditionProfileRegistry,
    getCurrentEditionActivationResult,
    getCurrentEditionProfile
  } = load("src/platform/editions");
  const validation = bosiacoEditionProfileRegistry.validate();
  const defaultEdition = bosiacoEditionProfileRegistry.getDefaultEdition();
  const alphaActivation = getCurrentEditionActivationResult();
  const commercialEditionIds = bosiacoEditionProfileRegistry.listCommercial().map((profile) => profile.id);

  assert(validation.valid, `Edition profiles should validate: ${validation.issues.map((issue) => issue.message).join("; ")}`);
  assert(defaultEdition?.id === "alpha.crm-sales", "The current runtime default Edition should be Alpha CRM & Sales.");
  assert(getCurrentEditionProfile().id === "alpha.crm-sales", "Current Edition helper should return Alpha CRM & Sales.");
  assert(alphaActivation.errors.length === 0, "Current Edition activation should resolve without errors.");
  assert(alphaActivation.activeModuleIds.includes("sales.payments"), "Current Edition should activate stable Sales payments.");
  assert(!alphaActivation.activeModuleIds.includes("inventory.stock"), "Current Edition should not activate planned Inventory.");
  assert(commercialEditionIds.includes("basic"), "Basic should exist as commercial metadata.");
  assert(commercialEditionIds.includes("crm"), "CRM should exist as commercial metadata.");
  assert(commercialEditionIds.includes("sales"), "Sales should exist as commercial metadata.");
  assert(commercialEditionIds.includes("enterprise"), "Enterprise should exist as commercial metadata.");
  assert(bosiacoEditionProfileRegistry.listByStatus("planned").some((profile) => profile.id === "inventory"), "Inventory should remain planned metadata.");
  assert(bosiacoEditionProfileRegistry.listByStatus("planned").some((profile) => profile.id === "purchasing"), "Purchasing should remain planned metadata.");
  assert(bosiacoEditionProfileRegistry.listByStatus("planned").some((profile) => profile.id === "hr"), "HR should remain planned metadata.");
});

test("Edition adapter and validation report invalid profile combinations", () => {
  const {
    bosiacoEditionModuleRegistry,
    bosiacoEditionProfiles,
    createCustomEditionProfile,
    editionToActivationRequest,
    validateEditionProfiles
  } = load("src/platform/editions");
  const alphaProfile = bosiacoEditionProfiles.find((profile) => profile.id === "alpha.crm-sales");
  const firstRequest = editionToActivationRequest(alphaProfile);
  const secondRequest = editionToActivationRequest(alphaProfile);
  const duplicateValidation = validateEditionProfiles([
    alphaProfile,
    { ...alphaProfile }
  ], bosiacoEditionModuleRegistry);
  const unknownValidation = validateEditionProfiles([
    {
      ...alphaProfile,
      id: "test.unknown",
      defaultForEnvironment: false,
      enabledModuleIds: ["missing.module"]
    }
  ], bosiacoEditionModuleRegistry);
  const conflictValidation = validateEditionProfiles([
    {
      ...alphaProfile,
      id: "test.conflict",
      defaultForEnvironment: false,
      enabledModuleIds: ["sales.invoices"],
      disabledModuleIds: ["sales.invoices"]
    }
  ], bosiacoEditionModuleRegistry);
  const dependencyValidation = validateEditionProfiles([
    {
      ...alphaProfile,
      id: "test.disabled-dependency",
      defaultForEnvironment: false,
      enabledModuleIds: ["sales.invoices"],
      disabledModuleIds: ["sales.quotes"]
    }
  ], bosiacoEditionModuleRegistry);
  const customProfile = createCustomEditionProfile({
    id: "custom.test",
    name: "Custom Test",
    enabledModuleIds: ["core.dashboard", "crm.companies"],
    allowHiddenModules: true
  });
  const customValidation = validateEditionProfiles([customProfile], bosiacoEditionModuleRegistry);

  assert(JSON.stringify(firstRequest) === JSON.stringify(secondRequest), "Edition adapter should produce deterministic activation requests.");
  assert(firstRequest.profileKey === "alpha.crm-sales", "Edition adapter should use the stable Edition ID as activation profile key.");
  assert(duplicateValidation.issues.some((issue) => issue.code === "duplicate-edition-id"), "Duplicate Edition IDs should be rejected.");
  assert(unknownValidation.issues.some((issue) => issue.code === "unknown-module"), "Unknown module IDs should be reported.");
  assert(conflictValidation.issues.some((issue) => issue.code === "conflicting-module-selection"), "Contradictory module selection should be reported.");
  assert(dependencyValidation.issues.some((issue) => issue.code === "blocked-required-dependency"), "Disabled required dependencies should be reported through activation validation.");
  assert(customValidation.valid, `Custom Edition helper should produce valid metadata: ${customValidation.issues.map((issue) => issue.message).join("; ")}`);
});

test("Current Edition activation remains compatible with SPR-402 Sidebar and Command Center consumers", () => {
  const { getCurrentEditionActivationResult } = load("src/platform/editions");
  const { getCurrentAlphaActivation } = load("src/platform/modules");
  const editionActivation = getCurrentEditionActivationResult();
  const currentActivation = getCurrentAlphaActivation();

  assert(JSON.stringify(editionActivation.activeModuleIds) === JSON.stringify(currentActivation.activeModuleIds), "Current module activation should be driven by the current Edition profile.");
  assert(editionActivation.activeModuleIds.includes("platform.persistence"), "Edition-driven activation should preserve auto-enabled platform persistence.");
  assert(!editionActivation.activeModuleIds.includes("crm.opportunities"), "Edition-driven activation should keep hidden opportunities inactive.");
  assert(!editionActivation.activeModuleIds.includes("ai.assistant"), "Edition-driven activation should keep AI inactive.");
});

test("Platform Module Activation reports unknown, hidden and disabled dependency conflicts", () => {
  const {
    ModuleActivationEngine,
    bosiacoModuleRegistry,
    alphaActivationProfile
  } = load("src/platform/modules");
  const engine = new ModuleActivationEngine(bosiacoModuleRegistry);

  const unknown = engine.resolve({
    includeDefaults: false,
    enabledModuleIds: ["missing.module"]
  });
  const planned = engine.resolve({
    includeDefaults: false,
    enabledModuleIds: ["inventory.stock"]
  });
  const disabledDependency = engine.resolve({
    ...alphaActivationProfile,
    enabledModuleIds: ["sales.invoices"],
    disabledModuleIds: ["sales.quotes"]
  });

  assert(unknown.errors.some((issue) => issue.code === "unknown-module"), "Unknown module ids should be reported.");
  assert(planned.errors.some((issue) => issue.code === "planned-module-requested"), "Planned modules should not activate in the normal profile.");
  assert(disabledDependency.errors.some((issue) => issue.code === "disabled-dependency"), "Explicitly disabled required dependencies should block dependents.");
  assert(!disabledDependency.activeModuleIds.includes("sales.invoices"), "Dependent module should not activate when a required dependency is disabled.");
});

test("Sidebar and Command Center consume activation without exposing hidden modules", () => {
  const { getSidebarGroups } = load("src/services/navigation/sidebar-adapter.ts");
  const { createNavigationCommandRegistry } = load("src/platform/search/command-registry.ts");
  const sidebarHrefs = getSidebarGroups().flatMap((group) => group.items.map((item) => item.href));
  const commandHrefs = createNavigationCommandRegistry().getAll().map((command) => command.href);

  assert(sidebarHrefs.includes("/dashboard"), "Sidebar should keep Dashboard visible.");
  assert(sidebarHrefs.includes("/crm/companies"), "Sidebar should keep Companies visible.");
  assert(sidebarHrefs.includes("/sales/quotes"), "Sidebar should keep Quotes visible.");
  assert(sidebarHrefs.includes("/parametres"), "Sidebar should keep Settings visible.");
  assert(!sidebarHrefs.includes("/crm/opportunities"), "Sidebar should not expose hidden Opportunities.");
  assert(!sidebarHrefs.includes("/inventory"), "Sidebar should not expose inactive Inventory.");
  assert(commandHrefs.includes("/crm/contacts"), "Command Center should keep active CRM navigation.");
  assert(commandHrefs.includes("/sales/invoices"), "Command Center should keep active Sales navigation.");
  assert(!commandHrefs.includes("/crm/opportunities"), "Command Center should not expose hidden Opportunities.");
  assert(!commandHrefs.includes("/inventory"), "Command Center should not expose inactive Inventory.");
});

test("Dynamic Navigation preserves exact current Alpha Sidebar parity", () => {
  const { getSidebarGroups } = load("src/services/navigation/sidebar-adapter.ts");
  const { getActiveModuleNavigationItems } = load("src/platform/modules/module-navigation.ts");
  const expectedHrefs = [
    "/dashboard",
    "/crm",
    "/crm/companies",
    "/crm/contacts",
    "/crm/meetings",
    "/crm/tasks",
    "/crm/notes",
    "/sales/quotes",
    "/sales/invoices",
    "/sales/payments",
    "/parametres"
  ];
  const sidebarHrefs = getSidebarGroups().flatMap((group) => group.items.map((item) => item.href));
  const navigationHrefs = getActiveModuleNavigationItems().map((item) => item.href);

  assert(JSON.stringify(sidebarHrefs) === JSON.stringify(expectedHrefs), `Sidebar hrefs should match Alpha parity. Received: ${sidebarHrefs.join(", ")}`);
  assert(JSON.stringify(navigationHrefs) === JSON.stringify(expectedHrefs), "Module navigation composition should match Alpha parity.");
});

test("Dynamic Navigation supports Basic and Sales-style activation without changing runtime Edition", () => {
  const { ModuleActivationEngine, bosiacoModuleRegistry } = load("src/platform/modules");
  const { basicEditionProfile, salesEditionProfile, editionToActivationRequest } = load("src/platform/editions");
  const { getActiveModuleNavigationItems } = load("src/platform/modules/module-navigation.ts");
  const { isRouteAvailable } = load("src/platform/modules/module-route-availability.ts");
  const engine = new ModuleActivationEngine(bosiacoModuleRegistry);
  const basicActivation = engine.resolve(editionToActivationRequest(basicEditionProfile));
  const salesActivation = engine.resolve(editionToActivationRequest(salesEditionProfile));
  const basicHrefs = getActiveModuleNavigationItems(basicActivation).map((item) => item.href);
  const salesHrefs = getActiveModuleNavigationItems(salesActivation).map((item) => item.href);

  assert(basicHrefs.includes("/dashboard"), "Basic-style navigation should include Dashboard.");
  assert(basicHrefs.includes("/crm/companies"), "Basic-style navigation should include Companies.");
  assert(basicHrefs.includes("/crm/contacts"), "Basic-style navigation should include Contacts.");
  assert(!basicHrefs.includes("/sales/quotes"), "Basic-style navigation should exclude Sales Quotes.");
  assert(!isRouteAvailable("/sales/quotes", basicActivation), "Sales Quotes route should be unavailable under Basic-style activation.");
  assert(salesHrefs.includes("/crm/companies"), "Sales-style navigation should include CRM company dependency.");
  assert(salesHrefs.includes("/sales/quotes"), "Sales-style navigation should include Quotes.");
  assert(salesHrefs.includes("/sales/invoices"), "Sales-style navigation should include Invoices.");
  assert(salesHrefs.includes("/sales/payments"), "Sales-style navigation should include Payments.");
});

test("Inventory Edition metadata activates Stock navigation only in controlled profile", () => {
  const { ModuleActivationEngine, bosiacoModuleRegistry } = load("src/platform/modules");
  const { inventoryEditionProfile, editionToActivationRequest } = load("src/platform/editions");
  const { getActiveModuleNavigationItems } = load("src/platform/modules/module-navigation.ts");
  const { isRouteAvailable } = load("src/platform/modules/module-route-availability.ts");
  const { createNavigationCommandRegistry } = load("src/platform/search/command-registry.ts");
  const engine = new ModuleActivationEngine(bosiacoModuleRegistry);
  const activation = engine.resolve(editionToActivationRequest(inventoryEditionProfile));
  const hrefs = getActiveModuleNavigationItems(activation).map((item) => item.href);
  const commandHrefs = createNavigationCommandRegistry(activation).getAll().map((command) => command.href);

  assert(activation.errors.length === 0, `Inventory profile should resolve cleanly: ${activation.errors.map((issue) => issue.message).join("; ")}`);
  assert(activation.activeModuleIdSet.has("sales.products"), "Inventory profile should activate the Product Catalog dependency.");
  assert(activation.activeModuleIdSet.has("inventory.stock"), "Inventory profile should activate the Stock module.");
  assert(hrefs.includes("/sales/products"), "Inventory profile should expose Products navigation.");
  assert(hrefs.includes("/inventory"), "Inventory profile should expose Stock navigation.");
  assert(isRouteAvailable("/inventory", activation), "Inventory route should be available under the Inventory profile.");
  assert(commandHrefs.includes("/inventory"), "Command Center should expose Stock only under the Inventory profile.");
});

test("Route availability handles matching, fallback and legacy compatibility redirects", () => {
  const {
    getFallbackRouteForUnavailableModule,
    getRouteAvailabilityDecision,
    getRouteOwner,
    isRouteAvailable,
    normalizeRoutePath,
    validateRouteAvailabilityConfiguration
  } = load("src/platform/modules/module-route-availability.ts");
  const validation = validateRouteAvailabilityConfiguration();

  assert(validation.valid, `Route availability config should validate: ${validation.errors.join("; ")}`);
  assert(normalizeRoutePath("/sales/quotes?status=open#top") === "/sales/quotes", "Route normalization should remove query strings and hashes.");
  assert(getRouteOwner("/sales/quotes/quote-demo")?.moduleId === "sales.quotes", "Most specific route ownership should match nested quote details.");
  assert(isRouteAvailable("/sales/quotes"), "Active route should be available.");
  assert(!isRouteAvailable("/inventory"), "Inventory route should be unavailable in Alpha.");
  assert(getRouteAvailabilityDecision("/devis").redirectTo === "/sales/quotes", "Legacy Devis route should redirect to active Quotes.");
  assert(getRouteAvailabilityDecision("/clients").redirectTo === "/crm/companies", "Legacy Clients route should redirect to active Companies.");
  assert(getRouteAvailabilityDecision("/stock").redirectTo === "/dashboard", "Legacy inactive Stock route should redirect to fallback.");
  assert(getRouteAvailabilityDecision("/inventory").redirectTo === "/dashboard", "Inactive Inventory route should redirect to fallback.");
  assert(getFallbackRouteForUnavailableModule() === "/dashboard", "Fallback route should prefer Dashboard when active.");
});

test("Favorites and Recent hide inactive-module destinations without deleting stored history", () => {
  const { buildHistorySection } = load("src/platform/search/command-center-history.utils.ts");
  const section = buildHistorySection({
    id: "recent",
    title: "Récents",
    description: "Navigation récente.",
    emptyTitle: "Aucun récent",
    emptyDescription: "Les destinations récentes apparaîtront ici.",
    items: [
      {
        id: "nav:/sales/quotes",
        kind: "navigation",
        entityType: "navigation",
        title: "Devis",
        subtitle: "Ouvrir les devis",
        route: "/sales/quotes",
        iconKey: "quote",
        searchValue: "devis",
        timestamp: 1,
        source: "command-center"
      },
      {
        id: "nav:/stock",
        kind: "navigation",
        entityType: "navigation",
        title: "Stock",
        subtitle: "Ouvrir le stock",
        route: "/stock",
        iconKey: "product",
        searchValue: "stock",
        timestamp: 2,
        source: "command-center"
      }
    ]
  });

  const hrefs = section.items.map((item) => item.href);
  assert(hrefs.includes("/sales/quotes"), "History should keep active routes visible.");
  assert(!hrefs.includes("/stock"), "History should hide inactive routes from visible results.");
});

test("Dashboard Contribution Registry validates Alpha dashboard metadata", () => {
  const {
    bosiacoDashboardContributionRegistry,
    bosiacoDashboardContributions,
    validateDashboardContributions
  } = load("src/platform/dashboard");
  const validation = bosiacoDashboardContributionRegistry.validate();
  const duplicateWidgetValidation = validateDashboardContributions([
    bosiacoDashboardContributions[0],
    {
      ...bosiacoDashboardContributions[1],
      id: "test.duplicate-widget",
      widgetId: bosiacoDashboardContributions[0].widgetId
    }
  ]);
  const duplicateRenderKeyValidation = validateDashboardContributions([
    bosiacoDashboardContributions[0],
    {
      ...bosiacoDashboardContributions[1],
      id: "test.duplicate-render-key",
      renderKey: bosiacoDashboardContributions[0].renderKey
    }
  ]);
  const unknownModuleValidation = validateDashboardContributions([
    {
      ...bosiacoDashboardContributions[0],
      id: "test.unknown-module",
      widgetId: "test.unknown-module",
      renderKey: "test.unknown-module",
      moduleId: "missing.module"
    }
  ]);

  assert(validation.valid, `Dashboard contributions should validate: ${validation.issues.map((issue) => issue.message).join("; ")}`);
  assert(duplicateWidgetValidation.issues.some((issue) => issue.code === "duplicate-widget-id"), "Dashboard validation should reject duplicate widget IDs.");
  assert(duplicateRenderKeyValidation.issues.some((issue) => issue.code === "duplicate-render-key"), "Dashboard validation should reject duplicate render keys.");
  assert(unknownModuleValidation.issues.some((issue) => issue.code === "unknown-module"), "Dashboard validation should reject unknown module IDs.");
});

test("Dashboard Contribution Resolver preserves Alpha layout and filters inactive modules", () => {
  const { ModuleActivationEngine, bosiacoModuleRegistry } = load("src/platform/modules");
  const { basicEditionProfile, editionToActivationRequest } = load("src/platform/editions");
  const { resolveDashboardContributions } = load("src/platform/dashboard");
  const engine = new ModuleActivationEngine(bosiacoModuleRegistry);
  const alphaLayout = resolveDashboardContributions();
  const basicLayout = resolveDashboardContributions({
    activation: engine.resolve(editionToActivationRequest(basicEditionProfile))
  });
  const expectedRenderKeys = [
    "dashboard.hero",
    "dashboard.business-health",
    "dashboard.priority-center",
    "dashboard.performance",
    "dashboard.recent-activity",
    "dashboard.quick-actions"
  ];
  const alphaRenderKeys = alphaLayout.contributions.map((contribution) => contribution.renderKey);
  const basicRenderKeys = basicLayout.contributions.map((contribution) => contribution.renderKey);

  assert(JSON.stringify(alphaRenderKeys) === JSON.stringify(expectedRenderKeys), `Alpha dashboard render keys should remain deterministic. Received: ${alphaRenderKeys.join(", ")}`);
  assert(alphaLayout.zones.hero.length === 1, "Alpha dashboard should resolve one hero contribution.");
  assert(alphaLayout.zones.secondary.length === 2, "Alpha dashboard should resolve the existing two-column secondary area.");
  assert(!basicRenderKeys.includes("dashboard.performance"), "Basic-style activation should filter Sales-owned dashboard contribution.");
  assert(basicRenderKeys.includes("dashboard.hero"), "Basic-style activation should keep Core dashboard contribution.");
});

test("Notification Event Subscriber registers once and creates notifications from supported events", () => {
  const { PlatformEventRuntime } = load("src/runtime/platform-events");
  const { NotificationEventSubscriber } = load("src/runtime/notifications");
  const runtime = new PlatformEventRuntime();
  const notifications = [];
  const service = {
    notify(input) {
      notifications.push(input);
      return input;
    },
    getAll() {
      return notifications;
    }
  };
  const subscriber = new NotificationEventSubscriber({ runtime, notificationService: service });

  const firstSubscription = subscriber.start();
  const secondSubscription = subscriber.start();

  runtime.emit({
    id: "event-sales-1",
    type: "sales.changed",
    category: "sales.invoice",
    workspaceId: "workspace-main"
  });

  assert(firstSubscription.id === secondSubscription.id, "Notification subscriber should not register twice.");
  assert(notifications.length === 1, "Supported events should produce one notification.");
  assert(notifications[0].id === "platform-event:event-sales-1", "Notification should keep source event identity.");
  assert(notifications[0].category === "sales", "Sales events should map to sales notifications.");
});

test("Notification Event Subscriber ignores unsupported events and avoids duplicate notifications", () => {
  const { PlatformEventRuntime } = load("src/runtime/platform-events");
  const { NotificationEventSubscriber } = load("src/runtime/notifications");
  const runtime = new PlatformEventRuntime();
  const notifications = [];
  const service = {
    notify(input) {
      notifications.push(input);
      return input;
    },
    getAll() {
      return notifications;
    }
  };
  const subscriber = new NotificationEventSubscriber({ runtime, notificationService: service });
  subscriber.start();

  runtime.emit({ id: "unsupported-1", type: "security.detected", category: "security.login" });
  runtime.emit({ id: "finance-1", type: "finance.changed", category: "finance.payment" });
  runtime.emit({ id: "finance-1", type: "finance.changed", category: "finance.payment" });

  assert(notifications.length === 1, "Unsupported events should be ignored and duplicate event ids should not duplicate notifications.");
  assert(notifications[0].category === "finance", "Finance events should map to finance notifications.");
});

test("Notification Event Subscriber isolates mapper errors and keeps Event Runtime delivery valid", () => {
  const { PlatformEventRuntime } = load("src/runtime/platform-events");
  const { NotificationEventSubscriber } = load("src/runtime/notifications");
  const runtime = new PlatformEventRuntime();
  let laterSubscriberReached = false;
  const service = {
    notify() {
      throw new Error("notify should not be reached");
    },
    getAll() {
      return [];
    }
  };
  const subscriber = new NotificationEventSubscriber({
    runtime,
    notificationService: service,
    mapper() {
      throw new Error("mapping failed");
    }
  });

  subscriber.start();
  runtime.subscribe("sales.changed", () => {
    laterSubscriberReached = true;
  });

  runtime.emit({ id: "event-error-1", type: "sales.changed", category: "sales.invoice" });

  assert(laterSubscriberReached, "Notification subscriber failures should not interrupt Event Runtime delivery.");
});

test("Activity Event Subscriber registers once and creates activities from supported events", () => {
  const { PlatformEventRuntime } = load("src/runtime/platform-events");
  const { ActivityEventSubscriber } = load("src/runtime/activity");
  const runtime = new PlatformEventRuntime();
  const activities = [];
  const service = {
    track(input) {
      activities.push(input);
      return input;
    },
    getTimeline() {
      return activities;
    }
  };
  const subscriber = new ActivityEventSubscriber({ runtime, activityService: service });

  const firstSubscription = subscriber.start();
  const secondSubscription = subscriber.start();

  runtime.emit({
    id: "activity-sales-1",
    type: "sales.changed",
    category: "sales.invoice",
    workspaceId: "workspace-main",
    actorId: "user-admin",
    resourceType: "invoice",
    resourceId: "F-2026-154"
  });

  assert(firstSubscription.id === secondSubscription.id, "Activity subscriber should not register twice.");
  assert(activities.length === 1, "Supported events should produce one activity.");
  assert(activities[0].id === "platform-event:activity-sales-1", "Activity should keep source event identity.");
  assert(activities[0].category === "sales", "Sales events should map to sales activities.");
  assert(activities[0].metadata.sourceEventId === "activity-sales-1", "Activity metadata should include source event id.");
});

test("Activity Event Subscriber ignores unsupported events and avoids duplicate activities", () => {
  const { PlatformEventRuntime } = load("src/runtime/platform-events");
  const { ActivityEventSubscriber } = load("src/runtime/activity");
  const runtime = new PlatformEventRuntime();
  const activities = [];
  const service = {
    track(input) {
      activities.push(input);
      return input;
    },
    getTimeline() {
      return activities;
    }
  };
  const subscriber = new ActivityEventSubscriber({ runtime, activityService: service });
  subscriber.start();

  runtime.emit({ id: "unsupported-activity-1", type: "security.detected", category: "security.login" });
  runtime.emit({ id: "inventory-activity-1", type: "inventory.changed", category: "inventory.stock" });
  runtime.emit({ id: "inventory-activity-1", type: "inventory.changed", category: "inventory.stock" });

  assert(activities.length === 1, "Unsupported events should be ignored and duplicate event ids should not duplicate activities.");
  assert(activities[0].category === "stock", "Inventory events should map to stock activities.");
});

test("Activity Event Subscriber isolates mapper errors and keeps Event Runtime delivery valid", () => {
  const { PlatformEventRuntime } = load("src/runtime/platform-events");
  const { ActivityEventSubscriber } = load("src/runtime/activity");
  const runtime = new PlatformEventRuntime();
  let laterSubscriberReached = false;
  const service = {
    track() {
      throw new Error("track should not be reached");
    },
    getTimeline() {
      return [];
    }
  };
  const subscriber = new ActivityEventSubscriber({
    runtime,
    activityService: service,
    mapper() {
      throw new Error("mapping failed");
    }
  });

  subscriber.start();
  runtime.subscribe("sales.changed", () => {
    laterSubscriberReached = true;
  });

  runtime.emit({ id: "activity-error-1", type: "sales.changed", category: "sales.invoice" });

  assert(laterSubscriberReached, "Activity subscriber failures should not interrupt Event Runtime delivery.");
});

test("Audit Event Subscriber registers once and creates immutable audit records from supported events", () => {
  const { PlatformEventRuntime } = load("src/runtime/platform-events");
  const { AuditEventSubscriber, mapPlatformEventToAuditRecord } = load("src/runtime/audit");
  const runtime = new PlatformEventRuntime();
  const auditRecords = [];
  const service = {
    log(input) {
      auditRecords.push(input);
      return input;
    },
    getRecent() {
      return auditRecords;
    }
  };
  const subscriber = new AuditEventSubscriber({ runtime, auditService: service });

  const firstSubscription = subscriber.start();
  const secondSubscription = subscriber.start();
  const eventInput = {
    id: "audit-sales-1",
    type: "sales.changed",
    category: "sales.invoice",
    workspaceId: "workspace-main",
    actorId: "user-admin",
    resourceType: "invoice",
    resourceId: "F-2026-154",
    payload: {
      oldValue: { status: "draft" },
      newValue: { status: "sent" }
    },
    metadata: {
      ipAddress: "127.0.0.1",
      userAgent: "runtime-validation",
      permission: "invoices.edit"
    }
  };

  const emitted = runtime.emit(eventInput);
  const mappedRecord = mapPlatformEventToAuditRecord(emitted);

  assert(firstSubscription.id === secondSubscription.id, "Audit subscriber should not register twice.");
  assert(auditRecords.length === 1, "Supported events should produce one audit record.");
  assert(auditRecords[0].id === "platform-event:audit-sales-1", "Audit record should keep source event identity.");
  assert(auditRecords[0].category === "sales", "Sales events should map to sales audit records.");
  assert(auditRecords[0].details.oldValue.includes("draft"), "Audit details should preserve old values.");
  assert(auditRecords[0].details.newValue.includes("sent"), "Audit details should preserve new values.");
  assert(Object.isFrozen(mappedRecord), "Mapped AuditRecord should be immutable.");
});

test("Audit Event Subscriber ignores unsupported events and avoids duplicate audit records", () => {
  const { PlatformEventRuntime } = load("src/runtime/platform-events");
  const { AuditEventSubscriber } = load("src/runtime/audit");
  const runtime = new PlatformEventRuntime();
  const auditRecords = [];
  const service = {
    log(input) {
      auditRecords.push(input);
      return input;
    },
    getRecent() {
      return auditRecords;
    }
  };
  const subscriber = new AuditEventSubscriber({ runtime, auditService: service });
  subscriber.start();

  runtime.emit({ id: "unsupported-audit-1", type: "widget.refreshed", category: "widget.dashboard" });
  runtime.emit({ id: "security-audit-1", type: "security.detected", category: "security.login" });
  runtime.emit({ id: "security-audit-1", type: "security.detected", category: "security.login" });

  assert(auditRecords.length === 1, "Unsupported events should be ignored and duplicate event ids should not duplicate audit records.");
  assert(auditRecords[0].category === "security", "Security events should map to security audit records.");
});

test("Audit Event Subscriber isolates mapper errors and keeps Event Runtime delivery valid", () => {
  const { PlatformEventRuntime } = load("src/runtime/platform-events");
  const { AuditEventSubscriber } = load("src/runtime/audit");
  const runtime = new PlatformEventRuntime();
  let laterSubscriberReached = false;
  const service = {
    log() {
      throw new Error("log should not be reached");
    },
    getRecent() {
      return [];
    }
  };
  const subscriber = new AuditEventSubscriber({
    runtime,
    auditService: service,
    mapper() {
      throw new Error("mapping failed");
    }
  });

  subscriber.start();
  runtime.subscribe("sales.changed", () => {
    laterSubscriberReached = true;
  });

  runtime.emit({ id: "audit-error-1", type: "sales.changed", category: "sales.invoice" });

  assert(laterSubscriberReached, "Audit subscriber failures should not interrupt Event Runtime delivery.");
});

test("Permission Enforcement returns structured immutable decisions", () => {
  const { PermissionEnforcement } = load("src/runtime/permissions");
  const enforcement = new PermissionEnforcement();

  const decision = enforcement.evaluate({
    subject: {
      userId: "user-admin",
      role: "COMPANY_ADMIN",
      workspaceId: "workspace-main",
      companyId: "company-main"
    },
    resource: {
      id: "invoices",
      type: "service",
      module: "invoices"
    },
    action: "create",
    workspaceId: "workspace-main",
    companyId: "company-main"
  });

  assert(decision.allowed === true, "Company admin should be allowed by the current RBAC matrix.");
  assert(decision.reason === "allowed_by_role", "Permission decision should explain why it was allowed.");
  assert(decision.permission.module === "invoices", "Permission decision should include the evaluated module.");
  assert(decision.permission.action === "create", "Permission decision should include the evaluated action.");
  assert(decision.userId === "user-admin", "Permission decision should keep subject identity.");
  assert(Object.isFrozen(decision), "Permission decisions should be immutable.");
  assert(Object.isFrozen(decision.permission), "Permission requirements should be immutable.");
});

test("Permission Enforcement denies unsupported permissions safely", () => {
  const { PermissionEnforcement } = load("src/runtime/permissions");
  const enforcement = new PermissionEnforcement();

  const decision = enforcement.evaluate({
    subject: {
      userId: "user-sales",
      role: "SALES"
    },
    resource: {
      id: "unknown-capability",
      type: "plugin",
      module: "unknown-capability"
    },
    action: "execute"
  });

  assert(decision.allowed === false, "Unsupported permission modules should be denied.");
  assert(decision.reason === "denied_unsupported_permission", "Unsupported permissions should return an explicit reason.");
});

test("Permission Enforcement stays deterministic and consumable by future runtimes", () => {
  const { PermissionEnforcement, PermissionDeniedError } = load("src/runtime/permissions");
  const enforcement = new PermissionEnforcement();
  const context = {
    subject: {
      userId: "user-readonly",
      role: "READ_ONLY"
    },
    resource: {
      id: "invoices",
      type: "widget",
      module: "invoices"
    },
    action: "delete"
  };

  const first = enforcement.evaluate(context);
  const second = enforcement.evaluate(context);
  const allowed = enforcement.filterAllowed(
    [
      { id: "dashboard", module: "dashboard" },
      { id: "invoices-delete", module: "invoices" }
    ],
    (item) => ({
      subject: context.subject,
      resource: {
        id: item.id,
        type: "widget",
        module: item.module
      },
      action: item.module === "dashboard" ? "view" : "delete"
    })
  );

  assert(first.allowed === false, "Read-only users should not delete invoices.");
  assert(first.reason === second.reason && first.allowed === second.allowed, "Repeated evaluations should be deterministic.");
  assert(allowed.length === 1 && allowed[0].id === "dashboard", "Future runtimes should be able to filter allowed resources.");

  try {
    enforcement.assertPermission(context);
    assert(false, "assertPermission should throw for denied decisions.");
  } catch (error) {
    assert(error instanceof PermissionDeniedError, "assertPermission should throw a typed PermissionDeniedError.");
    assert(error.decision.reason === "denied_missing_permission", "PermissionDeniedError should expose the structured decision.");
  }
});

test("Permission Enforcement has no UI dependency", () => {
  const permissionFiles = listFiles("src/runtime/permissions");
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /from ["']lucide-react["']/,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/dashboard/,
    /@\/widgets/
  ];

  assert(permissionFiles.every((file) => !file.endsWith(".tsx")), "Permission Enforcement should not contain TSX files.");

  for (const file of permissionFiles) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `Permission Enforcement should not import forbidden UI dependency in ${file}.`);
    }
  }
});

test("Permission Runtime Integration exposes widget permission decisions without changing visibility", () => {
  const providerSource = read("src/widgets/widget-runtime-provider.tsx");
  const typeSource = read("src/widgets/widget-runtime.types.ts");

  assert(providerSource.includes('import { PermissionService } from "@/services/permissions"'), "Widget Runtime should consume PermissionService.");
  assert(providerSource.includes("permissionService.evaluateRequirements"), "Widget Runtime should evaluate widget requirements.");
  assert(providerSource.includes("decisions.every((decision) => decision.allowed)"), "Widget Runtime should derive allowed state from permission decisions.");
  assert(providerSource.includes("state[widget.id] = widget.enabled"), "Widget visibility should remain based on existing widget enabled state.");
  assert(typeSource.includes("decisions: PermissionDecision[]"), "Widget permission state should expose structured decisions.");
});

test("Permission Runtime Integration gates CommandService through PermissionService", () => {
  const { CommandService } = load("src/services/commands");
  const service = new CommandService();
  const invoicesCommand = service.getAvailableCommands().find((command) => command.id === "open-invoices");
  const dashboardCommand = service.getAvailableCommands().find((command) => command.id === "open-dashboard");

  assert(Boolean(invoicesCommand), "Navigation commands should still be generated.");
  assert(Boolean(dashboardCommand), "Dashboard command should still be generated.");

  const readonlyDecisions = service.getCommandPermissionDecision(invoicesCommand, {
    userId: "user-readonly",
    role: "READ_ONLY"
  });
  const adminDecisions = service.getCommandPermissionDecision(invoicesCommand, {
    userId: "user-admin",
    role: "COMPANY_ADMIN"
  });

  assert(readonlyDecisions.length > 0, "Commands should expose structured permission decisions.");
  assert(readonlyDecisions.every((decision) => decision.allowed), "Read-only users should still be able to view invoice navigation commands.");
  assert(adminDecisions.every((decision) => decision.allowed), "Company admins should be allowed to view invoice navigation commands.");
  assert(service.canExecute("open-dashboard", { role: "READ_ONLY" }) === true, "CommandService canExecute should remain compatible for allowed commands.");
});

test("Platform Capability Registry registers, looks up and filters capabilities", () => {
  const { PlatformCapabilityRegistry } = load("src/core/capabilities");
  const registry = new PlatformCapabilityRegistry();

  registry.registerMany([
    {
      id: "command.create-invoice",
      name: "Create Invoice",
      category: "command",
      type: "command",
      permissions: [{ module: "invoices", action: "create" }],
      workspaceAware: true,
      metadata: { source: "runtime-validation" }
    },
    {
      id: "widget.business-health",
      name: "Business Health",
      category: "widget",
      type: "widget",
      permissions: [{ module: "dashboard", action: "view" }],
      workspaceAware: true
    }
  ]);

  assert(registry.exists("command.create-invoice"), "Capability Registry should report registered capabilities.");
  assert(registry.find("command.create-invoice").name === "Create Invoice", "Capability Registry should find capabilities by id.");
  assert(registry.findByCategory("command").length === 1, "Capability Registry should filter by category.");
  assert(registry.findByType("widget").length === 1, "Capability Registry should filter by type.");
});

test("Platform Capability Registry rejects duplicates and keeps metadata immutable", () => {
  const { PlatformCapabilityRegistry } = load("src/core/capabilities");
  const registry = new PlatformCapabilityRegistry();
  const capability = registry.register({
    id: "navigation.dashboard",
    name: "Open Dashboard",
    category: "navigation",
    type: "navigation",
    metadata: { route: "/dashboard" }
  });
  let duplicateRejected = false;

  try {
    registry.register({
      id: "navigation.dashboard",
      name: "Duplicate Dashboard",
      category: "navigation",
      type: "navigation"
    });
  } catch {
    duplicateRejected = true;
  }

  assert(duplicateRejected, "Capability Registry should reject duplicate capability ids.");
  assert(Object.isFrozen(capability), "Registered capabilities should be immutable.");
  assert(Object.isFrozen(capability.metadata), "Capability metadata should be immutable.");
});

test("Platform Capability Registry returns deterministic ordering and supports removal", () => {
  const { PlatformCapabilityRegistry } = load("src/core/capabilities");
  const registry = new PlatformCapabilityRegistry();

  registry.register({ id: "widget.z", name: "Z Widget", category: "widget", type: "widget" });
  registry.register({ id: "widget.a", name: "A Widget", category: "widget", type: "widget" });

  const ordered = registry.list().map((capability) => capability.id);
  const removed = registry.remove("widget.z");

  assert(ordered.join(",") === "widget.a,widget.z", "Capability Registry should return deterministic id ordering.");
  assert(removed.id === "widget.z", "Capability Registry should return removed capabilities.");
  assert(!registry.exists("widget.z"), "Removed capabilities should no longer exist.");
});

test("Platform Capability Registry has no framework or service dependency", () => {
  const capabilityFiles = listFiles("src/core/capabilities");
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /from ["']lucide-react["']/,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/dashboard/,
    /@\/widgets/,
    /@\/services/
  ];

  assert(capabilityFiles.every((file) => !file.endsWith(".tsx")), "Capability Registry should not contain TSX files.");

  for (const file of capabilityFiles) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `Capability Registry should not import forbidden dependency in ${file}.`);
    }
  }
});

test("Manifest System creates immutable valid manifests", () => {
  const { createManifest, validateManifest } = load("src/core/manifests");
  const input = {
    id: "plugin.sales-tools",
    name: "sales-tools",
    displayName: "Sales Tools",
    version: "1.2.0-beta",
    category: "plugin",
    capabilities: [
      {
        id: "command.sales-tools.create-quote",
        name: "Create Quote",
        category: "command",
        type: "command",
        permissions: [{ module: "quotes", action: "create" }],
        workspaceAware: true,
        metadata: { source: "manifest-validation" }
      }
    ],
    permissions: [{ module: "quotes", action: "create" }],
    dependencies: [{ id: "core.sales", version: "1.0.0" }],
    compatibility: {
      minimumPlatformVersion: "0.1.0",
      requiredCapabilities: ["command.sales-tools.create-quote"]
    },
    workspaceAware: true,
    enabledByDefault: false,
    metadata: { vendor: "HicoPilot" }
  };
  const manifest = createManifest(input);
  const result = validateManifest(input);

  assert(Object.isFrozen(manifest), "Created manifests should be immutable.");
  assert(Object.isFrozen(manifest.capabilities), "Manifest capability arrays should be immutable.");
  assert(Object.isFrozen(manifest.capabilities[0]), "Manifest capabilities should be immutable.");
  assert(Object.isFrozen(manifest.capabilities[0].metadata), "Manifest capability metadata should be immutable.");
  assert(result.valid === true, "Valid manifest input should pass validation.");
  assert(result.manifest.id === input.id, "Validation should return an immutable manifest when valid.");
});

test("Manifest System returns structured validation results for failures", () => {
  const { validateManifest } = load("src/core/manifests");
  const result = validateManifest(
    {
      id: "plugin.duplicate",
      name: "",
      version: "1.x",
      capabilities: [
        { id: "capability.same", name: "One", category: "command", type: "command" },
        { id: "capability.same", name: "Two", category: "command", type: "command" }
      ],
      dependencies: [
        { id: "dependency.same", version: "1.0.0" },
        { id: "dependency.same", version: "bad-version" }
      ]
    },
    { existingManifestIds: ["plugin.duplicate"], requireMetadata: true }
  );
  const codes = result.issues.map((issue) => issue.code);

  assert(result.valid === false, "Invalid manifests should not validate.");
  assert(!result.manifest, "Invalid validation results should not contain a manifest.");
  assert(Object.isFrozen(result), "Manifest validation results should be immutable.");
  assert(codes.includes("missing_required_field"), "Validation should report missing required fields.");
  assert(codes.includes("duplicate_manifest_id"), "Validation should report duplicate manifest ids.");
  assert(codes.includes("duplicate_capability_id"), "Validation should report duplicate capability ids.");
  assert(codes.includes("duplicate_dependency_id"), "Validation should report duplicate dependency ids.");
  assert(codes.includes("invalid_version"), "Validation should report invalid semantic versions.");
  assert(codes.includes("missing_metadata"), "Validation should report metadata warnings when requested.");
});

test("Manifest System validates semantic versions and dependency declarations", () => {
  const { isValidManifestVersion, validateManifest } = load("src/core/manifests");
  const invalidDependency = validateManifest({
    id: "plugin.invalid-dependency",
    name: "invalid-dependency",
    version: "1.0.0",
    dependencies: [{ id: "", version: "1.0.0" }]
  });

  assert(isValidManifestVersion("1.0.0"), "Semantic version validation should accept stable versions.");
  assert(isValidManifestVersion("2.0.0-beta"), "Semantic version validation should accept prerelease versions.");
  assert(!isValidManifestVersion("2.0"), "Semantic version validation should reject incomplete versions.");
  assert(invalidDependency.valid === false, "Invalid dependency declarations should fail validation.");
  assert(invalidDependency.issues.some((issue) => issue.code === "invalid_dependency"), "Invalid dependency declarations should be structured issues.");
});

test("Manifest System has no framework, service or runtime dependency", () => {
  const manifestFiles = listFiles("src/core/manifests");
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /from ["']lucide-react["']/,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/dashboard/,
    /@\/widgets/,
    /@\/services/,
    /@\/runtime/
  ];

  assert(manifestFiles.every((file) => !file.endsWith(".tsx")), "Manifest System should not contain TSX files.");

  for (const file of manifestFiles) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `Manifest System should not import forbidden dependency in ${file}.`);
    }
  }
});

test("Module Loader validates manifests and registers capabilities", () => {
  const { PlatformCapabilityRegistry } = load("src/core/capabilities");
  const { createManifest } = load("src/core/manifests");
  const { ModuleLoader } = load("src/core/module-loader");
  const registry = new PlatformCapabilityRegistry();
  const loader = new ModuleLoader();
  const manifest = createManifest({
    id: "module.sales-tools",
    name: "sales-tools",
    displayName: "Sales Tools",
    version: "1.0.0",
    capabilities: [
      {
        id: "command.sales-tools.create-quote",
        name: "Create Quote",
        category: "command",
        type: "command",
        permissions: [{ module: "quotes", action: "create" }]
      }
    ],
    dependencies: [{ id: "core.sales", version: "1.0.0" }],
    compatibility: { minimumPlatformVersion: "0.1.0" },
    workspaceAware: true,
    enabledByDefault: true
  });

  const result = loader.load({
    manifest,
    platformVersion: "0.1.0",
    availableDependencyIds: ["core.sales"],
    capabilityRegistry: registry
  });

  assert(result.loaded === true, "Module Loader should load valid manifests.");
  assert(result.descriptor.status === "ready", "Module Loader should return a ready descriptor.");
  assert(Object.isFrozen(result.descriptor), "Module descriptors should be immutable.");
  assert(registry.exists("command.sales-tools.create-quote"), "Module Loader should register manifest capabilities.");
});

test("Module Loader reports compatibility and dependency failures", () => {
  const { createManifest } = load("src/core/manifests");
  const { ModuleLoader } = load("src/core/module-loader");
  const loader = new ModuleLoader();
  const manifest = createManifest({
    id: "module.incompatible",
    name: "incompatible",
    version: "1.0.0",
    capabilities: [
      {
        id: "widget.incompatible",
        name: "Incompatible Widget",
        category: "widget",
        type: "widget"
      }
    ],
    dependencies: [{ id: "missing.required" }],
    compatibility: { minimumPlatformVersion: "2.0.0" }
  });

  const result = loader.load({ manifest, platformVersion: "1.0.0" });
  const codes = result.issues.map((issue) => issue.code);

  assert(result.loaded === false, "Module Loader should block incompatible modules.");
  assert(codes.includes("unsupported_platform_version"), "Module Loader should report unsupported platform versions.");
  assert(codes.includes("missing_dependency"), "Module Loader should report missing required dependencies.");
});

test("Module Loader detects duplicate modules, duplicate capabilities and circular dependencies", () => {
  const { PlatformCapabilityRegistry } = load("src/core/capabilities");
  const { createManifest } = load("src/core/manifests");
  const { ModuleLoader } = load("src/core/module-loader");
  const registry = new PlatformCapabilityRegistry();
  registry.register({
    id: "command.duplicate",
    name: "Duplicate",
    category: "command",
    type: "command"
  });
  const loader = new ModuleLoader();
  const duplicateModule = createManifest({
    id: "module.duplicate",
    name: "duplicate",
    version: "1.0.0",
    capabilities: [{ id: "command.unique", name: "Unique", category: "command", type: "command" }]
  });
  const duplicateCapability = createManifest({
    id: "module.capability-duplicate",
    name: "capability-duplicate",
    version: "1.0.0",
    capabilities: [{ id: "command.duplicate", name: "Duplicate", category: "command", type: "command" }]
  });
  const circular = createManifest({
    id: "module.circular",
    name: "circular",
    version: "1.0.0",
    capabilities: [{ id: "command.circular", name: "Circular", category: "command", type: "command" }]
  });

  const duplicateModuleResult = loader.load({ manifest: duplicateModule, loadedModuleIds: ["module.duplicate"] });
  const duplicateCapabilityResult = loader.load({ manifest: duplicateCapability, capabilityRegistry: registry });
  const circularResult = loader.load({
    manifest: circular,
    dependencyGraph: {
      "module.circular": ["module.a"],
      "module.a": ["module.circular"]
    }
  });

  assert(duplicateModuleResult.manifestIssues.some((issue) => issue.code === "duplicate_manifest_id"), "Module Loader should pass duplicate module ids through manifest validation.");
  assert(duplicateCapabilityResult.issues.some((issue) => issue.code === "capability_registration_failed"), "Module Loader should report capability registration failures.");
  assert(circularResult.issues.some((issue) => issue.code === "circular_dependency"), "Module Loader should detect circular dependencies.");
});

test("Module Loader remains deterministic and does not execute entries", () => {
  const { createManifest } = load("src/core/manifests");
  const { ModuleLoader } = load("src/core/module-loader");
  const manifest = createManifest({
    id: "module.entry-only",
    name: "entry-only",
    version: "1.0.0",
    entry: "index.js",
    capabilities: [{ id: "service.entry-only", name: "Entry Only", category: "service", type: "service" }]
  });
  const first = new ModuleLoader().load({ manifest });
  const second = new ModuleLoader().load({ manifest });

  assert(first.loaded === true && second.loaded === true, "Module Loader should deterministically prepare the same manifest.");
  assert(first.descriptor.id === second.descriptor.id, "Module descriptors should preserve stable ids.");
  assert(first.descriptor.manifest.entry === "index.js", "Module Loader should preserve entry metadata without executing it.");
});

test("Module Loader has no framework, service or runtime dependency", () => {
  const loaderFiles = listFiles("src/core/module-loader");
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /from ["']lucide-react["']/,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/dashboard/,
    /@\/widgets/,
    /@\/services/,
    /@\/runtime/
  ];

  assert(loaderFiles.every((file) => !file.endsWith(".tsx")), "Module Loader should not contain TSX files.");

  for (const file of loaderFiles) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `Module Loader should not import forbidden dependency in ${file}.`);
    }
  }
});

function createRuntimeValidationModuleDescriptor(id = "module.runtime-plugin") {
  const { PlatformCapabilityRegistry } = load("src/core/capabilities");
  const { createManifest } = load("src/core/manifests");
  const { ModuleLoader } = load("src/core/module-loader");
  const manifest = createManifest({
    id,
    name: id,
    displayName: "Runtime Plugin",
    version: "1.0.0",
    capabilities: [
      {
        id: `${id}.command`,
        name: "Runtime Command",
        category: "command",
        type: "command",
        permissions: [{ module: "dashboard", action: "view" }]
      }
    ],
    permissions: [{ module: "dashboard", action: "view" }],
    workspaceAware: true,
    enabledByDefault: false,
    metadata: { source: "runtime-validation" }
  });
  const result = new ModuleLoader().load({
    manifest,
    capabilityRegistry: new PlatformCapabilityRegistry()
  });

  assert(result.loaded === true, "Runtime validation descriptor should load successfully.");
  return result.descriptor;
}

test("Plugin Runtime registers module descriptors and exposes immutable plugin state", () => {
  const { PluginRuntime } = load("src/runtime/plugins");
  const runtime = new PluginRuntime({ now: () => "2026-07-01T10:00:00.000Z" });
  const moduleDescriptor = createRuntimeValidationModuleDescriptor();
  const registration = runtime.register(moduleDescriptor);
  const state = runtime.getState();

  assert(registration.status === "registered", "Plugin Runtime should register plugins from module descriptors.");
  assert(runtime.find(moduleDescriptor.id).id === moduleDescriptor.id, "Plugin Runtime should find registered plugins.");
  assert(state.plugins.length === 1, "Plugin Runtime state should include registered plugins.");
  assert(Object.isFrozen(registration.descriptor), "Plugin descriptors should be immutable.");
  assert(Object.isFrozen(state), "Plugin Runtime state should be immutable.");
  assert(registration.descriptor.permissionDecisions.every((decision) => decision.allowed), "Plugin Runtime should prepare permission decisions.");
});

test("Plugin Runtime rejects duplicates and supports enable disable lifecycle", () => {
  const { PluginRuntime } = load("src/runtime/plugins");
  const runtime = new PluginRuntime({ now: () => "2026-07-01T10:00:00.000Z" });
  const moduleDescriptor = createRuntimeValidationModuleDescriptor("module.lifecycle-plugin");
  let duplicateRejected = false;

  runtime.register(moduleDescriptor);
  try {
    runtime.register(moduleDescriptor);
  } catch {
    duplicateRejected = true;
  }

  const loaded = runtime.markLoaded(moduleDescriptor.id);
  const enabled = runtime.enable(moduleDescriptor.id);
  const isEnabledAfterEnable = runtime.isEnabled(moduleDescriptor.id);
  const disabled = runtime.disable(moduleDescriptor.id);

  assert(duplicateRejected, "Plugin Runtime should reject duplicate plugin ids.");
  assert(loaded.status === "loaded", "Plugin Runtime should support loaded lifecycle state.");
  assert(enabled.status === "enabled", "Plugin Runtime should support enabled lifecycle state.");
  assert(isEnabledAfterEnable, "Plugin Runtime should report enabled plugins.");
  assert(disabled.status === "disabled", "Plugin Runtime should support disabled lifecycle state.");
  assert(!runtime.isEnabled(moduleDescriptor.id), "Plugin Runtime should report disabled plugins.");
});

test("Plugin Runtime remains deterministic and supports removal", () => {
  const { PluginRuntime } = load("src/runtime/plugins");
  const runtime = new PluginRuntime({ now: () => "2026-07-01T10:00:00.000Z" });
  const first = createRuntimeValidationModuleDescriptor("module.z-plugin");
  const second = createRuntimeValidationModuleDescriptor("module.a-plugin");

  runtime.register(first);
  runtime.register(second);

  const ids = runtime.list().map((plugin) => plugin.id);
  const removed = runtime.remove("module.z-plugin");

  assert(ids.join(",") === "module.a-plugin,module.z-plugin", "Plugin Runtime should list plugins deterministically by id.");
  assert(removed.status === "unloaded", "Plugin Runtime removal should return an unloaded descriptor.");
  assert(!runtime.find("module.z-plugin"), "Removed plugins should no longer be registered.");
});

test("Plugin Runtime has no UI, database or dynamic import dependency", () => {
  const pluginFiles = listFiles("src/runtime/plugins");
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /from ["']lucide-react["']/,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/dashboard/,
    /@\/app/,
    /@\/lib\/prisma/,
    /import\(/,
    /fetch\(/
  ];

  assert(pluginFiles.every((file) => !file.endsWith(".tsx")), "Plugin Runtime should not contain TSX files.");

  for (const file of pluginFiles) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `Plugin Runtime should not import forbidden dependency in ${file}.`);
    }
  }
});

test("CRM Module Foundation exposes manifest capabilities permissions navigation and routes", () => {
  const { crmModule } = load("src/modules/crm");
  const capabilityIds = crmModule.capabilities.map((capability) => capability.id);
  const permissionKeys = crmModule.permissions.map((permission) => `${permission.module}.${permission.action}`);

  assert(crmModule.id === "crm", "CRM module should expose a stable module id.");
  assert(crmModule.manifest.id === crmModule.id, "CRM manifest should match the module id.");
  assert(capabilityIds.includes("crm.customer.read"), "CRM module should expose customer read capability.");
  assert(capabilityIds.includes("crm.note.write"), "CRM module should expose note write capability.");
  assert(permissionKeys.includes("crm.customer.read"), "CRM module should expose customer read permission.");
  assert(permissionKeys.includes("crm.note.write"), "CRM module should expose note write permission.");
  const crmNavigationIds = crmModule.navigation.children.map((item) => item.id);
  assert(crmNavigationIds.length === 5, "CRM navigation should expose five visible CRM child entries while Timeline remains hidden.");
  assert(crmNavigationIds.includes("crm.companies"), "CRM navigation should expose Companies as the commercial account workspace.");
  assert(crmNavigationIds.includes("crm.contacts"), "CRM navigation should expose Contacts as company-related people.");
  assert(!crmNavigationIds.includes("crm.activities"), "CRM navigation should hide Timeline until a real persisted event source exists.");
  assert(!crmNavigationIds.includes("crm.customers"), "CRM navigation should not expose Customers as a standalone visible workspace.");
  assert(crmModule.navigation.metadata.sidebarLabel === "Vue d'ensemble", "CRM navigation should expose a non-duplicated sidebar root label.");
  assert(!crmModule.navigation.children.some((item) => item.id === "crm.opportunities"), "CRM navigation should not duplicate the Sales pipeline entry.");
  assert(crmModule.routes.every((route) => route.lazy), "CRM routes should be lazy-load-ready placeholders.");
});

test("Sales Navigation exposes only Alpha-ready commercial workspaces", () => {
  const { salesModule } = load("src/modules/sales");
  const salesNavigationIds = salesModule.navigation.children.map((item) => item.id);

  assert(!salesNavigationIds.includes("sales.pipeline"), "Sales navigation should hide Pipeline until opportunities are persisted.");
  assert(salesNavigationIds[0] === "sales.quotes", "Sales navigation should start with Quotes for Alpha.");
  assert(salesNavigationIds.includes("sales.invoices"), "Sales navigation should expose Invoices.");
  assert(salesNavigationIds.includes("sales.payments"), "Sales navigation should expose Payments.");
});

test("CRM Module Foundation remains platform-consumer only", () => {
  const crmFiles = listFiles("src/modules/crm").filter((file) => !file.includes("/customers/") && !file.includes("/companies/") && !file.includes("/contacts/") && !file.includes("/activities/") && !file.includes("/meetings/") && !file.includes("/tasks/") && !file.includes("/notes/") && !file.includes("/opportunities/") && !file.includes("/home/"));
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/runtime\/permissions/,
    /@\/runtime\/plugins/,
    /@\/lib\/prisma/,
    /fetch\(/
  ];

  assert(crmFiles.every((file) => !file.endsWith(".tsx")), "CRM foundation should not contain UI files.");

  for (const file of crmFiles.filter((item) => item.endsWith(".ts"))) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `CRM module foundation should not import forbidden dependency in ${file}.`);
    }
  }
});

test("CRM Customers Foundation creates validates lists and isolates workspaces", () => {
  const { CustomerService } = load("src/modules/crm/customers");
  const service = new CustomerService({
    now: () => "2026-07-01T12:00:00.000Z",
    createId: (() => {
      let index = 0;
      return () => `cust_${index += 1}`;
    })()
  });

  const first = service.createCustomer({
    workspaceId: "workspace-a",
    displayName: "ABC SARL",
    companyName: "ABC SARL",
    email: "CONTACT@ABC.MA",
    phone: "+212 6 00 00 00 00",
    type: "company",
    source: "manual",
    tags: ["VIP", " vip "],
    createdBy: "user-admin"
  });
  service.createCustomer({
    workspaceId: "workspace-b",
    displayName: "Other Workspace",
    createdBy: "user-admin"
  });
  const list = service.listCustomers({ workspaceId: "workspace-a" });

  assert(first.validation.valid === true, "Customer creation should return a valid structured result.");
  assert(first.customer.email === "contact@abc.ma", "Customer creation should normalize email values.");
  assert(first.customer.tags.length === 1 && first.customer.tags[0] === "vip", "Customer creation should normalize tags.");
  assert(Object.isFrozen(first.customer), "Created customers should be immutable.");
  assert(list.customers.length === 1, "Customer listing should stay scoped to the requested workspace.");
});

test("CRM Customers Foundation validates invalid input and permission denial", () => {
  const { CustomerService, validateCreateCustomerInput } = load("src/modules/crm/customers");
  const invalid = validateCreateCustomerInput({
    workspaceId: "",
    displayName: "",
    email: "invalid-email",
    phone: "x",
    createdBy: ""
  });
  const denied = new CustomerService().createCustomer({
    workspaceId: "workspace-a",
    displayName: "Denied Customer",
    createdBy: "user-admin",
    permission: { allowed: false, reason: "denied_missing_permission", permission: { module: "crm.customer", action: "write" }, resource: { id: "crm.customer", type: "service" } }
  });
  const codes = invalid.issues.map((issue) => issue.code);

  assert(invalid.valid === false, "Invalid customer input should fail validation.");
  assert(codes.includes("missing_display_name"), "Customer validation should require display name.");
  assert(codes.includes("missing_workspace"), "Customer validation should require workspace scope.");
  assert(codes.includes("invalid_email"), "Customer validation should validate email format.");
  assert(codes.includes("invalid_phone"), "Customer validation should validate phone format.");
  assert(denied.validation.issues.some((issue) => issue.code === "permission_denied"), "Customer validation should accept permission decisions.");
  assert(!denied.customer, "Permission denied customer creation should not create a customer.");
});

test("CRM Customers Foundation supports update archive search and sorting", () => {
  const { CustomerService } = load("src/modules/crm/customers");
  const service = new CustomerService({
    now: () => "2026-07-01T12:00:00.000Z",
    createId: (() => {
      let index = 0;
      return () => `cust_${index += 1}`;
    })()
  });
  const zed = service.createCustomer({ workspaceId: "workspace-a", displayName: "Zed Client", createdBy: "user-admin" }).customer;
  const alpha = service.createCustomer({ workspaceId: "workspace-a", displayName: "Alpha Client", source: "referral", createdBy: "user-admin" }).customer;

  const updated = service.updateCustomer({
    id: zed.id,
    workspaceId: "workspace-a",
    displayName: "Zed Updated",
    status: "active",
    updatedBy: "user-admin"
  });
  const search = service.searchCustomers({ workspaceId: "workspace-a", query: "alpha" });
  const sorted = service.listCustomers({ workspaceId: "workspace-a" }, { field: "displayName", direction: "asc" });
  const archived = service.archiveCustomer(alpha.id, "workspace-a", "user-admin");
  const visibleAfterArchive = service.listCustomers({ workspaceId: "workspace-a" });

  assert(updated.customer.displayName === "Zed Updated", "Customer update should update mutable fields.");
  assert(search.customers.length === 1 && search.customers[0].id === alpha.id, "Customer search should match normalized customer fields.");
  assert(sorted.customers[0].displayName === "Alpha Client", "Customer listing should support deterministic sorting.");
  assert(archived.customer.status === "archived", "Customer archive should set archived status.");
  assert(visibleAfterArchive.customers.every((customer) => customer.status !== "archived"), "Archived customers should be hidden by default.");
});

test("CRM Customers Foundation has no UI Prisma API or runtime dependency", () => {
  const customerFiles = listFiles("src/modules/crm/customers").filter((file) => !file.includes("/ui/"));
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/app/,
    /@\/lib\/prisma/,
    /@\/runtime\/plugins/,
    /fetch\(/
  ];

  assert(customerFiles.every((file) => !file.endsWith(".tsx")), "CRM Customers foundation should not contain UI files.");

  for (const file of customerFiles.filter((item) => item.endsWith(".ts"))) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `CRM Customers foundation should not import forbidden dependency in ${file}.`);
    }
  }
});

test("CRM Shared Foundation exposes reusable search filter sort and pagination helpers", () => {
  const {
    filterCrmEntities,
    paginateCrmItems,
    searchCrmEntities,
    sortCrmEntities
  } = load("src/modules/crm/shared");
  const entities = [
    {
      id: "entity-2",
      workspaceId: "workspace-a",
      displayName: "Zed Company",
      status: "active",
      ownerId: "user-sales",
      tags: ["vip"],
      archived: false,
      createdAt: "2026-07-02T00:00:00.000Z",
      updatedAt: "2026-07-02T00:00:00.000Z"
    },
    {
      id: "entity-1",
      workspaceId: "workspace-a",
      displayName: "Alpha Customer",
      status: "lead",
      ownerId: "user-sales",
      tags: ["new"],
      archived: false,
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z"
    },
    {
      id: "entity-3",
      workspaceId: "workspace-b",
      displayName: "Other Workspace",
      status: "active",
      ownerId: "user-other",
      tags: [],
      archived: false,
      createdAt: "2026-07-03T00:00:00.000Z",
      updatedAt: "2026-07-03T00:00:00.000Z"
    }
  ];

  const filtered = filterCrmEntities(entities, { workspaceId: "workspace-a", ownerId: "user-sales", archived: false });
  const sorted = sortCrmEntities(filtered, [{ field: "displayName", direction: "asc" }]);
  const searched = searchCrmEntities(entities, { query: "alpha", fields: ["displayName"] });
  const page = paginateCrmItems(sorted, { page: 1, pageSize: 1 });

  assert(filtered.length === 2, "CRM shared filters should support workspace and owner filters.");
  assert(sorted[0].displayName === "Alpha Customer", "CRM shared sorting should support stable field sorting.");
  assert(searched.length === 1 && searched[0].entity.id === "entity-1", "CRM shared search should return ranked multi-field matches.");
  assert(page.items.length === 1 && page.pagination.hasNextPage, "CRM shared pagination should expose page metadata.");
});

test("CRM Shared Foundation exposes immutable errors events commands and utility contracts", () => {
  const {
    areCrmValuesEqual,
    createCrmCommand,
    createCrmDisplayLabel,
    crmErrors,
    crmEventContracts,
    crmEventNames,
    normalizeCrmString,
    normalizeCrmTags
  } = load("src/modules/crm/shared");
  const error = crmErrors.permissionDenied();
  const command = createCrmCommand({
    id: "command-1",
    type: "create",
    entityType: "customer",
    workspaceId: "workspace-a",
    actorId: "user-admin",
    payload: { displayName: "ABC SARL" }
  });

  assert(normalizeCrmString(" École  ABC ") === "ecole  abc", "CRM shared utils should normalize accents and casing.");
  assert(normalizeCrmTags(["VIP", " vip "]).length === 1, "CRM shared utils should normalize and deduplicate tags.");
  assert(createCrmDisplayLabel("ABC SARL", "", "Mohammedia") === "ABC SARL - Mohammedia", "CRM shared utils should create clean labels.");
  assert(areCrmValuesEqual({ b: 2, a: 1 }, { a: 1, b: 2 }), "CRM shared utils should support stable equality checks.");
  assert(error.code === "permission_denied" && Object.isFrozen(error), "CRM shared errors should be typed and immutable.");
  assert(crmEventNames.customerCreated === "crm.customer.created", "CRM shared events should expose stable event names.");
  assert(crmEventContracts.some((event) => event.name === crmEventNames.customerArchived), "CRM shared events should expose contracts.");
  assert(command.entityType === "customer" && Object.isFrozen(command.payload), "CRM shared commands should be immutable DTOs.");
});

test("CRM Shared Foundation has no UI Prisma API or runtime dependency", () => {
  const sharedFiles = listFiles("src/modules/crm/shared");
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/app/,
    /@\/lib\/prisma/,
    /@\/runtime\//,
    /fetch\(/
  ];

  assert(sharedFiles.every((file) => !file.endsWith(".tsx")), "CRM Shared foundation should not contain UI files.");

  for (const file of sharedFiles.filter((item) => item.endsWith(".ts"))) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `CRM Shared foundation should not import forbidden dependency in ${file}.`);
    }
  }
});

test("CRM Companies Foundation creates validates lists and isolates workspaces", () => {
  const { CompanyService } = load("src/modules/crm/companies");
  const service = new CompanyService({
    now: () => "2026-07-01T12:00:00.000Z",
    createId: (() => {
      let index = 0;
      return () => `comp_${index += 1}`;
    })()
  });

  const first = service.createCompany({
    workspaceId: "workspace-a",
    legalName: "ABC SARL",
    displayName: "ABC",
    registrationNumber: "RC-12345",
    taxNumber: "IF-54321",
    industry: "technology",
    website: "abc.ma",
    email: "CONTACT@ABC.MA",
    phone: "+212 6 00 00 00 00",
    city: "Casablanca",
    tags: ["VIP", " vip "],
    createdBy: "user-admin"
  });
  service.createCompany({
    workspaceId: "workspace-b",
    legalName: "Other Workspace SARL",
    createdBy: "user-admin"
  });
  const list = service.listCompanies({ workspaceId: "workspace-a" });

  assert(first.validation.valid === true, "Company creation should return a valid structured result.");
  assert(first.company.email === "contact@abc.ma", "Company creation should normalize email values.");
  assert(first.company.website === "https://abc.ma", "Company creation should normalize website values.");
  assert(first.company.tags.length === 1 && first.company.tags[0] === "vip", "Company creation should normalize tags.");
  assert(Object.isFrozen(first.company), "Created companies should be immutable.");
  assert(list.companies.length === 1, "Company listing should stay scoped to the requested workspace.");
});

test("CRM Companies Foundation validates invalid input and permission denial", () => {
  const { CompanyService, validateCreateCompanyInput } = load("src/modules/crm/companies");
  const invalid = validateCreateCompanyInput({
    workspaceId: "",
    legalName: "",
    email: "invalid-email",
    website: "not a site",
    phone: "x",
    createdBy: ""
  });
  const denied = new CompanyService().createCompany({
    workspaceId: "workspace-a",
    legalName: "Denied Company",
    createdBy: "user-admin",
    permission: { allowed: false, reason: "denied_missing_permission", permission: { module: "crm.company", action: "write" }, resource: { id: "crm.company", type: "service" } }
  });
  const codes = invalid.issues.map((issue) => issue.code);

  assert(invalid.valid === false, "Invalid company input should fail validation.");
  assert(codes.includes("missing_company_name"), "Company validation should require company name.");
  assert(codes.includes("missing_workspace"), "Company validation should require workspace scope.");
  assert(codes.includes("invalid_email"), "Company validation should validate email format.");
  assert(codes.includes("invalid_website"), "Company validation should validate website format.");
  assert(codes.includes("invalid_phone"), "Company validation should validate phone format.");
  assert(denied.validation.issues.some((issue) => issue.code === "permission_denied"), "Company validation should accept permission decisions.");
  assert(!denied.company, "Permission denied company creation should not create a company.");
});

test("CRM Companies Foundation supports update archive search filtering and sorting", () => {
  const { CompanyService } = load("src/modules/crm/companies");
  const service = new CompanyService({
    now: () => "2026-07-01T12:00:00.000Z",
    createId: (() => {
      let index = 0;
      return () => `comp_${index += 1}`;
    })()
  });
  const zed = service.createCompany({ workspaceId: "workspace-a", legalName: "Zed Company", industry: "retail", city: "Rabat", createdBy: "user-admin" }).company;
  const alpha = service.createCompany({ workspaceId: "workspace-a", legalName: "Alpha Company", industry: "education", city: "Casablanca", tags: ["school"], createdBy: "user-admin" }).company;

  const updated = service.updateCompany({
    id: zed.id,
    workspaceId: "workspace-a",
    displayName: "Zed Updated",
    status: "active",
    updatedBy: "user-admin"
  });
  const search = service.searchCompanies({ workspaceId: "workspace-a", query: "alpha" });
  const filtered = service.listCompanies({ workspaceId: "workspace-a", industry: "education", tags: ["school"] });
  const sorted = service.listCompanies({ workspaceId: "workspace-a" }, { field: "displayName", direction: "asc" });
  const archived = service.archiveCompany(alpha.id, "workspace-a", "user-admin");
  const visibleAfterArchive = service.listCompanies({ workspaceId: "workspace-a" });

  assert(updated.company.displayName === "Zed Updated", "Company update should update mutable fields.");
  assert(search.companies.length === 1 && search.companies[0].id === alpha.id, "Company search should match normalized company fields.");
  assert(filtered.companies.length === 1 && filtered.companies[0].id === alpha.id, "Company filtering should use CRM shared filters.");
  assert(sorted.companies[0].displayName === "Alpha Company", "Company listing should support deterministic sorting.");
  assert(archived.company.status === "archived", "Company archive should set archived status.");
  assert(visibleAfterArchive.companies.every((company) => company.status !== "archived"), "Archived companies should be hidden by default.");
});

test("CRM Companies Foundation has no UI Prisma API or runtime dependency", () => {
  const companyFiles = listFiles("src/modules/crm/companies").filter((file) => !file.includes("/ui/"));
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/app/,
    /@\/lib\/prisma/,
    /@\/runtime\/plugins/,
    /fetch\(/
  ];

  assert(companyFiles.every((file) => !file.endsWith(".tsx")), "CRM Companies foundation should not contain UI files.");

  for (const file of companyFiles.filter((item) => item.endsWith(".ts"))) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `CRM Companies foundation should not import forbidden dependency in ${file}.`);
    }
  }
});

test("CRM Contacts Foundation creates validates lists and isolates workspaces and companies", () => {
  const { ContactService } = load("src/modules/crm/contacts");
  const service = new ContactService({
    now: () => "2026-07-01T12:00:00.000Z",
    createId: (() => {
      let index = 0;
      return () => `cont_${index += 1}`;
    })()
  });

  const first = service.createContact({
    workspaceId: "workspace-a",
    companyId: "company-a",
    firstName: "Sara",
    lastName: "Amrani",
    jobTitle: "Directrice achats",
    email: "SARA@ABC.MA",
    mobilePhone: "+212 6 00 00 00 00",
    tags: ["VIP", " vip "],
    isPrimaryContact: true,
    isDecisionMaker: true,
    createdBy: "user-admin"
  });
  service.createContact({
    workspaceId: "workspace-a",
    companyId: "company-b",
    firstName: "Other",
    lastName: "Company",
    createdBy: "user-admin"
  });
  service.createContact({
    workspaceId: "workspace-b",
    companyId: "company-a",
    firstName: "Other",
    lastName: "Workspace",
    createdBy: "user-admin"
  });

  const workspaceList = service.listContacts({ workspaceId: "workspace-a" });
  const companyList = service.getContactsByCompany("company-a", "workspace-a");

  assert(first.validation.valid === true, "Contact creation should return a valid structured result.");
  assert(first.contact.email === "sara@abc.ma", "Contact creation should normalize email values.");
  assert(first.contact.fullName === "Sara Amrani", "Contact creation should derive full name.");
  assert(first.contact.tags.length === 1 && first.contact.tags[0] === "vip", "Contact creation should normalize tags.");
  assert(Object.isFrozen(first.contact), "Created contacts should be immutable.");
  assert(workspaceList.contacts.length === 2, "Contact listing should stay scoped to the requested workspace.");
  assert(companyList.contacts.length === 1 && companyList.contacts[0].companyId === "company-a", "Company contact listing should stay scoped to one company.");
});

test("CRM Contacts Foundation validates invalid input and permission denial", () => {
  const { ContactService, validateCreateContactInput } = load("src/modules/crm/contacts");
  const invalid = validateCreateContactInput({
    workspaceId: "",
    companyId: "",
    firstName: "",
    lastName: "",
    email: "invalid-email",
    mobilePhone: "x",
    linkedin: "not-linkedin",
    createdBy: ""
  });
  const denied = new ContactService().createContact({
    workspaceId: "workspace-a",
    companyId: "company-a",
    firstName: "Denied",
    lastName: "Contact",
    createdBy: "user-admin",
    permission: { allowed: false, reason: "denied_missing_permission", permission: { module: "crm.contact", action: "write" }, resource: { id: "crm.contact", type: "service" } }
  });
  const codes = invalid.issues.map((issue) => issue.code);

  assert(invalid.valid === false, "Invalid contact input should fail validation.");
  assert(codes.includes("missing_workspace"), "Contact validation should require workspace scope.");
  assert(codes.includes("missing_company"), "Contact validation should require company relationship.");
  assert(codes.includes("missing_first_name"), "Contact validation should require first name.");
  assert(codes.includes("missing_last_name"), "Contact validation should require last name.");
  assert(codes.includes("invalid_email"), "Contact validation should validate email format.");
  assert(codes.includes("invalid_phone"), "Contact validation should validate phone format.");
  assert(codes.includes("invalid_linkedin"), "Contact validation should validate LinkedIn profile format.");
  assert(denied.validation.issues.some((issue) => issue.code === "permission_denied"), "Contact validation should accept permission decisions.");
  assert(!denied.contact, "Permission denied contact creation should not create a contact.");
});

test("CRM Contacts Foundation supports update archive search filtering and sorting", () => {
  const { ContactService } = load("src/modules/crm/contacts");
  const service = new ContactService({
    now: () => "2026-07-01T12:00:00.000Z",
    createId: (() => {
      let index = 0;
      return () => `cont_${index += 1}`;
    })()
  });
  const zed = service.createContact({ workspaceId: "workspace-a", companyId: "company-a", firstName: "Zed", lastName: "Contact", department: "Sales", createdBy: "user-admin" }).contact;
  const alpha = service.createContact({ workspaceId: "workspace-a", companyId: "company-a", firstName: "Alpha", lastName: "Contact", department: "Finance", tags: ["decision"], isDecisionMaker: true, createdBy: "user-admin" }).contact;

  const updated = service.updateContact({
    id: zed.id,
    workspaceId: "workspace-a",
    firstName: "Zed Updated",
    status: "active",
    updatedBy: "user-admin"
  });
  const search = service.searchContacts({ workspaceId: "workspace-a", companyId: "company-a", query: "alpha" });
  const filtered = service.listContacts({ workspaceId: "workspace-a", companyId: "company-a", department: "Finance", tags: ["decision"], isDecisionMaker: true });
  const sorted = service.listContacts({ workspaceId: "workspace-a", companyId: "company-a" }, { field: "fullName", direction: "asc" });
  const archived = service.archiveContact(alpha.id, "workspace-a", "user-admin");
  const visibleAfterArchive = service.listContacts({ workspaceId: "workspace-a", companyId: "company-a" });

  assert(updated.contact.firstName === "Zed Updated", "Contact update should update mutable fields.");
  assert(updated.contact.fullName === "Zed Updated Contact", "Contact update should recalculate full name.");
  assert(search.contacts.length === 1 && search.contacts[0].id === alpha.id, "Contact search should match normalized contact fields.");
  assert(filtered.contacts.length === 1 && filtered.contacts[0].id === alpha.id, "Contact filtering should use CRM shared filters and contact fields.");
  assert(sorted.contacts[0].fullName === "Alpha Contact", "Contact listing should support deterministic sorting.");
  assert(archived.contact.status === "archived", "Contact archive should set archived status.");
  assert(visibleAfterArchive.contacts.every((contact) => contact.status !== "archived"), "Archived contacts should be hidden by default.");
});

test("CRM Contacts Foundation has no UI Prisma API or runtime dependency", () => {
  const contactFiles = listFiles("src/modules/crm/contacts").filter((file) => !file.includes("/ui/"));
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/app/,
    /@\/lib\/prisma/,
    /@\/runtime\/plugins/,
    /fetch\(/
  ];

  assert(contactFiles.every((file) => !file.endsWith(".tsx")), "CRM Contacts foundation should not contain UI files.");

  for (const file of contactFiles.filter((item) => item.endsWith(".ts"))) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `CRM Contacts foundation should not import forbidden dependency in ${file}.`);
    }
  }
});

test("CRM Activities Foundation creates validates lists and isolates workspaces companies and contacts", () => {
  const { ActivityService } = load("src/modules/crm/activities");
  const service = new ActivityService({
    now: () => "2026-07-01T12:00:00.000Z",
    createId: (() => {
      let index = 0;
      return () => `act_${index += 1}`;
    })()
  });

  const first = service.createActivity({
    workspaceId: "workspace-a",
    companyId: "company-a",
    contactId: "contact-a",
    type: "meeting",
    title: "Discovery meeting",
    description: "Initial CRM discussion",
    performedBy: "user-admin",
    tags: ["VIP", " vip "]
  });
  service.createActivity({ workspaceId: "workspace-a", companyId: "company-b", type: "call", title: "Other company", performedBy: "user-admin" });
  service.createActivity({ workspaceId: "workspace-b", companyId: "company-a", type: "email", title: "Other workspace", performedBy: "user-admin" });

  const workspaceList = service.listActivities({ workspaceId: "workspace-a" });
  const companyList = service.getActivitiesByCompany("company-a", "workspace-a");
  const contactList = service.getActivitiesByContact("contact-a", "workspace-a");

  assert(first.validation.valid === true, "Activity creation should return a valid structured result.");
  assert(first.activity.title === "Discovery meeting", "Activity creation should normalize title values.");
  assert(first.activity.tags.length === 1 && first.activity.tags[0] === "vip", "Activity creation should normalize tags.");
  assert(Object.isFrozen(first.activity), "Created activities should be immutable.");
  assert(workspaceList.activities.length === 2, "Activity listing should stay scoped to the requested workspace.");
  assert(companyList.activities.length === 1 && companyList.activities[0].companyId === "company-a", "Company activity listing should stay scoped to one company.");
  assert(contactList.activities.length === 1 && contactList.activities[0].contactId === "contact-a", "Contact activity listing should stay scoped to one contact.");
});

test("CRM Activities Foundation validates invalid input and permission denial", () => {
  const { ActivityService, validateCreateActivityInput } = load("src/modules/crm/activities");
  const invalid = validateCreateActivityInput({
    workspaceId: "",
    companyId: "",
    type: "meeting",
    title: "",
    performedBy: "",
    performedAt: "not-a-date"
  });
  const denied = new ActivityService().createActivity({
    workspaceId: "workspace-a",
    companyId: "company-a",
    type: "call",
    title: "Denied Activity",
    performedBy: "user-admin",
    permission: { allowed: false, reason: "denied_missing_permission", permission: { module: "crm.activity", action: "write" }, resource: { id: "crm.activity", type: "service" } }
  });
  const codes = invalid.issues.map((issue) => issue.code);

  assert(invalid.valid === false, "Invalid activity input should fail validation.");
  assert(codes.includes("missing_workspace"), "Activity validation should require workspace scope.");
  assert(codes.includes("missing_company"), "Activity validation should require company relationship.");
  assert(codes.includes("missing_title"), "Activity validation should require title.");
  assert(codes.includes("missing_user"), "Activity validation should require performer.");
  assert(codes.includes("invalid_date"), "Activity validation should validate performed date.");
  assert(denied.validation.issues.some((issue) => issue.code === "permission_denied"), "Activity validation should accept permission decisions.");
  assert(!denied.activity, "Permission denied activity creation should not create an activity.");
});

test("CRM Activities Foundation supports update archive search filtering and sorting", () => {
  const { ActivityService } = load("src/modules/crm/activities");
  const service = new ActivityService({
    now: () => "2026-07-01T12:00:00.000Z",
    createId: (() => {
      let index = 0;
      return () => `act_${index += 1}`;
    })()
  });
  const zed = service.createActivity({ workspaceId: "workspace-a", companyId: "company-a", type: "call", title: "Zed Call", priority: "normal", performedBy: "user-admin", performedAt: "2026-07-01T10:00:00.000Z" }).activity;
  const alpha = service.createActivity({ workspaceId: "workspace-a", companyId: "company-a", contactId: "contact-a", type: "meeting", title: "Alpha Meeting", priority: "high", tags: ["important"], performedBy: "user-admin", performedAt: "2026-07-01T09:00:00.000Z" }).activity;

  const updated = service.updateActivity({ id: zed.id, workspaceId: "workspace-a", title: "Zed Updated", priority: "critical" });
  const search = service.searchActivities({ workspaceId: "workspace-a", companyId: "company-a", query: "alpha" });
  const filtered = service.listActivities({ workspaceId: "workspace-a", companyId: "company-a", contactId: "contact-a", type: "meeting", priority: "high", tags: ["important"] });
  const sorted = service.listActivities({ workspaceId: "workspace-a", companyId: "company-a" }, { field: "performedAt", direction: "asc" });
  const archived = service.archiveActivity(alpha.id, "workspace-a");
  const visibleAfterArchive = service.listActivities({ workspaceId: "workspace-a", companyId: "company-a" });

  assert(updated.activity.title === "Zed Updated", "Activity update should update mutable fields.");
  assert(search.activities.length === 1 && search.activities[0].id === alpha.id, "Activity search should match normalized activity fields.");
  assert(filtered.activities.length === 1 && filtered.activities[0].id === alpha.id, "Activity filtering should use CRM shared filters and activity fields.");
  assert(sorted.activities[0].title === "Alpha Meeting", "Activity listing should support deterministic sorting.");
  assert(archived.activity.status === "archived", "Activity archive should set archived status.");
  assert(visibleAfterArchive.activities.every((activity) => activity.status !== "archived"), "Archived activities should be hidden by default.");
});

test("CRM Activities Foundation has no UI Prisma API or runtime dependency", () => {
  const activityFiles = listFiles("src/modules/crm/activities").filter((file) => !file.includes("/ui/"));
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/app/,
    /@\/lib\/prisma/,
    /@\/runtime\/plugins/,
    /fetch\(/
  ];

  assert(activityFiles.every((file) => !file.endsWith(".tsx")), "CRM Activities foundation should not contain UI files.");

  for (const file of activityFiles.filter((item) => item.endsWith(".ts"))) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `CRM Activities foundation should not import forbidden dependency in ${file}.`);
    }
  }
});

test("CRM Meetings Foundation creates validates lists and isolates workspaces companies and contacts", () => {
  const { MeetingService } = load("src/modules/crm/meetings");
  let preparedActivity;
  const service = new MeetingService({
    now: () => "2026-07-01T12:00:00.000Z",
    createId: (() => {
      let index = 0;
      return () => `meet_${index += 1}`;
    })(),
    createActivity: (input) => {
      preparedActivity = input;
      return undefined;
    }
  });

  const first = service.createMeeting({
    workspaceId: "workspace-a",
    companyId: "company-a",
    contactIds: ["contact-a", "contact-a"],
    title: " Discovery meeting ",
    startAt: "2026-07-05T09:00:00.000Z",
    endAt: "2026-07-05T10:00:00.000Z",
    organizerId: "user-admin",
    tags: ["VIP", " vip "]
  });
  service.createMeeting({ workspaceId: "workspace-a", companyId: "company-b", contactIds: ["contact-b"], title: "Other company", startAt: "2026-07-06T09:00:00.000Z", endAt: "2026-07-06T10:00:00.000Z", organizerId: "user-admin" });
  service.createMeeting({ workspaceId: "workspace-b", companyId: "company-a", contactIds: ["contact-a"], title: "Other workspace", startAt: "2026-07-07T09:00:00.000Z", endAt: "2026-07-07T10:00:00.000Z", organizerId: "user-admin" });

  const workspaceList = service.listMeetings({ workspaceId: "workspace-a" });
  const companyList = service.getMeetingsByCompany("company-a", "workspace-a");
  const contactList = service.getMeetingsByContact("contact-a", "workspace-a");

  assert(first.validation.valid === true, "Meeting creation should return a valid structured result.");
  assert(first.meeting.title === "Discovery meeting", "Meeting creation should normalize title values.");
  assert(first.meeting.contactIds.length === 1, "Meeting creation should normalize duplicate contact ids.");
  assert(first.meeting.tags.length === 1 && first.meeting.tags[0] === "vip", "Meeting creation should normalize tags.");
  assert(Object.isFrozen(first.meeting), "Created meetings should be immutable.");
  assert(preparedActivity?.type === "meeting", "Meeting creation should prepare a meeting activity input.");
  assert(workspaceList.meetings.length === 2, "Meeting listing should stay scoped to the requested workspace.");
  assert(companyList.meetings.length === 1 && companyList.meetings[0].companyId === "company-a", "Company meeting listing should stay scoped to one company.");
  assert(contactList.meetings.length === 1 && contactList.meetings[0].contactIds.includes("contact-a"), "Contact meeting listing should stay scoped to one contact.");
});

test("CRM Meetings Foundation validates invalid input and permission denial", () => {
  const { MeetingService, validateCreateMeetingInput } = load("src/modules/crm/meetings");
  const invalid = validateCreateMeetingInput({
    workspaceId: "",
    companyId: "",
    contactIds: [],
    title: "",
    startAt: "not-a-date",
    endAt: "2026-07-01T08:00:00.000Z",
    organizerId: ""
  });
  const denied = new MeetingService().createMeeting({
    workspaceId: "workspace-a",
    companyId: "company-a",
    contactIds: ["contact-a"],
    title: "Denied Meeting",
    startAt: "2026-07-01T09:00:00.000Z",
    endAt: "2026-07-01T10:00:00.000Z",
    organizerId: "user-admin",
    permission: { allowed: false, reason: "denied_missing_permission", permission: { module: "crm.meeting", action: "write" }, resource: { id: "crm.meeting", type: "service" } }
  });
  const codes = invalid.issues.map((issue) => issue.code);

  assert(invalid.valid === false, "Invalid meeting input should fail validation.");
  assert(codes.includes("missing_workspace"), "Meeting validation should require workspace scope.");
  assert(codes.includes("missing_company"), "Meeting validation should require company relationship.");
  assert(codes.includes("missing_contact"), "Meeting validation should require at least one contact.");
  assert(codes.includes("missing_title"), "Meeting validation should require title.");
  assert(codes.includes("missing_organizer"), "Meeting validation should require organizer.");
  assert(codes.includes("invalid_start_date"), "Meeting validation should validate start date.");
  assert(denied.validation.issues.some((issue) => issue.code === "permission_denied"), "Meeting validation should accept permission decisions.");
  assert(!denied.meeting, "Permission denied meeting creation should not create a meeting.");
});

test("CRM Meetings Foundation supports update cancel complete search filtering and sorting", () => {
  const { MeetingService } = load("src/modules/crm/meetings");
  const service = new MeetingService({
    now: () => "2026-07-01T12:00:00.000Z",
    createId: (() => {
      let index = 0;
      return () => `meet_${index += 1}`;
    })()
  });
  const zed = service.createMeeting({ workspaceId: "workspace-a", companyId: "company-a", contactIds: ["contact-a"], title: "Zed Meeting", meetingType: "online", startAt: "2026-07-05T10:00:00.000Z", endAt: "2026-07-05T11:00:00.000Z", organizerId: "user-admin" }).meeting;
  const alpha = service.createMeeting({ workspaceId: "workspace-a", companyId: "company-a", contactIds: ["contact-a"], title: "Alpha Demo", meetingType: "demo", status: "confirmed", tags: ["important"], startAt: "2026-07-04T09:00:00.000Z", endAt: "2026-07-04T10:00:00.000Z", organizerId: "user-admin" }).meeting;

  const updated = service.updateMeeting({ id: zed.id, workspaceId: "workspace-a", title: "Zed Updated", status: "confirmed" });
  const search = service.searchMeetings({ workspaceId: "workspace-a", companyId: "company-a", contactId: "contact-a", query: "alpha" });
  const filtered = service.listMeetings({ workspaceId: "workspace-a", companyId: "company-a", contactId: "contact-a", meetingType: "demo", status: "confirmed", tags: ["important"] });
  const sorted = service.listMeetings({ workspaceId: "workspace-a", companyId: "company-a" }, { field: "startAt", direction: "asc" });
  const completed = service.completeMeeting(alpha.id, "workspace-a");
  const cancelled = service.cancelMeeting(zed.id, "workspace-a");
  const visibleAfterCancel = service.listMeetings({ workspaceId: "workspace-a", companyId: "company-a" });

  assert(updated.meeting.title === "Zed Updated", "Meeting update should update mutable fields.");
  assert(search.meetings.length === 1 && search.meetings[0].id === alpha.id, "Meeting search should match normalized meeting fields.");
  assert(filtered.meetings.length === 1 && filtered.meetings[0].id === alpha.id, "Meeting filtering should use CRM shared filters and meeting fields.");
  assert(sorted.meetings[0].title === "Alpha Demo", "Meeting listing should support deterministic sorting.");
  assert(completed.meeting.status === "completed", "Meeting complete should set completed status.");
  assert(cancelled.meeting.status === "cancelled", "Meeting cancel should set cancelled status.");
  assert(visibleAfterCancel.meetings.every((meeting) => meeting.status !== "cancelled"), "Cancelled meetings should be hidden by default.");
});

test("CRM Meetings Foundation has no Prisma API or platform runtime dependency", () => {
  const meetingFiles = listFiles("src/modules/crm/meetings").filter((file) => !file.includes("/ui/"));
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/app/,
    /@\/lib\/prisma/,
    /@\/runtime\/plugins/,
    /fetch\(/
  ];

  assert(meetingFiles.every((file) => !file.endsWith(".tsx")), "CRM Meetings foundation should not contain UI files.");

  for (const file of meetingFiles.filter((item) => item.endsWith(".ts"))) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `CRM Meetings foundation should not import forbidden dependency in ${file}.`);
    }
  }
});

test("CRM Tasks Foundation creates validates lists and isolates workspaces companies contacts and meetings", () => {
  const { TaskService } = load("src/modules/crm/tasks");
  let preparedActivity;
  const service = new TaskService({
    now: () => "2026-07-01T12:00:00.000Z",
    createId: (() => {
      let index = 0;
      return () => `task_${index += 1}`;
    })(),
    createActivity: (input) => {
      preparedActivity = input;
      return undefined;
    }
  });

  const first = service.createTask({
    workspaceId: "workspace-a",
    companyId: "company-a",
    contactId: "contact-a",
    meetingId: "meeting-a",
    title: " Follow up proposal ",
    dueDate: "2026-07-05T09:00:00.000Z",
    assignedTo: "user-admin",
    tags: ["VIP", " vip "]
  });
  service.createTask({ workspaceId: "workspace-a", companyId: "company-b", contactId: "contact-b", title: "Other company", dueDate: "2026-07-06T09:00:00.000Z", assignedTo: "user-admin" });
  service.createTask({ workspaceId: "workspace-b", companyId: "company-a", contactId: "contact-a", title: "Other workspace", dueDate: "2026-07-07T09:00:00.000Z", assignedTo: "user-admin" });

  const workspaceList = service.listTasks({ workspaceId: "workspace-a" });
  const companyList = service.getTasksByCompany("company-a", "workspace-a");
  const contactList = service.getTasksByContact("contact-a", "workspace-a");
  const meetingList = service.getTasksByMeeting("meeting-a", "workspace-a");

  assert(first.validation.valid === true, "Task creation should return a valid structured result.");
  assert(first.task.title === "Follow up proposal", "Task creation should normalize title values.");
  assert(first.task.tags.length === 1 && first.task.tags[0] === "vip", "Task creation should normalize tags.");
  assert(Object.isFrozen(first.task), "Created tasks should be immutable.");
  assert(preparedActivity?.type === "task", "Task creation should prepare a task activity input.");
  assert(workspaceList.tasks.length === 2, "Task listing should stay scoped to the requested workspace.");
  assert(companyList.tasks.length === 1 && companyList.tasks[0].companyId === "company-a", "Company task listing should stay scoped to one company.");
  assert(contactList.tasks.length === 1 && contactList.tasks[0].contactId === "contact-a", "Contact task listing should stay scoped to one contact.");
  assert(meetingList.tasks.length === 1 && meetingList.tasks[0].meetingId === "meeting-a", "Meeting task listing should stay scoped to one meeting.");
});

test("CRM Tasks Foundation validates invalid input and permission denial", () => {
  const { TaskService, validateCreateTaskInput } = load("src/modules/crm/tasks");
  const invalid = validateCreateTaskInput({
    workspaceId: "",
    companyId: "",
    title: "",
    dueDate: "not-a-date",
    assignedTo: ""
  });
  const denied = new TaskService().createTask({
    workspaceId: "workspace-a",
    companyId: "company-a",
    contactId: "contact-a",
    title: "Denied Task",
    dueDate: "2026-07-01T09:00:00.000Z",
    assignedTo: "user-admin",
    permission: { allowed: false, reason: "denied_missing_permission", permission: { module: "crm.task", action: "write" }, resource: { id: "crm.task", type: "service" } }
  });
  const codes = invalid.issues.map((issue) => issue.code);

  assert(invalid.valid === false, "Invalid task input should fail validation.");
  assert(codes.includes("missing_workspace"), "Task validation should require workspace scope.");
  assert(codes.includes("missing_company"), "Task validation should require company relationship.");
  assert(!codes.includes("invalid_contact"), "Task validation should allow a task without contact in the company-centric CRM model.");
  assert(codes.includes("missing_title"), "Task validation should require title.");
  assert(codes.includes("missing_assignee"), "Task validation should require assignee.");
  assert(codes.includes("invalid_due_date"), "Task validation should validate due date.");
  assert(denied.validation.issues.some((issue) => issue.code === "permission_denied"), "Task validation should accept permission decisions.");
  assert(!denied.task, "Permission denied task creation should not create a task.");
});

test("CRM Tasks Foundation supports update complete cancel search filtering and sorting", () => {
  const { TaskService } = load("src/modules/crm/tasks");
  const service = new TaskService({
    now: (() => {
      let index = 0;
      const values = ["2026-07-01T12:00:00.000Z", "2026-07-01T12:05:00.000Z", "2026-07-01T12:10:00.000Z", "2026-07-01T12:15:00.000Z", "2026-07-01T12:20:00.000Z"];
      return () => values[Math.min(index++, values.length - 1)];
    })(),
    createId: (() => {
      let index = 0;
      return () => `task_${index += 1}`;
    })()
  });
  const zed = service.createTask({ workspaceId: "workspace-a", companyId: "company-a", contactId: "contact-a", title: "Zed Task", taskType: "call", priority: "medium", dueDate: "2026-07-05T10:00:00.000Z", assignedTo: "user-admin" }).task;
  const alpha = service.createTask({ workspaceId: "workspace-a", companyId: "company-a", contactId: "contact-a", meetingId: "meeting-a", title: "Alpha Follow-up", taskType: "follow_up", priority: "high", status: "in_progress", tags: ["important"], dueDate: "2026-07-04T09:00:00.000Z", assignedTo: "user-admin" }).task;

  const updated = service.updateTask({ id: zed.id, workspaceId: "workspace-a", title: "Zed Updated", priority: "urgent" });
  const search = service.searchTasks({ workspaceId: "workspace-a", companyId: "company-a", contactId: "contact-a", query: "alpha" });
  const filtered = service.listTasks({ workspaceId: "workspace-a", companyId: "company-a", contactId: "contact-a", meetingId: "meeting-a", taskType: "follow_up", priority: "high", status: "in_progress", tags: ["important"] });
  const sorted = service.listTasks({ workspaceId: "workspace-a", companyId: "company-a" }, { field: "dueDate", direction: "asc" });
  const completed = service.completeTask(alpha.id, "workspace-a");
  const cancelled = service.cancelTask(zed.id, "workspace-a");
  const visibleAfterCancel = service.listTasks({ workspaceId: "workspace-a", companyId: "company-a" });

  assert(updated.task.title === "Zed Updated", "Task update should update mutable fields.");
  assert(search.tasks.length === 1 && search.tasks[0].id === alpha.id, "Task search should match normalized task fields.");
  assert(filtered.tasks.length === 1 && filtered.tasks[0].id === alpha.id, "Task filtering should use CRM shared filters and task fields.");
  assert(sorted.tasks[0].title === "Alpha Follow-up", "Task listing should support deterministic sorting.");
  assert(completed.task.status === "completed" && Boolean(completed.activityInput), "Task complete should set completed status and prepare activity.");
  assert(cancelled.task.status === "cancelled" && Boolean(cancelled.activityInput), "Task cancel should set cancelled status and prepare activity.");
  assert(visibleAfterCancel.tasks.every((task) => task.status !== "cancelled"), "Cancelled tasks should be hidden by default.");
});

test("CRM Tasks Foundation has no Prisma API or platform runtime dependency", () => {
  const taskFiles = listFiles("src/modules/crm/tasks").filter((file) => !file.includes("/ui/"));
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/app/,
    /@\/lib\/prisma/,
    /@\/runtime\/plugins/,
    /fetch\(/
  ];

  assert(taskFiles.every((file) => !file.endsWith(".tsx")), "CRM Tasks foundation should not contain UI files.");

  for (const file of taskFiles.filter((item) => item.endsWith(".ts"))) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `CRM Tasks foundation should not import forbidden dependency in ${file}.`);
    }
  }
});

test("CRM Notes Foundation creates validates lists and isolates workspaces relationships", () => {
  const { NoteService } = load("src/modules/crm/notes");
  let preparedActivity;
  const service = new NoteService({
    now: () => "2026-07-01T12:00:00.000Z",
    createId: (() => {
      let index = 0;
      return () => `note_${index += 1}`;
    })(),
    createActivity: (input) => {
      preparedActivity = input;
      return undefined;
    }
  });

  const first = service.createNote({
    workspaceId: "workspace-a",
    companyId: "company-a",
    contactId: "contact-a",
    meetingId: "meeting-a",
    taskId: "task-a",
    title: " Strategic context ",
    content: "Important account notes",
    authorId: "user-admin",
    tags: ["Pinned", " pinned "]
  });
  service.createNote({ workspaceId: "workspace-a", companyId: "company-b", title: "Other company", content: "Other", authorId: "user-admin" });
  service.createNote({ workspaceId: "workspace-b", companyId: "company-a", contactId: "contact-a", title: "Other workspace", content: "Other", authorId: "user-admin" });

  const workspaceList = service.listNotes({ workspaceId: "workspace-a" });
  const companyList = service.getNotesByCompany("company-a", "workspace-a");
  const contactList = service.getNotesByContact("contact-a", "workspace-a");
  const meetingList = service.getNotesByMeeting("meeting-a", "workspace-a");
  const taskList = service.getNotesByTask("task-a", "workspace-a");

  assert(first.validation.valid === true, "Note creation should return a valid structured result.");
  assert(first.note.title === "Strategic context", "Note creation should normalize title values.");
  assert(first.note.tags.length === 1 && first.note.tags[0] === "pinned", "Note creation should normalize tags.");
  assert(Object.isFrozen(first.note), "Created notes should be immutable.");
  assert(preparedActivity?.type === "note", "Note creation should prepare a note activity input.");
  assert(workspaceList.notes.length === 2, "Note listing should stay scoped to the requested workspace.");
  assert(companyList.notes.length === 1 && companyList.notes[0].companyId === "company-a", "Company note listing should stay scoped to one company.");
  assert(contactList.notes.length === 1 && contactList.notes[0].contactId === "contact-a", "Contact note listing should stay scoped to one contact.");
  assert(meetingList.notes.length === 1 && meetingList.notes[0].meetingId === "meeting-a", "Meeting note listing should stay scoped to one meeting.");
  assert(taskList.notes.length === 1 && taskList.notes[0].taskId === "task-a", "Task note listing should stay scoped to one task.");
});

test("CRM Notes Foundation validates invalid input and permission denial", () => {
  const { NoteService, validateCreateNoteInput } = load("src/modules/crm/notes");
  const invalid = validateCreateNoteInput({
    workspaceId: "",
    companyId: "",
    title: "",
    content: "",
    authorId: ""
  });
  const denied = new NoteService().createNote({
    workspaceId: "workspace-a",
    companyId: "company-a",
    title: "Denied Note",
    content: "Denied",
    authorId: "user-admin",
    permission: { allowed: false, reason: "denied_missing_permission", permission: { module: "crm.note", action: "write" }, resource: { id: "crm.note", type: "service" } }
  });
  const codes = invalid.issues.map((issue) => issue.code);

  assert(invalid.valid === false, "Invalid note input should fail validation.");
  assert(codes.includes("missing_workspace"), "Note validation should require workspace scope.");
  assert(codes.includes("missing_company"), "Note validation should require company relationship.");
  assert(codes.includes("missing_title"), "Note validation should require title.");
  assert(codes.includes("missing_content"), "Note validation should require content.");
  assert(codes.includes("missing_author"), "Note validation should require author.");
  assert(denied.validation.issues.some((issue) => issue.code === "permission_denied"), "Note validation should accept permission decisions.");
  assert(!denied.note, "Permission denied note creation should not create a note.");
});

test("CRM Notes Foundation supports update archive search filtering and sorting", () => {
  const { NoteService } = load("src/modules/crm/notes");
  const service = new NoteService({
    now: (() => {
      let index = 0;
      const values = ["2026-07-01T12:00:00.000Z", "2026-07-01T12:05:00.000Z", "2026-07-01T12:10:00.000Z", "2026-07-01T12:15:00.000Z"];
      return () => values[Math.min(index++, values.length - 1)];
    })(),
    createId: (() => {
      let index = 0;
      return () => `note_${index += 1}`;
    })()
  });
  const zed = service.createNote({ workspaceId: "workspace-a", companyId: "company-a", contactId: "contact-a", title: "Zed Note", content: "Call later", visibility: "team", authorId: "user-admin" }).note;
  const alpha = service.createNote({ workspaceId: "workspace-a", companyId: "company-a", contactId: "contact-a", meetingId: "meeting-a", taskId: "task-a", title: "Alpha Insight", content: "Important AI knowledge", visibility: "private", tags: ["important"], authorId: "user-admin" }).note;

  const updated = service.updateNote({ id: zed.id, workspaceId: "workspace-a", title: "Zed Updated", content: "Updated content" });
  const search = service.searchNotes({ workspaceId: "workspace-a", companyId: "company-a", contactId: "contact-a", query: "alpha" });
  const filtered = service.listNotes({ workspaceId: "workspace-a", companyId: "company-a", contactId: "contact-a", meetingId: "meeting-a", taskId: "task-a", visibility: "private", tags: ["important"] });
  const sorted = service.listNotes({ workspaceId: "workspace-a", companyId: "company-a" }, { field: "title", direction: "asc" });
  const archived = service.archiveNote(alpha.id, "workspace-a");
  const visibleAfterArchive = service.listNotes({ workspaceId: "workspace-a", companyId: "company-a" });

  assert(updated.note.title === "Zed Updated" && Boolean(updated.activityInput), "Note update should update fields and prepare activity.");
  assert(search.notes.length === 1 && search.notes[0].id === alpha.id, "Note search should match normalized note fields.");
  assert(filtered.notes.length === 1 && filtered.notes[0].id === alpha.id, "Note filtering should use relationships and CRM shared filters.");
  assert(sorted.notes[0].title === "Alpha Insight", "Note listing should support deterministic sorting.");
  assert(Boolean(archived.note.archivedAt) && Boolean(archived.activityInput), "Note archive should set archivedAt and prepare activity.");
  assert(visibleAfterArchive.notes.every((note) => !note.archivedAt), "Archived notes should be hidden by default.");
});

test("CRM Notes Foundation has no Prisma API or platform runtime dependency", () => {
  const noteFiles = listFiles("src/modules/crm/notes").filter((file) => !file.includes("/ui/"));
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/app/,
    /@\/lib\/prisma/,
    /@\/runtime\/plugins/,
    /fetch\(/
  ];

  assert(noteFiles.every((file) => !file.endsWith(".tsx")), "CRM Notes foundation should not contain UI files.");

  for (const file of noteFiles.filter((item) => item.endsWith(".ts"))) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `CRM Notes foundation should not import forbidden dependency in ${file}.`);
    }
  }
});

test("CRM Opportunities Foundation creates validates lists and isolates sales relationships", () => {
  const { OpportunityService } = load("src/modules/crm/opportunities");
  let preparedActivity;
  const service = new OpportunityService({
    now: () => "2026-07-01T12:00:00.000Z",
    createId: (() => {
      let index = 0;
      return () => `opp_${index += 1}`;
    })(),
    createActivity: (input) => {
      preparedActivity = input;
      return undefined;
    }
  });

  const first = service.createOpportunity({
    workspaceId: "workspace-a",
    companyId: "company-a",
    primaryContactId: "contact-a",
    title: " Strategic deal ",
    estimatedValue: { amount: 120000, currency: "MAD" },
    ownerId: "user-admin",
    tags: ["Sales", " sales "]
  });
  service.createOpportunity({ workspaceId: "workspace-a", companyId: "company-b", primaryContactId: "contact-b", title: "Other company", estimatedValue: { amount: 50000, currency: "MAD" }, ownerId: "user-admin" });
  service.createOpportunity({ workspaceId: "workspace-b", companyId: "company-a", primaryContactId: "contact-a", title: "Other workspace", estimatedValue: { amount: 70000, currency: "MAD" }, ownerId: "user-admin" });

  const workspaceList = service.listOpportunities({ workspaceId: "workspace-a" });
  const companyList = service.listByCompany("company-a", "workspace-a");
  const contactList = service.listByContact("contact-a", "workspace-a");

  assert(first.validation.valid === true, "Opportunity creation should return a valid structured result.");
  assert(first.opportunity.title === "Strategic deal", "Opportunity creation should normalize title values.");
  assert(first.opportunity.tags.length === 1 && first.opportunity.tags[0] === "sales", "Opportunity creation should normalize tags.");
  assert(first.opportunity.stage === "lead" && first.opportunity.status === "open", "Opportunity creation should apply pipeline defaults.");
  assert(Object.isFrozen(first.opportunity), "Created opportunities should be immutable.");
  assert(preparedActivity?.type === "system", "Opportunity creation should prepare an activity input.");
  assert(workspaceList.opportunities.length === 2, "Opportunity listing should stay scoped to the requested workspace.");
  assert(companyList.opportunities.length === 1 && companyList.opportunities[0].companyId === "company-a", "Company opportunity listing should stay scoped to one company.");
  assert(contactList.opportunities.length === 1 && contactList.opportunities[0].primaryContactId === "contact-a", "Contact opportunity listing should stay scoped to one contact.");
});

test("CRM Opportunities Foundation validates invalid input and permission denial", () => {
  const { OpportunityService, validateCreateOpportunityInput } = load("src/modules/crm/opportunities");
  const invalid = validateCreateOpportunityInput({
    workspaceId: "",
    companyId: "",
    primaryContactId: "",
    title: "",
    probability: 120,
    estimatedValue: { amount: -1, currency: "MAD" },
    ownerId: ""
  });
  const denied = new OpportunityService().createOpportunity({
    workspaceId: "workspace-a",
    companyId: "company-a",
    primaryContactId: "contact-a",
    title: "Denied Opportunity",
    estimatedValue: { amount: 10000, currency: "MAD" },
    ownerId: "user-admin",
    permission: { allowed: false, reason: "denied_missing_permission", permission: { module: "crm.opportunity", action: "write" }, resource: { id: "crm.opportunity", type: "service" } }
  });
  const fields = invalid.issues.map((issue) => issue.field);

  assert(invalid.valid === false, "Invalid opportunity input should fail validation.");
  assert(fields.includes("workspaceId"), "Opportunity validation should require workspace scope.");
  assert(fields.includes("companyId"), "Opportunity validation should require company relationship.");
  assert(fields.includes("primaryContactId"), "Opportunity validation should require contact relationship.");
  assert(fields.includes("title"), "Opportunity validation should require title.");
  assert(fields.includes("probability"), "Opportunity validation should validate probability.");
  assert(fields.includes("estimatedValue"), "Opportunity validation should validate estimated value.");
  assert(fields.includes("ownerId"), "Opportunity validation should require owner.");
  assert(denied.validation.issues.some((issue) => issue.field === "permission"), "Opportunity validation should accept permission decisions.");
  assert(!denied.opportunity, "Permission denied opportunity creation should not create an opportunity.");
});

test("CRM Opportunities Foundation supports update archive search filtering and sorting", () => {
  const { OpportunityService } = load("src/modules/crm/opportunities");
  const service = new OpportunityService({
    now: (() => {
      let index = 0;
      const values = ["2026-07-01T12:00:00.000Z", "2026-07-01T12:05:00.000Z", "2026-07-01T12:10:00.000Z", "2026-07-01T12:15:00.000Z"];
      return () => values[Math.min(index++, values.length - 1)];
    })(),
    createId: (() => {
      let index = 0;
      return () => `opp_${index += 1}`;
    })()
  });
  const alpha = service.createOpportunity({ workspaceId: "workspace-a", companyId: "company-a", primaryContactId: "contact-a", title: "Alpha Deal", stage: "proposal", priority: "high", probability: 60, estimatedValue: { amount: 120000, currency: "MAD" }, ownerId: "user-admin", tags: ["important"] }).opportunity;
  const zed = service.createOpportunity({ workspaceId: "workspace-a", companyId: "company-a", primaryContactId: "contact-b", title: "Zed Deal", stage: "qualified", priority: "medium", estimatedValue: { amount: 80000, currency: "MAD" }, ownerId: "user-admin" }).opportunity;

  const updated = service.updateOpportunity({ id: zed.id, workspaceId: "workspace-a", stage: "negotiation", probability: 72 });
  const search = service.searchOpportunities({ workspaceId: "workspace-a", companyId: "company-a", query: "alpha" });
  const filtered = service.listOpportunities({ workspaceId: "workspace-a", companyId: "company-a", contactId: "contact-a", stage: "proposal", priority: "high", tags: ["important"] });
  const sorted = service.listOpportunities({ workspaceId: "workspace-a", companyId: "company-a" }, { field: "estimatedValue", direction: "desc" });
  const archived = service.archiveOpportunity(alpha.id, "workspace-a");
  const visibleAfterArchive = service.listOpportunities({ workspaceId: "workspace-a", companyId: "company-a" });

  assert(updated.opportunity.stage === "negotiation" && updated.activityInput, "Opportunity update should update fields and prepare activity.");
  assert(search.opportunities.length === 1 && search.opportunities[0].id === alpha.id, "Opportunity search should match normalized opportunity fields.");
  assert(filtered.opportunities.length === 1 && filtered.opportunities[0].id === alpha.id, "Opportunity filtering should use relationships and CRM shared tags.");
  assert(sorted.opportunities[0].id === alpha.id, "Opportunity listing should support deterministic value sorting.");
  assert(Boolean(archived.opportunity.archivedAt) && Boolean(archived.activityInput), "Opportunity archive should set archivedAt and prepare activity.");
  assert(visibleAfterArchive.opportunities.every((opportunity) => opportunity.status !== "archived"), "Archived opportunities should be hidden by default.");
});

test("Product Catalog Foundation creates, validates, archives and restores canonical products", () => {
  const {
    ProductService,
    PRODUCTS_WORKSPACE_ID,
    PRODUCTS_USER_ID
  } = load("src/modules/products");
  const service = new ProductService({
    now: () => "2026-07-13T12:00:00.000Z",
    createProductId: () => "product-runtime-1",
    createCategoryId: () => "category-runtime-1"
  });

  const categoryResult = service.createCategory({
    workspaceId: PRODUCTS_WORKSPACE_ID,
    name: "Services"
  });

  assert(categoryResult.category, "Product category should be created.");

  const productResult = service.createProduct({
    workspaceId: PRODUCTS_WORKSPACE_ID,
    sku: " srv 001 ",
    barcode: "BC-001",
    name: "Audit Premium",
    categoryId: categoryResult.category.id,
    purchasePrice: 100,
    sellingPrice: 250,
    vatRate: 20,
    currency: "mad",
    createdBy: PRODUCTS_USER_ID
  });

  assert(productResult.product, "Product should be created.");
  assert(productResult.product.sku === "SRV-001", "SKU should be normalized.");
  assert(productResult.product.currency === "MAD", "Currency should be normalized.");
  assert(productResult.product.categoryName === "Services", "Category relation should be reflected in product view model.");

  const duplicateSku = service.createProduct({
    workspaceId: PRODUCTS_WORKSPACE_ID,
    sku: "srv-001",
    name: "Duplicate",
    sellingPrice: 300
  });
  assert(!duplicateSku.validation.valid, "Duplicate SKU should be rejected.");

  const duplicateBarcode = service.createProduct({
    workspaceId: PRODUCTS_WORKSPACE_ID,
    sku: "SRV-002",
    barcode: "BC-001",
    name: "Duplicate barcode",
    sellingPrice: 300
  });
  assert(!duplicateBarcode.validation.valid, "Duplicate barcode should be rejected.");

  const archived = service.archiveProduct(productResult.product.id, PRODUCTS_WORKSPACE_ID, PRODUCTS_USER_ID);
  assert(archived.product?.status === "archived" && archived.product.active === false, "Archive should update product lifecycle.");

  const restored = service.restoreProduct(productResult.product.id, PRODUCTS_WORKSPACE_ID, PRODUCTS_USER_ID);
  assert(restored.product?.status === "active" && restored.product.active === true, "Restore should reactivate product.");
});

test("Product Catalog Foundation remains registered but inactive in the current Alpha profile", () => {
  const {
    bosiacoModuleRegistry,
    getCurrentAlphaActivation
  } = load("src/platform/modules");
  const descriptor = bosiacoModuleRegistry.get("sales.products");
  const activation = getCurrentAlphaActivation();

  assert(descriptor, "Product module descriptor should exist.");
  assert(descriptor.status === "planned", "Product module should remain planned until a later activation sprint.");
  assert(descriptor.hidden === false, "Product module may expose navigation metadata for controlled profiles.");
  assert(!activation.activeModuleIdSet.has("sales.products"), "Product module should not be active in the current Alpha profile.");
});

test("Shared Import Export Platform maps, previews, validates and exports generic records", () => {
  const {
    buildExportRows,
    buildImportErrorReportRows,
    buildImportPreview,
    createCsvContent,
    createDefaultImportMapping,
    createImportIssue,
    parseCsvContent
  } = load("src/platform/import-export");
  const columns = [
    { field: "code", label: "Code", aliases: ["code", "référence"], required: true },
    { field: "name", label: "Nom", aliases: ["name", "nom"], required: true }
  ];
  const existing = [{ id: "existing-1", code: "A-001", name: "Existing" }];
  const definition = {
    identifier: "runtime.import",
    entityLabel: "Ligne",
    supportedFormats: ["xlsx", "csv"],
    columns,
    duplicatePolicySupport: ["stop", "ignore", "update"],
    identityField: "code",
    maxRows: 10,
    maxFileSize: 1024,
    sampleRow: { Code: "A-002", Nom: "Nouveau" },
    parseRow: (row, mapping) => ({
      code: String(row[mapping.code] ?? "").trim().toUpperCase(),
      name: String(row[mapping.name] ?? "").trim()
    }),
    validateRow: (values, rowNumber) => {
      const issues = [];
      if (!values.code) issues.push(createImportIssue(rowNumber, "code", "", "Code obligatoire."));
      if (!values.name) issues.push(createImportIssue(rowNumber, "name", "", "Nom obligatoire."));
      return issues;
    },
    resolveExisting: (values) => existing.find((record) => record.code === values.code),
    getExistingId: (record) => record.id,
    duplicateChecks: [{
      field: "code",
      getValue: (values) => values.code,
      withinFileMessage: (firstRowNumber) => `Code déjà présent à la ligne ${firstRowNumber}.`,
      suggestion: "Conservez une seule ligne par code."
    }]
  };
  const mapping = createDefaultImportMapping(columns, ["Référence", "Nom"]);
  const createPreview = buildImportPreview(definition, [{ Référence: "A-002", Nom: "Nouveau" }], mapping, {}, "stop");
  const updatePreview = buildImportPreview(definition, [{ Référence: "A-001", Nom: "Mis à jour" }], mapping, {}, "update");
  const ignorePreview = buildImportPreview(definition, [{ Référence: "A-001", Nom: "Ignoré" }], mapping, {}, "ignore");
  const invalidPreview = buildImportPreview(definition, [
    { Référence: "A-003", Nom: "Premier" },
    { Référence: "A-003", Nom: "Second" }
  ], mapping, {}, "stop");
  const exportRows = buildExportRows({
    identifier: "runtime.export",
    entityLabel: "Ligne",
    supportedFormats: ["csv", "xlsx"],
    filename: () => "runtime.csv",
    columns: [
      { field: "code", label: "Code", formatter: (record) => record.code },
      { field: "name", label: "Nom", formatter: (record) => record.name }
    ]
  }, existing);
  const csv = createCsvContent(exportRows);
  const parsedCsv = parseCsvContent("Code;Nom\nA-004;\"Nom; composé\"");
  const errorRows = buildImportErrorReportRows(invalidPreview.issues);

  assert(mapping.code === "Référence" && mapping.name === "Nom", "Generic import mapping should match aliases.");
  assert(createPreview.newRecords === 1 && createPreview.validRows === 1, "Generic import preview should classify new rows.");
  assert(updatePreview.recordsToUpdate === 1, "Generic import preview should classify update rows.");
  assert(ignorePreview.ignoredRows === 1, "Generic import preview should classify ignored duplicates.");
  assert(invalidPreview.invalidRows === 1 && invalidPreview.issues.some((issue) => issue.message.includes("déjà présent")), "Generic import preview should report within-file duplicates.");
  assert(exportRows[0].Code === "A-001" && csv.startsWith("\uFEFFCode;Nom"), "Generic export should produce French CSV rows.");
  assert(parsedCsv.rows[0].Nom === "Nom; composé", "Generic CSV parser should support semicolons and quoted values.");
  assert(errorRows.length === invalidPreview.issues.length && errorRows[0].Erreur, "Generic error report rows should expose issue messages.");
});

test("Product Catalog Import validates mapping, duplicate policies and export rows", () => {
  const {
    PRODUCTS_WORKSPACE_ID,
    createDefaultProductImportMapping,
    productToExportRow,
    validateProductImportRows
  } = load("src/modules/products");
  const existingProduct = {
    id: "prod-existing",
    workspaceId: PRODUCTS_WORKSPACE_ID,
    sku: "SKU-001",
    barcode: "BAR-001",
    name: "Produit existant",
    unit: "piece",
    purchasePrice: 10,
    sellingPrice: 20,
    vatRate: 20,
    currency: "MAD",
    active: true,
    status: "active",
    flags: { trackInventory: false, allowNegativeStock: false, hasVariants: false, serialTracked: false, batchTracked: false },
    createdAt: "2026-07-13T00:00:00.000Z",
    updatedAt: "2026-07-13T00:00:00.000Z"
  };
  const categories = [{
    id: "cat-1",
    workspaceId: PRODUCTS_WORKSPACE_ID,
    name: "Accessoires",
    order: 1,
    active: true,
    createdAt: "2026-07-13T00:00:00.000Z",
    updatedAt: "2026-07-13T00:00:00.000Z"
  }];
  const headers = ["Référence", "Nom", "Code-barres", "Prix de vente", "TVA", "Unité", "Catégorie"];
  const mapping = createDefaultProductImportMapping(headers);
  const validRows = [
    { Référence: "SKU-002", Nom: "Nouveau produit", "Code-barres": "BAR-002", "Prix de vente": "120,50", TVA: "20", "Unité": "piece", "Catégorie": "Accessoires" }
  ];
  const validPreview = validateProductImportRows(validRows, mapping, {
    existingProducts: [existingProduct],
    categories,
    duplicatePolicy: "stop"
  });
  const duplicateStopPreview = validateProductImportRows([
    { Référence: "SKU-001", Nom: "Doublon", "Code-barres": "", "Prix de vente": "120", TVA: "20", "Unité": "piece", "Catégorie": "Accessoires" }
  ], mapping, {
    existingProducts: [existingProduct],
    categories,
    duplicatePolicy: "stop"
  });
  const duplicateIgnorePreview = validateProductImportRows([
    { Référence: "SKU-001", Nom: "Doublon", "Code-barres": "", "Prix de vente": "120", TVA: "20", "Unité": "piece", "Catégorie": "Accessoires" }
  ], mapping, {
    existingProducts: [existingProduct],
    categories,
    duplicatePolicy: "ignore"
  });
  const duplicateUpdatePreview = validateProductImportRows([
    { Référence: "SKU-001", Nom: "Produit mis à jour", "Code-barres": "BAR-001", "Prix de vente": "130", TVA: "20", "Unité": "piece", "Catégorie": "Accessoires" }
  ], mapping, {
    existingProducts: [existingProduct],
    categories,
    duplicatePolicy: "update"
  });
  const invalidPreview = validateProductImportRows([
    { Référence: "SKU-003", Nom: "", "Code-barres": "BAR-001", "Prix de vente": "-1", TVA: "150", "Unité": "palette", "Catégorie": "Accessoires" },
    { Référence: "SKU-003", Nom: "Deuxième doublon", "Code-barres": "BAR-003", "Prix de vente": "10", TVA: "20", "Unité": "piece", "Catégorie": "Accessoires" }
  ], mapping, {
    existingProducts: [existingProduct],
    categories,
    duplicatePolicy: "stop"
  });
  const exportRow = productToExportRow(existingProduct);

  assert(mapping.sku === "Référence" && mapping.name === "Nom", "Product import should auto-map common French headers.");
  assert(validPreview.newProducts === 1 && validPreview.invalidRows === 0, "Valid import rows should be classified as new products.");
  assert(duplicateStopPreview.invalidRows === 1, "Stop-on-duplicate policy should reject an existing SKU.");
  assert(duplicateIgnorePreview.ignoredRows === 1 && duplicateIgnorePreview.invalidRows === 0, "Ignore duplicate policy should skip existing SKU without error.");
  assert(duplicateUpdatePreview.productsToUpdate === 1 && duplicateUpdatePreview.invalidRows === 0, "Update-by-SKU policy should classify matching SKU as update.");
  assert(invalidPreview.issues.some((issue) => issue.column === "unit"), "Invalid unit should be reported.");
  assert(invalidPreview.issues.some((issue) => issue.column === "vatRate"), "Invalid VAT should be reported.");
  assert(invalidPreview.issues.some((issue) => issue.column === "barcode"), "Barcode conflict should be reported.");
  assert(invalidPreview.issues.some((issue) => issue.message.includes("déjà présent")), "Duplicate SKU within file should be reported.");
  assert(exportRow.SKU === "SKU-001" && exportRow.Nom === "Produit existant", "Product export should use canonical French headers.");
});

test("Inventory Domain Foundation posts movements and calculates availability", () => {
  const { InventoryService } = load("src/modules/inventory");
  const companyId = "company-runtime";
  const productId = "product-runtime-1";
  const mainWarehouseId = "warehouse-main";
  const secondaryWarehouseId = "warehouse-secondary";
  const service = new InventoryService({
    now: () => "2026-07-13T13:00:00.000Z",
    createWarehouseId: (() => {
      const ids = [mainWarehouseId, secondaryWarehouseId];
      let index = 0;
      return () => ids[index++];
    })(),
    createMovementId: (() => {
      let index = 0;
      return () => `movement-runtime-${index++}`;
    })(),
    productExists: (candidateProductId, candidateCompanyId) => candidateProductId === productId && candidateCompanyId === companyId
  });

  const main = service.createWarehouse({ companyId, code: " main ", name: "Principal", isDefault: true });
  const secondary = service.createWarehouse({ companyId, code: "secondary", name: "Secondaire" });

  assert(main.data?.code === "MAIN", "Warehouse code should be normalized.");
  assert(secondary.data, "Second warehouse should be created.");
  assert(!service.createWarehouse({ companyId, code: "main", name: "Duplicate" }).validation.valid, "Duplicate warehouse codes should be rejected.");
  const defaultUpdate = service.updateWarehouse({ companyId, warehouseId: secondaryWarehouseId, isDefault: true });
  assert(defaultUpdate.data?.isDefault === true, "Warehouse update should support marking a new default.");
  assert(service.getSnapshot(companyId).warehouses.filter((warehouse) => warehouse.isDefault).length === 1, "Only one default warehouse should remain active after reassignment.");

  const receipt = service.postReceipt({ companyId, productId, toWarehouseId: mainWarehouseId, quantity: 10 });
  assert(receipt.data?.status === "POSTED", "Receipt should post.");
  assert(service.getAvailability(companyId, productId, mainWarehouseId) === 10, "Receipt should increase availability.");

  const reservation = service.reserve({ companyId, productId, toWarehouseId: mainWarehouseId, quantity: 3 });
  assert(reservation.data?.status === "POSTED", "Reservation should post.");
  assert(service.getAvailability(companyId, productId, mainWarehouseId) === 7, "Reservation should reduce availability.");

  const release = service.release({ companyId, productId, fromWarehouseId: mainWarehouseId, quantity: 1 });
  assert(release.data?.status === "POSTED", "Release should post.");
  assert(service.getAvailability(companyId, productId, mainWarehouseId) === 8, "Release should increase availability.");

  const issue = service.postIssue({ companyId, productId, fromWarehouseId: mainWarehouseId, quantity: 2 });
  assert(issue.data?.status === "POSTED", "Issue should post.");
  assert(service.getAvailability(companyId, productId, mainWarehouseId) === 6, "Issue should reduce available on hand.");

  const transfer = service.postTransfer({ companyId, productId, fromWarehouseId: mainWarehouseId, toWarehouseId: secondaryWarehouseId, quantity: 2 });
  assert(transfer.data?.status === "POSTED", "Transfer should post.");
  assert(service.getAvailability(companyId, productId, mainWarehouseId) === 4, "Transfer should reduce source availability.");
  assert(service.getAvailability(companyId, productId, secondaryWarehouseId) === 2, "Transfer should increase destination availability.");

  const adjustment = service.postAdjustment({ companyId, productId, fromWarehouseId: secondaryWarehouseId, quantity: 1, direction: "out" });
  assert(adjustment.data?.status === "POSTED", "Adjustment should post.");
  assert(service.getAvailability(companyId, productId, secondaryWarehouseId) === 1, "Adjustment out should reduce availability.");
});

test("Inventory quantity policy normalizes decimal input without floating point artifacts", () => {
  const {
    adjustInventoryQuantityInput,
    formatInventoryQuantityInput,
    normalizeInventoryQuantity,
    parseInventoryQuantityInput
  } = load("src/modules/inventory");

  assert(parseInventoryQuantityInput("20") === 20, "Quantity input 20 should parse exactly as 20.");
  assert(parseInventoryQuantityInput("2,5") === 2.5, "Quantity input should accept comma decimal separators.");
  assert(normalizeInventoryQuantity(0.1 + 0.2) === 0.3, "Quantity normalization should remove binary floating point artifacts.");
  assert(formatInventoryQuantityInput(1.050001) === "1.050001", "Quantity input formatting should preserve canonical precision.");
  assert(adjustInventoryQuantityInput("20", 1) === "21", "Arrow increment should be deterministic.");
  assert(adjustInventoryQuantityInput("21", -1) === "20", "Arrow decrement should return exactly to the original integer.");
  assert(adjustInventoryQuantityInput("0", -1) === "0", "Arrow decrement should not produce negative quantities.");
});

test("Inventory Domain Foundation rolls back failed postings and rejects duplicate posting", () => {
  const { InventoryService } = load("src/modules/inventory");
  const companyId = "company-runtime";
  const productId = "product-runtime-1";
  const warehouseId = "warehouse-main";
  const service = new InventoryService({
    now: () => "2026-07-13T13:00:00.000Z",
    createWarehouseId: () => warehouseId,
    createMovementId: () => "movement-auto",
    productExists: () => true
  });

  service.createWarehouse({ companyId, code: "main", name: "Principal" });
  service.postReceipt({ id: "movement-receipt", companyId, productId, toWarehouseId: warehouseId, quantity: 5 });

  const duplicate = service.postReceipt({ id: "movement-receipt", companyId, productId, toWarehouseId: warehouseId, quantity: 5 });
  assert(!duplicate.validation.valid, "Posting the same movement id twice should fail.");
  assert(service.getAvailability(companyId, productId, warehouseId) === 5, "Duplicate posting should not mutate availability.");

  const failedIssue = service.postIssue({ companyId, productId, fromWarehouseId: warehouseId, quantity: 50 });
  assert(!failedIssue.validation.valid, "Insufficient stock issue should fail.");
  assert(service.getAvailability(companyId, productId, warehouseId) === 5, "Failed issue should preserve the previous balance.");
});

test("Inventory Domain Foundation stores normalized quantities exactly once", () => {
  const { InventoryService } = load("src/modules/inventory");
  const companyId = "company-runtime";
  const productId = "product-runtime-quantity";
  const warehouseId = "warehouse-quantity";
  const service = new InventoryService({
    now: () => "2026-07-14T19:00:00.000Z",
    createWarehouseId: () => warehouseId,
    createMovementId: () => "movement-quantity",
    productExists: () => true
  });

  service.createWarehouse({ companyId, code: "quantity", name: "Quantité" });
  const receipt = service.postReceipt({ companyId, productId, toWarehouseId: warehouseId, quantity: 0.1 + 0.2 });
  const snapshot = service.getSnapshot(companyId);

  assert(receipt.data?.quantity === 0.3, "Receipt movement should store normalized quantity.");
  assert(snapshot.balances[0]?.quantityOnHand === 0.3, "Balance on-hand should match normalized receipt quantity.");
  assert(snapshot.balances[0]?.quantityAvailable === 0.3, "Balance available should match normalized receipt quantity.");
});

test("Reservation Availability Engine reserves releases and exposes canonical availability", () => {
  const { InventoryService, ReservationService } = load("src/modules/inventory");
  const companyId = "company-runtime";
  const otherCompanyId = "company-other";
  const productId = "product-runtime-1";
  const warehouseId = "warehouse-main";
  const service = new InventoryService({
    now: () => "2026-07-13T15:00:00.000Z",
    createWarehouseId: () => warehouseId,
    createMovementId: (() => {
      let index = 0;
      return () => `reservation-runtime-${index++}`;
    })(),
    productExists: (candidateProductId, candidateCompanyId) => candidateProductId === productId && candidateCompanyId === companyId
  });
  const reservations = new ReservationService({ inventoryService: service });

  service.createWarehouse({ companyId, code: "main", name: "Principal" });
  service.postReceipt({ companyId, productId, toWarehouseId: warehouseId, quantity: 12 });

  assert(reservations.canReserve({ companyId, productId, warehouseId, quantity: 5 }), "Reservation engine should approve available quantity.");
  assert(reservations.canFulfill({ companyId, productId, warehouseId, quantity: 12 }), "Fulfillment should use available quantity before reservation.");

  const firstReservation = reservations.reserve({ companyId, productId, warehouseId, quantity: 5, referenceType: "QUOTE", referenceId: "quote-1", reference: "DEV-001" });
  assert(firstReservation.data?.type === "RESERVATION", "Reservation should post as a stock movement.");
  assert(firstReservation.data?.referenceType === "QUOTE" && firstReservation.data?.referenceId === "quote-1", "Reservation should preserve future reference metadata.");

  const secondReservation = reservations.reserve({ companyId, productId, warehouseId, quantity: 4, referenceType: "SALES_ORDER", referenceId: "order-1" });
  assert(secondReservation.data?.status === "POSTED", "Multiple reservations should be allowed while stock is available.");

  const availability = reservations.getAvailability({ companyId, productId, warehouseId });
  assert(availability.quantityOnHand === 12, "Availability should expose on-hand quantity.");
  assert(availability.quantityReserved === 9, "Availability should expose reserved quantity.");
  assert(availability.quantityAvailable === 3, "Availability should expose available quantity.");
  assert(availability.quantityIncoming === 0 && availability.quantityOutgoing === 0 && availability.quantityProjected === 3, "Future availability fields should remain deterministic placeholders.");
  assert(!reservations.canReserve({ companyId, productId, warehouseId, quantity: 4 }), "Reservation engine should reject over-reservation.");

  const overReservation = reservations.reserve({ companyId, productId, warehouseId, quantity: 4 });
  assert(!overReservation.validation.valid, "Over-reservation should fail.");
  assert(reservations.getAvailability({ companyId, productId, warehouseId }).quantityAvailable === 3, "Failed reservation should not mutate availability.");

  const release = reservations.release({ companyId, productId, warehouseId, quantity: 2, referenceType: "QUOTE", referenceId: "quote-1" });
  assert(release.data?.type === "RELEASE", "Release should post as a stock movement.");
  assert(reservations.getAvailability({ companyId, productId, warehouseId }).quantityReserved === 7, "Release should decrease reserved quantity.");

  const overRelease = reservations.release({ companyId, productId, warehouseId, quantity: 8 });
  assert(!overRelease.validation.valid, "Release must not create negative reservation.");

  const tenantMismatch = reservations.reserve({ companyId: otherCompanyId, productId, warehouseId, quantity: 1 });
  assert(!tenantMismatch.validation.valid, "Reservation must remain tenant-scoped.");

  const history = service.getSnapshot(companyId).movements.filter((movement) => movement.type === "RESERVATION" || movement.type === "RELEASE");
  assert(history.length === 3, "Reservation and release should remain visible in movement history.");
});

test("Reservation QA Workspace stays inside Inventory and uses existing persistence operations", () => {
  const workspaceSource = read("src/modules/inventory/ui/pages/inventory-workspace.tsx");
  const dialogSource = read("src/modules/inventory/ui/dialogs/reservation-dialog.tsx");
  const apiSource = read("src/app/api/persistence/inventory/route.ts");
  const { ModuleActivationEngine, bosiacoModuleRegistry } = load("src/platform/modules");
  const { inventoryEditionProfile, editionToActivationRequest } = load("src/platform/editions");
  const { isRouteAvailable } = load("src/platform/modules/module-route-availability.ts");
  const engine = new ModuleActivationEngine(bosiacoModuleRegistry);
  const inventoryActivation = engine.resolve(editionToActivationRequest(inventoryEditionProfile));

  assert(workspaceSource.includes('{ id: "reservations", label: "Réservations" }'), "Inventory workspace should expose the Reservations QA tab.");
  assert(workspaceSource.includes("<ReservationDialog"), "Inventory workspace should render the reservation dialog.");
  assert(dialogSource.includes('persistInventoryOperation(mode === "reserve" ? "reserve" : "release"'), "Reservation dialog should use existing Inventory persistence operations.");
  assert(apiSource.includes('operation: "reserve"') && apiSource.includes('operation: "release"'), "Inventory API should expose reservation operations without a separate route.");
  assert(!isRouteAvailable("/inventory"), "Inventory route should remain unavailable in Alpha.");
  assert(isRouteAvailable("/inventory", inventoryActivation), "Inventory route should remain available under controlled Inventory activation.");
});

test("Inventory Domain Foundation remains inactive in Alpha", () => {
  const {
    bosiacoModuleRegistry,
    getCurrentAlphaActivation
  } = load("src/platform/modules");
  const descriptor = bosiacoModuleRegistry.get("inventory.stock");
  const activation = getCurrentAlphaActivation();

  assert(descriptor, "Inventory module descriptor should exist.");
  assert(descriptor.status === "planned", "Inventory module should remain planned.");
  assert(descriptor.hidden === false, "Inventory module may expose navigation metadata for controlled profiles.");
  assert(!activation.activeModuleIdSet.has("inventory.stock"), "Inventory module should not be active in Alpha.");
});

test("CRM Opportunities Foundation has no Prisma API or platform runtime dependency", () => {
  const opportunityFiles = listFiles("src/modules/crm/opportunities").filter((file) => !file.includes("/ui/"));
  const forbiddenPatterns = [
    /from ["']react["']/,
    /from ["']react-dom["']/,
    /from ["']next\//,
    /@\/components/,
    /@\/providers/,
    /@\/context/,
    /@\/app/,
    /@\/lib\/prisma/,
    /@\/runtime\/plugins/,
    /fetch\(/
  ];

  assert(opportunityFiles.every((file) => !file.endsWith(".tsx")), "CRM Opportunities foundation should not contain UI files.");

  for (const file of opportunityFiles.filter((item) => item.endsWith(".ts"))) {
    const source = read(file);
    for (const pattern of forbiddenPatterns) {
      assert(!pattern.test(source), `CRM Opportunities foundation should not import forbidden dependency in ${file}.`);
    }
  }
});

test("Commercial Documents Foundation registers Alpha documents and planned future documents", () => {
  const {
    commercialDocumentRegistry,
    COMMERCIAL_DOCUMENT_DEFINITIONS,
    getDocumentNumberPrefix
  } = load("src/platform/commercial-documents");
  const validation = commercialDocumentRegistry.validate();
  const quote = commercialDocumentRegistry.get("quote");
  const invoice = commercialDocumentRegistry.get("invoice");
  const planned = COMMERCIAL_DOCUMENT_DEFINITIONS.filter((definition) => definition.status === "planned");

  assert(validation.valid, `Commercial Document Registry should validate: ${validation.errors.join("; ")}`);
  assert(quote?.alphaReady === true && quote.prefix === "DEV", "Quote should be the Alpha-ready DEV document definition.");
  assert(invoice?.alphaReady === true && invoice.prefix === "FAC", "Invoice should be the Alpha-ready FAC document definition.");
  assert(planned.some((definition) => definition.type === "sales-order"), "Sales Orders should remain planned metadata only.");
  assert(planned.some((definition) => definition.type === "delivery-note"), "Delivery Notes should remain planned metadata only.");
  assert(getDocumentNumberPrefix("invoice") === "FAC", "Invoice numbering prefix should be shared by the platform.");
});

test("Commercial Documents Foundation calculates validates and protects document lifecycle", () => {
  const {
    buildCommercialDocument,
    calculateDocumentTotals,
    canTransitionDocument,
    validateCommercialDocument
  } = load("src/platform/commercial-documents");
  const lines = [
    { id: "line-1", description: "Service", quantity: 2, unitPrice: 100, tax: { rate: 20 } },
    { id: "line-2", description: "Support", quantity: 1, unitPrice: 50, tax: { rate: 20 } }
  ];
  const totals = calculateDocumentTotals(lines, "MAD", { rate: 10 });
  const document = {
    header: {
      type: "quote",
      number: "DEV-2026-001",
      issueDate: "2026-07-13T00:00:00.000Z",
      currency: "MAD",
      status: "draft",
      primaryParty: { role: "company", name: "Atlas Medical" }
    },
    lines,
    documentDiscount: { rate: 10 }
  };
  const result = buildCommercialDocument(document);

  assert(totals.subtotal === 250, "Commercial document subtotal should sum line bases.");
  assert(totals.discount === 25, "Commercial document discount should support document-level rates.");
  assert(totals.tax === 45, "Commercial document tax should follow the discounted taxable base.");
  assert(totals.total === 270, "Commercial document total should be taxable plus tax.");
  assert(validateCommercialDocument(document).valid, "Commercial document validation should accept a complete document.");
  assert(result.totals.total === totals.total, "Document engine should compose calculation and validation.");
  assert(canTransitionDocument("quote", "draft", "sent"), "Quote lifecycle should allow draft to sent.");
  assert(canTransitionDocument("quote", "sent", "accepted"), "Quote lifecycle should allow sent to accepted.");
  assert(canTransitionDocument("quote", "sent", "refused"), "Quote lifecycle should allow sent to refused.");
  assert(!canTransitionDocument("quote", "draft", "accepted"), "Quote lifecycle should not allow direct draft to accepted conversion readiness.");
  assert(!canTransitionDocument("quote", "draft", "paid"), "Quote lifecycle should reject unrelated Invoice status transitions.");
});

test("Quote service transitions statuses through the canonical lifecycle", () => {
  const { QuoteService } = load("src/modules/sales/quotes");
  const service = new QuoteService({
    seed: [
      {
        id: "quote-lifecycle-runtime",
        workspaceId: "sales-quotes-main",
        number: "DEV-2026-LIFE",
        customerName: "Atlas Medical",
        companyId: "company-runtime",
        companyName: "Atlas Medical",
        status: "draft",
        issueDate: "2026-07-15T00:00:00.000Z",
        expirationDate: "2026-08-15T00:00:00.000Z",
        validityDays: 30,
        currency: "MAD",
        items: [{ id: "line-1", description: "Prestation", quantity: 1, unitPrice: 1000, taxRate: 20 }],
        discountRate: 0,
        ownerId: "user-runtime",
        createdAt: "2026-07-15T00:00:00.000Z",
        updatedAt: "2026-07-15T00:00:00.000Z"
      }
    ]
  });

  const blocked = service.transitionQuoteStatus("quote-lifecycle-runtime", "sales-quotes-main", "accepted");
  const sent = service.transitionQuoteStatus("quote-lifecycle-runtime", "sales-quotes-main", "sent");
  const accepted = service.transitionQuoteStatus("quote-lifecycle-runtime", "sales-quotes-main", "accepted");
  const refusedAfterAccepted = service.transitionQuoteStatus("quote-lifecycle-runtime", "sales-quotes-main", "refused");

  assert(!blocked.quote && blocked.error, "Quote service should reject direct draft to accepted.");
  assert(sent.quote?.status === "sent", "Quote service should transition draft to sent.");
  assert(accepted.quote?.status === "accepted", "Quote service should transition sent to accepted.");
  assert(!refusedAfterAccepted.quote && refusedAfterAccepted.error, "Quote service should reject terminal accepted to refused.");
});

test("Sales Quote and Invoice totals consume the Commercial Documents calculation engine", () => {
  const { calculateQuoteTotals } = load("src/modules/sales/quotes/quote.utils.ts");
  const { getInvoiceTotals } = load("src/modules/sales/invoices/invoice.utils.ts");
  const items = [
    { id: "line-1", description: "Service", quantity: 2, unitPrice: 100, taxRate: 20 },
    { id: "line-2", description: "Support", quantity: 1, unitPrice: 50, taxRate: 20 }
  ];
  const quoteTotals = calculateQuoteTotals(items, 10, "MAD");
  const invoiceTotals = getInvoiceTotals({
    id: "invoice-1",
    workspaceId: "workspace-main",
    number: "FAC-2026-001",
    customerName: "Atlas Medical",
    companyId: "company-1",
    status: "issued",
    issueDate: "2026-07-13T00:00:00.000Z",
    dueDate: "2026-08-13T00:00:00.000Z",
    currency: "MAD",
    items,
    discountRate: 10,
    ownerId: "user-1",
    paidAmount: 70,
    createdAt: "2026-07-13T00:00:00.000Z",
    updatedAt: "2026-07-13T00:00:00.000Z"
  });

  assert(quoteTotals.subtotal === 250, "Quote totals should preserve existing subtotal semantics.");
  assert(quoteTotals.discount === 25, "Quote totals should preserve existing discount semantics.");
  assert(quoteTotals.tax === 45, "Quote totals should preserve existing tax semantics.");
  assert(quoteTotals.total === 270, "Quote totals should preserve existing grand total semantics.");
  assert(invoiceTotals.total === 270 && invoiceTotals.remaining === 200, "Invoice totals should reuse Quote calculation and keep payment balance.");
});

test("Procurement Foundation stays inactive in Alpha and activates through Purchasing profile", () => {
  const { ModuleActivationEngine, bosiacoModuleRegistry, getCurrentAlphaActivation } = load("src/platform/modules");
  const { purchasingEditionProfile, editionToActivationRequest } = load("src/platform/editions");
  const { isRouteAvailable } = load("src/platform/modules/module-route-availability.ts");
  const engine = new ModuleActivationEngine(bosiacoModuleRegistry);
  const alpha = getCurrentAlphaActivation();
  const purchasing = engine.resolve(editionToActivationRequest(purchasingEditionProfile));

  assert(!alpha.activeModuleIdSet.has("procurement.suppliers"), "Procurement Suppliers should remain inactive in Alpha.");
  assert(!alpha.activeModuleIdSet.has("procurement.goods-receipts"), "Procurement Goods Receipts should remain inactive in Alpha.");
  assert(!isRouteAvailable("/procurement", alpha), "Procurement overview route should be unavailable in Alpha.");
  assert(!isRouteAvailable("/procurement/suppliers", alpha), "Procurement suppliers route should be unavailable in Alpha.");
  assert(!isRouteAvailable("/procurement/goods-receipts", alpha), "Procurement goods receipt route should be unavailable in Alpha.");
  assert(purchasing.activeModuleIdSet.has("procurement.suppliers"), "Purchasing profile should activate Suppliers.");
  assert(purchasing.activeModuleIdSet.has("procurement.purchase-orders"), "Purchasing profile should activate Purchase Orders.");
  assert(purchasing.activeModuleIdSet.has("procurement.goods-receipts"), "Purchasing profile should activate Goods Receipts.");
  assert(purchasing.activeModuleIdSet.has("sales.products"), "Purchasing profile should activate Product Catalog dependency.");
  assert(purchasing.activeModuleIdSet.has("inventory.stock"), "Purchasing profile should activate Inventory Stock for receipt posting.");
  assert(isRouteAvailable("/procurement/purchase-orders", purchasing), "Purchase Orders should be available under Purchasing profile.");
  assert(isRouteAvailable("/procurement/goods-receipts", purchasing), "Goods Receipts should be available under Purchasing profile.");
});

test("Procurement Foundation creates suppliers purchase orders and goods receipt states", () => {
  const {
    ProcurementService,
    PROCUREMENT_WORKSPACE_ID,
    calculatePurchaseOrderTotals,
    createEmptyPurchaseOrderLine,
    getPurchaseOrderReceiptState,
    formatPurchaseOrderNumber
  } = load("src/modules/procurement");
  const service = new ProcurementService({ now: () => "2026-07-13T22:00:00.000Z" });
  const supplierResult = service.createSupplier({
    workspaceId: PROCUREMENT_WORKSPACE_ID,
    companyName: "Atlas Distribution",
    country: "Maroc",
    currency: "MAD"
  });
  const supplier = supplierResult.supplier;
  assert(supplier?.companyName === "Atlas Distribution", "Supplier should be created as a dedicated Procurement entity.");
  assert(formatPurchaseOrderNumber(1) === "PO-2026-000001", "Purchase Order numbering should use the PO prefix.");

  const line = { ...createEmptyPurchaseOrderLine("test"), id: "po-line-runtime-1", productId: "product-runtime-1", productSku: "SKU-001", productName: "Produit achat", description: "Produit achat", quantity: 100, unitPrice: 2, taxRate: 20 };
  const orderResult = service.createPurchaseOrder({
    workspaceId: PROCUREMENT_WORKSPACE_ID,
    supplierId: supplier.id,
    supplierName: supplier.companyName,
    issueDate: "2026-07-13T00:00:00.000Z",
    currency: "MAD",
    lines: [line],
    discountRate: 10
  });
  const order = orderResult.purchaseOrder;
  const totals = calculatePurchaseOrderTotals(order);

  assert(order?.number === "PO-2026-000001", "Purchase Order should be numbered by the shared numbering helper.");
  assert(totals.subtotal === 200, "Purchase Order subtotal should use shared document line calculation.");
  assert(totals.discount === 20, "Purchase Order discount should use shared document discount calculation.");
  assert(totals.tax === 36, "Purchase Order tax should follow discounted taxable base.");
  assert(totals.total === 216, "Purchase Order total should use Commercial Documents totals.");

  const firstReceipt = service.createGoodsReceipt({
    workspaceId: PROCUREMENT_WORKSPACE_ID,
    supplierId: supplier.id,
    supplierName: supplier.companyName,
    purchaseOrderId: order.id,
    purchaseOrderNumber: order.number,
    warehouseId: "warehouse-main",
    receiptDate: "2026-07-13T00:00:00.000Z",
    lines: [{
      id: "gr-line-runtime-1",
      purchaseOrderLineId: line.id,
      productId: line.productId,
      productSku: line.productSku,
      productName: line.productName,
      description: line.description,
      orderedQuantity: 100,
      previouslyReceivedQuantity: 0,
      receivedQuantity: 40,
      unit: line.unit
    }]
  }).goodsReceipt;
  service.markGoodsReceiptPosted(firstReceipt.id, PROCUREMENT_WORKSPACE_ID, "2026-07-13T01:00:00.000Z");
  const partialState = service.getPurchaseOrderReceiptState(order.id, PROCUREMENT_WORKSPACE_ID);
  assert(partialState.receivedQuantity === 40 && partialState.remainingQuantity === 60, "First Goods Receipt should leave a 60 unit remaining quantity.");
  assert(service.getPurchaseOrder(order.id, PROCUREMENT_WORKSPACE_ID).status === "partially_received", "Purchase Order should become partially received after a partial posting.");

  const secondReceipt = service.createGoodsReceipt({
    workspaceId: PROCUREMENT_WORKSPACE_ID,
    supplierId: supplier.id,
    supplierName: supplier.companyName,
    purchaseOrderId: order.id,
    purchaseOrderNumber: order.number,
    warehouseId: "warehouse-main",
    receiptDate: "2026-07-13T02:00:00.000Z",
    lines: [{
      id: "gr-line-runtime-2",
      purchaseOrderLineId: line.id,
      productId: line.productId,
      productSku: line.productSku,
      productName: line.productName,
      description: line.description,
      orderedQuantity: 100,
      previouslyReceivedQuantity: 40,
      receivedQuantity: 60,
      unit: line.unit
    }]
  }).goodsReceipt;
  service.markGoodsReceiptPosted(secondReceipt.id, PROCUREMENT_WORKSPACE_ID, "2026-07-13T03:00:00.000Z");
  const completedState = getPurchaseOrderReceiptState(service.getPurchaseOrder(order.id, PROCUREMENT_WORKSPACE_ID), service.listGoodsReceipts({ workspaceId: PROCUREMENT_WORKSPACE_ID }).goodsReceipts);
  assert(completedState.receivedQuantity === 100 && completedState.remainingQuantity === 0, "Second Goods Receipt should complete the ordered quantity.");
  assert(service.getPurchaseOrder(order.id, PROCUREMENT_WORKSPACE_ID).status === "received", "Purchase Order should become received after all quantities are posted.");
});

test("Procurement Supplier import export uses the shared Import Export framework", () => {
  const {
    createDefaultSupplierImportMapping,
    createSupplierImportTemplateRows,
    supplierToExportRow,
    validateSupplierImportRows
  } = load("src/modules/procurement");
  const headers = ["Raison sociale", "ICE", "Devise", "Actif"];
  const mapping = createDefaultSupplierImportMapping(headers);
  const preview = validateSupplierImportRows([
    { "Raison sociale": "Atlas Distribution", ICE: "001122334455667", Devise: "MAD", Actif: "Oui" }
  ], mapping, { existingSuppliers: [], duplicatePolicy: "stop" });
  const template = createSupplierImportTemplateRows();
  const exported = supplierToExportRow({
    id: "supplier-1",
    workspaceId: "procurement-main",
    companyName: "Atlas Distribution",
    country: "Maroc",
    currency: "MAD",
    status: "active",
    active: true,
    createdAt: "2026-07-13T00:00:00.000Z",
    updatedAt: "2026-07-13T00:00:00.000Z"
  });

  assert(preview.validRows === 1, "Supplier import preview should validate a minimal supplier row.");
  assert(template.length > 0, "Supplier import should expose reusable template rows.");
  assert(exported["Raison sociale"] === "Atlas Distribution", "Supplier export should use shared exporter definitions.");
});

test("Sales Orders stay inactive in Alpha and activate only through Sales Operations profile", () => {
  const { ModuleActivationEngine, bosiacoModuleRegistry, getCurrentAlphaActivation } = load("src/platform/modules");
  const { salesOperationsEditionProfile, editionToActivationRequest } = load("src/platform/editions");
  const { getActiveModuleNavigationItems } = load("src/platform/modules/module-navigation.ts");
  const { isRouteAvailable } = load("src/platform/modules/module-route-availability.ts");
  const { createNavigationCommandRegistry } = load("src/platform/search/command-registry.ts");
  const engine = new ModuleActivationEngine(bosiacoModuleRegistry);
  const alpha = getCurrentAlphaActivation();
  const salesOperations = engine.resolve(editionToActivationRequest(salesOperationsEditionProfile));
  const alphaHrefs = getActiveModuleNavigationItems(alpha).map((item) => item.href);
  const operationsHrefs = getActiveModuleNavigationItems(salesOperations).map((item) => item.href);
  const operationsCommandHrefs = createNavigationCommandRegistry(salesOperations).getAll().map((command) => command.href);

  assert(!alpha.activeModuleIdSet.has("sales.orders"), "Sales Orders should remain inactive in the current Alpha profile.");
  assert(!alphaHrefs.includes("/sales/orders"), "Alpha navigation should not expose Sales Orders.");
  assert(!isRouteAvailable("/sales/orders", alpha), "Sales Orders route should be unavailable in Alpha.");
  assert(salesOperations.errors.length === 0, `Sales Operations profile should resolve cleanly: ${salesOperations.errors.map((issue) => issue.message).join("; ")}`);
  assert(salesOperations.activeModuleIdSet.has("sales.orders"), "Sales Operations profile should activate Sales Orders.");
  assert(salesOperations.activeModuleIdSet.has("sales.products"), "Sales Operations profile should activate Product Catalog for order lines.");
  assert(salesOperations.activeModuleIdSet.has("inventory.stock"), "Sales Operations profile should activate Inventory for reservation checks.");
  assert(operationsHrefs.includes("/sales/orders"), "Sales Operations navigation should expose Sales Orders.");
  assert(isRouteAvailable("/sales/orders", salesOperations), "Sales Orders route should be available under Sales Operations profile.");
  assert(operationsCommandHrefs.includes("/sales/orders"), "Command Center should expose Sales Orders only under Sales Operations profile.");
});

test("Sales Order service creates manual orders and prevents duplicate Quote conversion", () => {
  const {
    SalesOrderService,
    SALES_ORDERS_WORKSPACE_ID,
    calculateSalesOrderTotals,
    createSalesOrderLinesFromQuote,
    formatSalesOrderNumber,
    getSalesOrderReservationStatus
  } = load("src/modules/sales/orders");
  const service = new SalesOrderService({ now: () => "2026-07-14T12:00:00.000Z" });
  const manualResult = service.createOrder({
    workspaceId: SALES_ORDERS_WORKSPACE_ID,
    companyId: "company-runtime-1",
    companyName: "Atlas Medical",
    orderDate: "2026-07-14T00:00:00.000Z",
    currency: "MAD",
    lines: [{
      id: "so-line-runtime-1",
      productId: "product-runtime-1",
      productSku: "SKU-001",
      productName: "Produit runtime",
      description: "Produit runtime",
      quantityOrdered: 3,
      quantityReserved: 0,
      quantityDelivered: 0,
      unit: "unité",
      unitPrice: 100,
      discountRate: 0,
      taxRate: 20,
      position: 1
    }],
    discountRate: 10,
    ownerId: "user-runtime"
  });
  const manualOrder = manualResult.order;
  const totals = calculateSalesOrderTotals(manualOrder);

  assert(manualOrder.number === "SO-2026-000001", "Sales Order numbering should use the SO prefix.");
  assert(formatSalesOrderNumber(2) === "SO-2026-000002", "Sales Order helper should format deterministic SO numbers.");
  assert(totals.subtotal === 300, "Sales Order subtotal should use ordered quantities.");
  assert(totals.discount === 30, "Sales Order discount should follow document discount rate.");
  assert(totals.tax === 54, "Sales Order tax should be calculated on discounted taxable amount.");
  assert(totals.total === 324, "Sales Order total should include tax.");
  assert(getSalesOrderReservationStatus(manualOrder.lines) === "not_reserved", "New manual order should not reserve stock by default.");

  const quote = {
    id: "quote-runtime-1",
    workspaceId: "sales-quotes-main",
    number: "DEV-2026-000001",
    customerName: "Atlas Medical",
    companyId: "company-runtime-1",
    companyName: "Atlas Medical",
    contactId: "contact-runtime-1",
    contactName: "Sara Amrani",
    status: "accepted",
    issueDate: "2026-07-14T00:00:00.000Z",
    expirationDate: "2026-08-14T00:00:00.000Z",
    currency: "MAD",
    items: [{ id: "quote-line-runtime-1", description: "Service conseil", quantity: 2, unitPrice: 250, taxRate: 20 }],
    discountRate: 0,
    ownerId: "user-runtime",
    createdAt: "2026-07-14T00:00:00.000Z",
    updatedAt: "2026-07-14T00:00:00.000Z"
  };
  const convertedLines = createSalesOrderLinesFromQuote(quote);
  const convertedResult = service.createFromQuote(quote, { ownerId: "user-runtime" });
  const duplicateResult = service.createFromQuote(quote, { ownerId: "user-runtime" });

  assert(convertedLines[0].quantityOrdered === 2, "Quote conversion should preserve ordered quantity.");
  assert(convertedResult.order?.workspaceId === SALES_ORDERS_WORKSPACE_ID, "Quote conversion should create the Sales Order in the Sales Orders workspace.");
  assert(convertedResult.order?.sourceQuoteId === quote.id, "Converted Sales Order should preserve source Quote ID.");
  assert(convertedResult.order?.companyId === quote.companyId, "Converted Sales Order should preserve Company relationship.");
  assert(convertedResult.order?.contactId === quote.contactId, "Converted Sales Order should preserve Contact relationship.");
  assert(!duplicateResult.order && duplicateResult.error, "Quote conversion should block duplicate Sales Orders for the same Quote.");
});

test("Sales Order persistence protects Quote conversion workspace and duplicate source links", () => {
  const serviceSource = read("src/modules/sales/orders/order.service.ts");
  const repositorySource = read("src/server/persistence/crm-sales-repository.ts");

  assert(serviceSource.includes("workspaceId: SALES_ORDERS_WORKSPACE_ID"), "Quote conversion should normalize legacy wrong-workspace Sales Orders to the Sales Orders workspace.");
  assert(serviceSource.includes("this.getOrderByQuote(quote.id, SALES_ORDERS_WORKSPACE_ID)"), "Duplicate Quote conversion checks should search the Sales Orders workspace.");
  assert(repositorySource.includes("La commande client doit appartenir à l'espace Commandes clients."), "Server should reject Sales Orders persisted under the Quote workspace.");
  assert(repositorySource.includes("assertUniqueSalesOrderSourceQuote"), "Server should protect against duplicate Sales Orders for one source Quote.");
  assert(repositorySource.includes("tenantCompanyId: scope.companyId") && repositorySource.includes("sourceQuoteId: order.sourceQuoteId"), "Duplicate source Quote protection should be tenant-scoped.");
  assert(repositorySource.includes("NOT: { id: order.id }"), "Duplicate source Quote protection should allow updating the same Sales Order.");
  assert(repositorySource.includes("Une commande client existe déjà pour ce devis"), "Duplicate source Quote protection should return a clear French business error.");
});

test("Sales Order persistence reserves and releases stock without physical issue movements", () => {
  const repositorySource = read("src/server/persistence/crm-sales-repository.ts");

  assert(repositorySource.includes('referenceType: "SALES_ORDER"'), "Sales Order persistence should tag reservation movements with SALES_ORDER.");
  assert(repositorySource.includes('type: "RESERVATION"'), "Sales Order confirmation should use Inventory reservation movements.");
  assert(repositorySource.includes('type: "RELEASE"'), "Sales Order cancellation should release active reservations.");
  assert(!repositorySource.includes('type: "ISSUE"'), "Sales Orders must not physically issue stock; Delivery Notes will own stock decrement.");
});

test("Quote and Invoice lines preserve Product identity while free-form lines stay free-form", () => {
  const {
    createEmptySalesLineItem,
    createSalesLineItemFromProduct,
    normalizeSalesLineItems
  } = load("src/modules/sales/shared");
  const { createInvoiceInputFromQuote } = load("src/modules/sales/invoices");
  const product = {
    id: "prod-runtime-identity",
    workspaceId: "products-catalog",
    sku: "SKU-RUNTIME",
    name: "Produit runtime",
    unit: "piece",
    sellingPrice: 120,
    vatRate: 20,
    purchasePrice: 80,
    currency: "MAD",
    active: true,
    status: "active",
    flags: { trackInventory: true, allowNegativeStock: false, hasVariants: false, serialTracked: false, batchTracked: false },
    createdAt: "2026-07-14T00:00:00.000Z",
    updatedAt: "2026-07-14T00:00:00.000Z"
  };
  const productLine = createSalesLineItemFromProduct(product, "quote-line");
  const freeLine = { ...createEmptySalesLineItem("quote-line"), id: "free-form-line", description: "Service conseil", quantity: 1, unitPrice: 50 };
  const normalized = normalizeSalesLineItems([productLine, freeLine]);
  const quote = {
    id: "quote-product-identity",
    workspaceId: "sales-quotes-main",
    number: "DEV-2026-IDENTITY",
    customerName: "Atlas Medical",
    companyId: "company-runtime-identity",
    companyName: "Atlas Medical",
    status: "accepted",
    issueDate: "2026-07-14T00:00:00.000Z",
    expirationDate: "2026-08-14T00:00:00.000Z",
    currency: "MAD",
    items: normalized,
    discountRate: 0,
    ownerId: "user-runtime",
    createdAt: "2026-07-14T00:00:00.000Z",
    updatedAt: "2026-07-14T00:00:00.000Z"
  };
  const invoiceInput = createInvoiceInputFromQuote(quote);

  assert(normalized[0].productId === product.id, "Product-backed Quote line should keep Product ID.");
  assert(normalized[0].productSku === product.sku, "Product-backed Quote line should keep Product SKU snapshot.");
  assert(normalized[0].productName === product.name, "Product-backed Quote line should keep Product name snapshot.");
  assert(!normalized[1].productId, "Free-form Quote line should not receive a Product ID.");
  assert(invoiceInput.items[0].productId === product.id, "Quote to Invoice should preserve Product ID.");
  assert(!invoiceInput.items[1].productId, "Quote to Invoice should preserve free-form lines.");
});

test("Quote to Sales Order conversion preserves Product identity and reservation eligibility", () => {
  const {
    calculateSalesOrderTotals,
    createSalesOrderLinesFromQuote,
    getSalesOrderReservationStatus
  } = load("src/modules/sales/orders");
  const quote = {
    id: "quote-to-so-product",
    workspaceId: "sales-quotes-main",
    number: "DEV-2026-SO",
    customerName: "Atlas Medical",
    companyId: "company-runtime-identity",
    companyName: "Atlas Medical",
    status: "accepted",
    issueDate: "2026-07-14T00:00:00.000Z",
    expirationDate: "2026-08-14T00:00:00.000Z",
    currency: "MAD",
    items: [
      { id: "product-line", productId: "prod-runtime-identity", productSku: "SKU-RUNTIME", productName: "Produit runtime", description: "Produit runtime", quantity: 8, unit: "piece", unitPrice: 120, taxRate: 20 },
      { id: "free-line", description: "Service conseil", quantity: 1, unit: "service", unitPrice: 50, taxRate: 20 }
    ],
    discountRate: 0,
    ownerId: "user-runtime",
    createdAt: "2026-07-14T00:00:00.000Z",
    updatedAt: "2026-07-14T00:00:00.000Z"
  };
  const lines = createSalesOrderLinesFromQuote(quote);
  const totals = calculateSalesOrderTotals({ lines, currency: "MAD", discountRate: 0 });

  assert(lines[0].productId === "prod-runtime-identity", "Sales Order line should preserve Product ID from Quote.");
  assert(lines[0].productSku === "SKU-RUNTIME", "Sales Order line should preserve SKU snapshot.");
  assert(lines[0].unit === "piece", "Sales Order line should preserve unit.");
  assert(lines[0].quantityOrdered === 8, "Sales Order line should map Quote quantity to quantityOrdered.");
  assert(lines[0].unitPrice === 120, "Sales Order line should preserve negotiated unit price.");
  assert(lines[0].taxRate === 20, "Sales Order line should preserve tax rate.");
  assert(!lines[1].productId, "Free-form Quote line should remain free-form in Sales Order.");
  assert(getSalesOrderReservationStatus(lines) === "not_reserved", "Product-backed unreserved Sales Order line should be reservable but not reserved.");
  assert(getSalesOrderReservationStatus([lines[1]]) === "not_applicable", "Free-form Sales Order line should not be reservation-applicable.");
  assert(totals.subtotal === 1010 && totals.tax === 202 && totals.total === 1212, "Sales Order totals should recalculate from converted line values.");
});

test("Quote to Sales Order conversion keeps QA quantity and totals from persisted numeric values", () => {
  const {
    calculateSalesOrderTotals,
    createSalesOrderLinesFromQuote
  } = load("src/modules/sales/orders");
  const decimalLike = (value) => ({ toNumber: () => value });
  const quote = {
    id: "quote-to-so-qa",
    workspaceId: "sales-quotes-main",
    number: "DEV-2026-QA",
    customerName: "Atlas Medical",
    companyId: "company-runtime-identity",
    companyName: "Atlas Medical",
    status: "accepted",
    issueDate: "2026-07-14T00:00:00.000Z",
    expirationDate: "2026-08-14T00:00:00.000Z",
    currency: "MAD",
    items: [
      { id: "product-a", productId: "product-a", productSku: "P-121", productName: "Product A", description: "Product A", quantity: decimalLike(8), unit: "piece", unitPrice: decimalLike(5000), taxRate: decimalLike(20) },
      { id: "free-a", description: "Service libre", quantity: "2", unit: "service", unitPrice: "1000", taxRate: "20" }
    ],
    discountRate: 0,
    ownerId: "user-runtime",
    createdAt: "2026-07-14T00:00:00.000Z",
    updatedAt: "2026-07-14T00:00:00.000Z"
  };
  const lines = createSalesOrderLinesFromQuote(quote);
  const totals = calculateSalesOrderTotals({ lines, currency: "MAD", discountRate: 0 });

  assert(lines[0].productId === "product-a", "Product-backed converted line should preserve Product ID.");
  assert(lines[0].productSku === "P-121", "Product-backed converted line should preserve SKU.");
  assert(lines[0].quantityOrdered === 8, "Persisted Decimal-like Quote quantity should convert to quantityOrdered=8.");
  assert(lines[0].unitPrice === 5000, "Persisted Decimal-like Quote unit price should remain 5000.");
  assert(lines[0].taxRate === 20, "Persisted Decimal-like Quote tax should remain 20.");
  assert(!lines[1].productId && lines[1].quantityOrdered === 2, "Free-form Quote lines should convert quantity without inferring Product identity.");
  assert(totals.subtotal === 42000, "Converted Sales Order subtotal should include Product and free-form lines.");
  assert(totals.tax === 8400, "Converted Sales Order tax should follow line VAT.");
  assert(totals.total === 50400, "Converted Sales Order total should be recalculated from converted lines.");
});

test("Sales Order dialog preserves converted Product line commercial values", () => {
  const dialogSource = read("src/modules/sales/orders/ui/order-dialog.tsx");
  const repositorySource = read("src/server/persistence/crm-sales-repository.ts");

  assert(dialogSource.includes("currentLine?.productId && currentLine.productId === productId"), "Sales Order dialog should not overwrite converted values when the same Product is already selected.");
  assert(dialogSource.includes("!products.some((product) => product.id === line.productId)"), "Sales Order dialog should display converted Product snapshots before catalog hydration.");
  assert(repositorySource.includes("quantity: decimalToNumber(row.quantity)"), "Persisted Quote lines should hydrate quantity as a plain number.");
  assert(repositorySource.includes("quantityOrdered: decimalToNumber(row.quantityOrdered)"), "Persisted Sales Order lines should hydrate ordered quantity as a plain number.");
});

test("Quote lifecycle actions and conversion readiness are server validated", () => {
  const quoteDetailsSource = read("src/modules/sales/quotes/ui/quote-details-workspace.tsx");
  const routeSource = read("src/app/api/persistence/crm-sales/route.ts");
  const repositorySource = read("src/server/persistence/crm-sales-repository.ts");
  const clientSource = read("src/platform/persistence/crm-sales-persistence.client.ts");

  assert(quoteDetailsSource.includes("Marquer comme envoyé"), "Quote detail should expose draft to sent lifecycle action.");
  assert(quoteDetailsSource.includes("Marquer comme accepté"), "Quote detail should expose sent to accepted lifecycle action.");
  assert(quoteDetailsSource.includes("Marquer comme refusé"), "Quote detail should expose sent to refused lifecycle action.");
  assert(quoteDetailsSource.includes('available: salesOrdersEnabled && quoteValue.status === "accepted"'), "Sales Order conversion action should remain accepted-only in the UI.");
  assert(clientSource.includes("transitionPersistedQuoteStatus"), "Client persistence should expose a shared Quote status transition call.");
  assert(routeSource.includes('"transitionQuoteStatus"'), "CRM/Sales persistence API should expose a dedicated Quote transition operation.");
  assert(repositorySource.includes("validateQuoteStatusTransition"), "Quote status changes should be validated in the persistence repository.");
  assert(repositorySource.includes("Un nouveau devis doit être créé en brouillon."), "Server should prevent directly creating non-draft Quotes.");
  assert(repositorySource.includes("Une commande client ne peut être créée qu'à partir d'un devis accepté."), "Server should block Sales Order conversion when the source Quote is not accepted.");
  assert(repositorySource.includes("La commande client doit appartenir à l'espace Commandes clients."), "Server should reject Sales Orders persisted under the Quote workspace.");
});

test("Sales Order reservation persistence uses remaining quantity only", () => {
  const repositorySource = read("src/server/persistence/crm-sales-repository.ts");

  assert(repositorySource.includes("line.quantityOrdered - line.quantityReserved"), "Reservation should calculate remaining quantity from ordered minus already reserved.");
  assert(repositorySource.includes("line.quantityReserved + quantityToReserve"), "Reservation should add only the newly reserved quantity.");
  assert(repositorySource.includes('throw new Error("Cette commande client est déjà annulée.")'), "Duplicate cancellation should be rejected.");
  assert(repositorySource.includes("Produit non suivi en stock") || read("src/modules/sales/orders/ui/order-details-workspace.tsx").includes("Produit non suivi en stock"), "UI should explain non-inventory Product reservation ineligibility.");
  assert(read("src/modules/sales/shared/sales-line-items-editor.tsx").includes("productId: undefined"), "Clearing Product selection should remove stale Product identity.");
});

test("Product Catalog exposes stockable and non-stocked Product classification", () => {
  const { ProductService, PRODUCTS_WORKSPACE_ID } = load("src/modules/products");
  const service = new ProductService({
    now: () => "2026-07-14T17:30:00.000Z",
    createProductId: (() => {
      let count = 0;
      return () => `product-classification-${++count}`;
    })()
  });
  const stockable = service.createProduct({
    workspaceId: PRODUCTS_WORKSPACE_ID,
    sku: "STOCK-A",
    name: "Produit stockable A",
    sellingPrice: 2000,
    flags: { trackInventory: true }
  }).product;
  const serviceProduct = service.createProduct({
    workspaceId: PRODUCTS_WORKSPACE_ID,
    sku: "SERV-A",
    name: "Service A",
    sellingPrice: 800,
    flags: { trackInventory: false }
  }).product;
  const updated = service.updateProduct({
    id: serviceProduct.id,
    workspaceId: PRODUCTS_WORKSPACE_ID,
    sku: "SERV-A",
    name: "Service A",
    sellingPrice: 800,
    flags: { trackInventory: true }
  }).product;

  assert(stockable.flags.trackInventory, "Created stockable Product should keep trackInventory=true.");
  assert(!serviceProduct.flags.trackInventory, "Created service Product should keep trackInventory=false.");
  assert(updated.flags.trackInventory, "SERVICE to STOCKABLE should be allowed at Product service level.");
});

test("Inventory manual operations only offer active stockable Products", () => {
  const hookSource = read("src/modules/inventory/ui/hooks/use-inventory-workspace.ts");
  const dialogSource = read("src/modules/inventory/ui/dialogs/inventory-operation-dialog.tsx");

  assert(hookSource.includes("product.active && product.flags.trackInventory"), "Inventory Product picker should filter to active stockable Products.");
  assert(dialogSource.includes("La sélection utilise le catalogue produit canonique."), "Inventory operation dialog should use the canonical Product picker.");
});

test("Warehouse persistence and manual receipt use the authenticated tenant and canonical warehouse source", () => {
  const hookSource = read("src/modules/inventory/ui/hooks/use-inventory-workspace.ts");
  const dialogSource = read("src/modules/inventory/ui/dialogs/inventory-operation-dialog.tsx");
  const warehouseDialogSource = read("src/modules/inventory/ui/dialogs/warehouse-dialog.tsx");
  const clientSource = read("src/platform/persistence/inventory-persistence.client.ts");
  const routeSource = read("src/app/api/persistence/inventory/route.ts");
  const repositorySource = read("src/server/persistence/inventory-repository.ts");

  assert(hookSource.includes('activeCompanyId') && !hookSource.includes('"company-bosiaco"'), "Inventory workspace should use the authenticated demo tenant instead of the stale company-bosiaco scope.");
  assert(hookSource.includes("inventoryLocalService.getSnapshot(INVENTORY_COMPANY_ID)"), "Warehouse table should read the canonical Inventory snapshot.");
  assert(dialogSource.includes("warehouses={activeWarehouses}") || dialogSource.includes("warehouses: readonly Warehouse[]"), "Manual receipt selector should consume workspace Warehouses.");
  assert(warehouseDialogSource.includes('await persistInventoryOperation("createWarehouse"'), "Warehouse success should wait for persistence.");
  assert(clientSource.includes("if (body.snapshot) applyInventorySnapshot(body.snapshot)"), "Inventory POST should hydrate the returned canonical snapshot.");
  assert(routeSource.includes("snapshot: await loadInventorySnapshot(scope)"), "Inventory API should return a fresh tenant snapshot after writes.");
  assert(repositorySource.includes("companyId: scope.companyId"), "Warehouse persistence should use server tenant scope.");
});

test("Inventory posting rejects non-stocked Products and normalizes quantity at persistence boundary", () => {
  const repositorySource = read("src/server/persistence/inventory-repository.ts");
  const operationDialogSource = read("src/modules/inventory/ui/dialogs/inventory-operation-dialog.tsx");
  const reservationDialogSource = read("src/modules/inventory/ui/dialogs/reservation-dialog.tsx");

  assert(repositorySource.includes("normalizeInventoryQuantity(input.quantity)"), "Inventory repository should normalize posted quantities before persistence.");
  assert(repositorySource.includes("!product.trackInventory"), "Inventory repository should reject non-inventory Products.");
  assert(repositorySource.includes("Produit non suivi en stock."), "Inventory repository should return a French non-stocked Product error.");
  assert(operationDialogSource.includes('type="text"') && operationDialogSource.includes('inputMode="decimal"'), "Manual receipt quantity should use controlled decimal input.");
  assert(operationDialogSource.includes("parseInventoryQuantityInput(form.quantity)"), "Manual receipt should parse locale-aware quantities before submit.");
  assert(operationDialogSource.includes("adjustInventoryQuantityInput"), "Manual receipt Arrow increments should use the canonical quantity helper.");
  assert(reservationDialogSource.includes("parseInventoryQuantityInput(form.quantity)"), "Reservation quantity should use the same canonical quantity parser.");
});

test("Product UI and persistence protect unsafe stockable to service transitions", () => {
  const dialogSource = read("src/modules/products/ui/dialogs/product-dialog.tsx");
  const hookSource = read("src/modules/products/ui/hooks/use-products-page.ts");
  const repositorySource = read("src/server/persistence/product-catalog-repository.ts");

  assert(dialogSource.includes("Produit stockable"), "Product dialog should expose a stockable Product choice.");
  assert(dialogSource.includes("Service / non stocké"), "Product dialog should expose a non-stocked service choice.");
  assert(dialogSource.includes("comportement de stock"), "Product dialog copy should no longer say the catalog is without inventory.");
  assert(hookSource.includes("trackInventory: true"), "New Product form should default to explicit stockable classification.");
  assert(hookSource.includes("hasInventoryHistory"), "Product edit UI should guard unsafe stockable to service transition.");
  assert(repositorySource.includes("assertSafeTrackingPolicyChange"), "Product persistence should guard unsafe stockable to service transition server-side.");
  assert(repositorySource.includes("inventoryBalance.count"), "Server guard should inspect Inventory balances.");
  assert(repositorySource.includes("inventoryStockMovement.count"), "Server guard should inspect Inventory movement history.");
});

test("Current Alpha remains the only default Edition after Inventory-tracked Product QA fix", () => {
  const { alphaCrmSalesEditionProfile, salesOperationsEditionProfile } = load("src/platform/editions");

  assert(alphaCrmSalesEditionProfile.defaultForEnvironment === true, "alpha.crm-sales should remain the default profile.");
  assert(salesOperationsEditionProfile.defaultForEnvironment === false, "sales-operations should remain disabled by default after QA restoration.");
});

test("Delivery Note draft preserves source identities and remaining quantities without stock mutation", () => {
  const { DeliveryNoteService, DELIVERY_NOTES_WORKSPACE_ID, formatDeliveryNoteNumber, getRemainingToDeliver } = load("src/modules/sales/delivery-notes");
  const service = new DeliveryNoteService({ now: () => "2026-07-15T12:00:00.000Z" });
  const stockBefore = Object.freeze({ quantityOnHand: 20, quantityReserved: 8, quantityAvailable: 12 });
  const deliveredBefore = 0;
  const result = service.createDeliveryNote({
    workspaceId: DELIVERY_NOTES_WORKSPACE_ID,
    companyId: "crm-company-delivery",
    companyName: "Atlas Medical",
    salesOrderId: "sales-order-delivery",
    salesOrderNumber: "SO-2026-000001",
    warehouseId: "warehouse-delivery",
    warehouseName: "Entrepôt principal",
    deliveryDate: "2026-07-15T00:00:00.000Z",
    lines: [{
      id: "delivery-line-1",
      salesOrderLineId: "sales-order-line-1",
      productId: "product-delivery",
      productSku: "PROD-A",
      productName: "Product A",
      description: "Product A",
      unit: "piece",
      quantityToDeliver: 3,
      quantityPosted: 0
    }]
  });

  assert(result.deliveryNote.status === "draft", "New Delivery Note should remain draft.");
  assert(result.deliveryNote.number === formatDeliveryNoteNumber(1), "Delivery Note should use canonical BL numbering.");
  assert(result.deliveryNote.salesOrderId === "sales-order-delivery", "Delivery Note should preserve Sales Order identity.");
  assert(result.deliveryNote.lines[0].productId === "product-delivery", "Delivery Note should preserve Product identity.");
  assert(result.deliveryNote.lines[0].quantityPosted === 0, "Draft creation should not post any quantity.");
  assert(stockBefore.quantityOnHand === 20 && stockBefore.quantityReserved === 8 && stockBefore.quantityAvailable === 12, "Draft creation should not mutate stock state.");
  assert(deliveredBefore === 0, "Draft creation should not mutate Sales Order delivered quantity.");
  assert(getRemainingToDeliver({ quantityOrdered: 8, quantityDelivered: 3 }) === 5, "Remaining quantity should be ordered minus delivered.");
});

test("Delivery Note quantity input reuses canonical Inventory precision without stepping drift", () => {
  const {
    adjustInventoryQuantityInput,
    normalizeInventoryQuantity,
    parseInventoryQuantityInput
  } = load("src/modules/inventory/inventory.utils.ts");
  const {
    getProjectedRemainingToDeliver,
    isValidDeliveryNoteQuantity,
    parseDeliveryNoteQuantity
  } = load("src/modules/sales/delivery-notes/delivery-note.utils.ts");
  const dialogSource = read("src/modules/sales/delivery-notes/ui/delivery-note-dialog.tsx");

  const steppedUp = adjustInventoryQuantityInput("3", 1);
  const steppedBackDown = adjustInventoryQuantityInput(steppedUp, -1);
  assert(steppedUp === "4", "Delivery quantity Arrow Up should increment deterministically.");
  assert(steppedBackDown === "3", "Delivery quantity 3 stepped up and down should return exactly to 3.");
  assert(!steppedBackDown.includes("000003"), "Delivery stepping should never produce the 3.000003 regression.");
  assert(parseInventoryQuantityInput("2,5") === 2.5, "Canonical quantity parsing should accept a French comma.");
  assert(parseDeliveryNoteQuantity("2.5") === 2.5, "Delivery quantity parsing should accept a decimal point.");
  assert(normalizeInventoryQuantity(3.0000000000000004) === 3, "Binary floating artifacts should normalize to canonical precision.");
  assert(!isValidDeliveryNoteQuantity(0), "Zero Delivery quantity should be rejected.");
  assert(!isValidDeliveryNoteQuantity(-1), "Negative Delivery quantity should be rejected.");
  assert(!isValidDeliveryNoteQuantity(Number.NaN), "NaN Delivery quantity should be rejected.");
  assert(!isValidDeliveryNoteQuantity(Number.POSITIVE_INFINITY), "Infinite Delivery quantity should be rejected.");
  assert(getProjectedRemainingToDeliver({ quantityOrdered: 8, quantityDelivered: 0 }, 3) === 5, "Draft projected remainder should be 5 after a quantity of 3.");
  assert(dialogSource.includes('type="text"') && dialogSource.includes('inputMode="decimal"'), "Delivery quantity should use a controlled decimal text input.");
  assert(dialogSource.includes("adjustInventoryQuantityInput"), "Delivery Arrow handling should reuse the canonical Inventory adjustment helper.");
  assert(!dialogSource.includes('step="0.000001"'), "Delivery quantity should not use fragile native micro-stepping.");
});

test("Delivery Note persistence normalizes one trusted quantity across posting subsystems", () => {
  const source = read("src/server/persistence/delivery-note-repository.ts");
  const detailsSource = read("src/modules/sales/delivery-notes/ui/delivery-note-details-workspace.tsx");

  assert(source.includes("normalizeDeliveryNoteDraft(note)"), "Draft persistence should normalize quantities at the trusted server boundary.");
  assert(source.includes("requirePositiveDeliveryQuantity(line.quantityToDeliver)"), "Posting should reject invalid persisted quantities after canonical parsing.");
  assert(source.includes("Math.min(quantity, orderLine.quantityReserved)"), "Reservation consumption should use the normalized posting quantity.");
  assert(source.includes("quantityDelivered: normalizeInventoryQuantity(orderLine.quantityDelivered + quantity)"), "Sales Order delivered quantity should use the same normalized posting quantity.");
  assert(source.includes("quantityReserved: normalizeInventoryQuantity"), "Remaining Sales Order reservation should be normalized after consumption.");
  assert(source.includes('type: "ISSUE"') && source.includes("quantity,"), "Inventory ISSUE should receive the normalized posting quantity.");
  assert(detailsSource.includes("Reliquat après ce BL"), "Draft details should name the projected remainder clearly.");
  assert(detailsSource.includes("getProjectedRemainingToDeliver"), "Draft projected remainder should subtract the current draft quantity.");
});

test("Delivery Note posting is transactionally guarded and consumes reservation through Inventory ISSUE", () => {
  const source = read("src/server/persistence/delivery-note-repository.ts");
  const inventorySource = read("src/server/persistence/inventory-repository.ts");
  const salesOrderSource = read("src/server/persistence/crm-sales-repository.ts");

  assert(source.includes('isolationLevel: "Serializable"'), "Delivery posting should use a serializable Prisma transaction.");
  assert(source.includes('type: "ISSUE"'), "Delivery posting should create Inventory ISSUE movements.");
  assert(source.includes('referenceType: "DELIVERY_NOTE"'), "Inventory ISSUE should reference the Delivery Note semantically.");
  assert(source.includes("consumeInventoryReservationInTransaction"), "Delivery posting should consume existing reservation first.");
  assert(inventorySource.includes("consumeInventoryReservationInTransaction"), "Inventory repository should own reservation consumption.");
  assert(source.includes("quantityDelivered: normalizeInventoryQuantity(orderLine.quantityDelivered + quantity)"), "Posting should increment and normalize delivered quantity.");
  assert(source.includes('status: allDelivered ? "delivered" : anyDelivered ? "partially_delivered"'), "Posting should update Sales Order delivery status.");
  assert(source.includes("Ce bon de livraison est déjà posté."), "Duplicate posting should be rejected clearly.");
  assert(source.includes("La quantité dépasse le reliquat à livrer."), "Over-delivery should be rejected.");
  assert(source.includes("Stock disponible insuffisant") || inventorySource.includes("Stock disponible insuffisant"), "Insufficient stock should be rejected by Inventory.");
  assert(salesOrderSource.includes("Cette commande contient déjà des quantités livrées et ne peut pas être annulée."), "Delivered Sales Orders should reject simple cancellation.");
  assert(source.includes("tenantCompanyId: scope.companyId"), "Delivery Note persistence should remain tenant-scoped.");
});

test("Delivery Notes are hidden in Alpha and available only in Sales Operations", () => {
  const { ModuleActivationEngine, bosiacoModuleRegistry, getCurrentAlphaActivation } = load("src/platform/modules");
  const { salesOperationsEditionProfile, editionToActivationRequest } = load("src/platform/editions");
  const { getActiveModuleNavigationItems } = load("src/platform/modules/module-navigation.ts");
  const { isRouteAvailable } = load("src/platform/modules/module-route-availability.ts");
  const { createNavigationCommandRegistry } = load("src/platform/search/command-registry.ts");
  const engine = new ModuleActivationEngine(bosiacoModuleRegistry);
  const alpha = getCurrentAlphaActivation();
  const salesOperations = engine.resolve(editionToActivationRequest(salesOperationsEditionProfile));
  const alphaHrefs = getActiveModuleNavigationItems(alpha).map((item) => item.href);
  const operationsHrefs = getActiveModuleNavigationItems(salesOperations).map((item) => item.href);
  const commandHrefs = createNavigationCommandRegistry(salesOperations).getAll().map((command) => command.href);

  assert(!alpha.activeModuleIdSet.has("sales.delivery-notes"), "Alpha should keep Delivery Notes inactive.");
  assert(!alphaHrefs.includes("/sales/delivery-notes"), "Alpha navigation should hide Delivery Notes.");
  assert(!isRouteAvailable("/sales/delivery-notes", alpha), "Alpha route policy should block Delivery Notes.");
  assert(salesOperations.errors.length === 0, "Sales Operations should resolve Delivery Note dependencies.");
  assert(salesOperations.activeModuleIdSet.has("sales.delivery-notes"), "Sales Operations should activate Delivery Notes.");
  assert(operationsHrefs.includes("/sales/delivery-notes"), "Sales Operations navigation should expose Delivery Notes.");
  assert(commandHrefs.includes("/sales/delivery-notes"), "Command Center should expose Delivery Notes only when active.");
});

test("Delivery Note PDF remains non-financial", () => {
  const source = read("src/modules/sales/documents/sales-document-pdf.utils.ts");
  const previewSource = read("src/modules/sales/documents/sales-document-template.tsx");
  const pdfSource = read("src/lib/pdf.ts");

  assert(source.includes("buildDeliveryNotePdfDocument"), "Sales PDF adapter should support Delivery Notes.");
  assert(source.includes("hideFinancials: true"), "Delivery Note PDF should explicitly hide financial information.");
  assert(previewSource.includes("document.hideFinancials"), "PDF preview should hide price columns for Delivery Notes.");
  assert(pdfSource.includes("document.hideFinancials"), "Downloaded and printed PDFs should hide financial totals for Delivery Notes.");
});

const failures = results.filter((result) => result.status === "fail");

for (const result of results) {
  if (result.status === "pass") {
    console.log(`✓ ${result.name}`);
  } else {
    console.error(`✗ ${result.name}`);
    console.error(result.error instanceof Error ? result.error.message : result.error);
  }
}

if (failures.length > 0) {
  console.error(`\nRuntime validation failed: ${failures.length}/${results.length} checks failed.`);
  process.exit(1);
}

console.log(`\nRuntime validation passed: ${results.length}/${results.length} checks passed.`);
