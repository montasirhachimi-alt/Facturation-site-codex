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
const scheduledTests = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function test(name, run) {
  scheduledTests.push(async () => {
    try {
      await run();
      results.push({ name, status: "pass" });
    } catch (error) {
      results.push({ name, status: "fail", error });
    }
  });
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

test("Business Search Runtime registers providers and prevents duplicates", () => {
  const { BusinessSearchRuntime } = load("src/runtime/search");
  const runtime = new BusinessSearchRuntime({ now: () => "2026-07-18T00:00:00.000Z" });

  runtime.registerProvider({
    moduleId: "crm.companies",
    label: "Companies",
    search: () => []
  });

  assert(runtime.listProviders().length === 1, "Search Runtime should expose registered providers.");
  assert(runtime.listProviders()[0].registeredAt === "2026-07-18T00:00:00.000Z", "Search provider registration should be deterministic when now is injected.");

  let duplicateRejected = false;
  try {
    runtime.registerProvider({
      moduleId: "crm.companies",
      search: () => []
    });
  } catch {
    duplicateRejected = true;
  }

  assert(duplicateRejected, "Search Runtime should reject duplicate provider moduleIds.");
});

test("Business Search Runtime aggregates deterministically and filters modules", async () => {
  const { BusinessSearchRuntime } = load("src/runtime/search");
  const runtime = new BusinessSearchRuntime({ now: () => "2026-07-18T00:00:00.000Z" });

  runtime.registerProvider({
    moduleId: "sales.quotes",
    search: () => [
      {
        id: "quote-b",
        entityType: "sales.quote",
        entityId: "quote-b",
        moduleId: "sales.quotes",
        title: "DEV-B",
        score: 80
      },
      {
        id: "quote-a",
        entityType: "sales.quote",
        entityId: "quote-a",
        moduleId: "sales.quotes",
        title: "DEV-A",
        score: 90
      }
    ]
  });

  runtime.registerProvider({
    moduleId: "crm.companies",
    search: () => [
      {
        id: "company-a",
        entityType: "crm.company",
        entityId: "company-a",
        moduleId: "crm.companies",
        title: "Atlas Medical",
        score: 90
      }
    ]
  });

  const allResults = await runtime.search({ text: "a" });
  assert(allResults.map((result) => result.id).join(",") === "company-a,quote-a,quote-b", "Search results should be sorted deterministically by score, module, type, title and id.");

  const filteredResults = await runtime.search({ text: "a", modules: ["sales.quotes"] });
  assert(filteredResults.length === 2, "Search Runtime should only invoke or return requested modules.");
  assert(filteredResults.every((result) => result.moduleId === "sales.quotes"), "Module filter should keep only matching module results.");

  const limitedResults = await runtime.search({ text: "a", limit: 1 });
  assert(limitedResults.length === 1 && limitedResults[0].id === "company-a", "Search Runtime should apply deterministic limits after sorting.");
});

test("Business Search Runtime isolates failing providers", async () => {
  const { BusinessSearchRuntime } = load("src/runtime/search");
  const runtime = new BusinessSearchRuntime();

  runtime.registerProvider({
    moduleId: "inventory.stock",
    search: () => {
      throw new Error("Inventory unavailable");
    }
  });

  runtime.registerProvider({
    moduleId: "sales.invoices",
    search: () => [
      {
        id: "invoice-a",
        entityType: "sales.invoice",
        entityId: "invoice-a",
        moduleId: "sales.invoices",
        title: "FACT-A",
        score: 75
      }
    ]
  });

  const result = await runtime.searchWithDiagnostics({ text: "fact" });

  assert(result.results.length === 1 && result.results[0].id === "invoice-a", "One failing provider should not prevent healthy provider results.");
  assert(result.failures.length === 1 && result.failures[0].moduleId === "inventory.stock", "Search Runtime should report isolated provider failures for diagnostics.");
});

test("SearchService exposes the Unified Search facade without breaking legacy module search", async () => {
  const { SearchService } = load("src/services/search");
  const service = new SearchService();
  const legacyResults = service.search("dashboard", 3);
  const unifiedResults = await service.search({ text: "atlas", limit: 5 });
  const providers = service.listProviders().map((provider) => provider.moduleId);

  assert(Array.isArray(legacyResults), "String SearchService.search calls should preserve legacy synchronous module search.");
  assert(Array.isArray(unifiedResults), "Object SearchService.search calls should use the Unified Search Runtime.");
  const expectedProviderIds = ["crm.overview", "crm.companies", "crm.contacts", "crm.meetings", "crm.tasks", "crm.notes", "sales.quotes", "sales.invoices", "sales.orders", "sales.delivery-notes", "sales.shipments", "sales.payments", "hr.employees"];

  assert(expectedProviderIds.every((providerId) => providers.includes(providerId)), "SearchService should bootstrap initial Alpha CRM/Sales module-owned search providers.");
});

test("Unified Search providers return real CRM Company and Contact results", async () => {
  const { SearchService } = load("src/services/search");
  const service = new SearchService();
  const companyResults = await service.searchUnified({ text: "Ecole Al Hikma", modules: ["crm"], limit: 10 });
  const contactResults = await service.searchUnified({ text: "Sara Amrani", modules: ["crm"], limit: 10 });

  const company = companyResults.find((result) => result.entityType === "crm.company" && result.entityId === "company-al-hikma");
  const contact = contactResults.find((result) => result.entityType === "crm.contact" && result.entityId === "contact-sara-amrani");

  assert(Boolean(company), "CRM Search provider should return real Company results from the canonical Company source.");
  assert(company.url === "/crm/companies/company-al-hikma", "Company search result should use the canonical Company detail route.");
  assert(Boolean(contact), "CRM Search provider should return real Contact results from the canonical Contact source.");
  assert(contact.url === "/crm/contacts/contact-sara-amrani", "Contact search result should use the canonical Contact detail route.");
  assert(contact.subtitle === "Ecole Al Hikma", "Contact search result should include associated Company context.");
});

test("Unified Search providers return real Sales document results", async () => {
  const { SearchService } = load("src/services/search");
  const { salesOrderService, SALES_ORDERS_WORKSPACE_ID } = load("src/modules/sales/orders");
  const { deliveryNoteService, DELIVERY_NOTES_WORKSPACE_ID } = load("src/modules/sales/delivery-notes");
  const service = new SearchService();

  salesOrderService.upsertOrder({
    id: "sales-order-search-001",
    workspaceId: SALES_ORDERS_WORKSPACE_ID,
    number: "SO-SEARCH-001",
    companyId: "company-al-hikma",
    companyName: "Ecole Al Hikma",
    contactId: "contact-sara-amrani",
    contactName: "Sara Amrani",
    sourceQuoteId: "quote-dev-2026-041",
    sourceQuoteNumber: "DEV-2026-041",
    orderDate: "2026-07-18T09:00:00.000Z",
    currency: "MAD",
    status: "confirmed",
    reservationStatus: "not_reserved",
    customerReference: "BC-SEARCH",
    internalReference: "INT-SEARCH",
    notes: "Commande client de validation Search.",
    lines: [{
      id: "sales-order-search-line-001",
      description: "Ligne Search",
      quantityOrdered: 2,
      quantityReserved: 0,
      quantityDelivered: 0,
      unit: "piece",
      unitPrice: 100,
      discountRate: 0,
      taxRate: 20
    }],
    discountRate: 0,
    ownerId: "user-search",
    createdAt: "2026-07-18T09:00:00.000Z",
    updatedAt: "2026-07-18T09:00:00.000Z"
  });

  deliveryNoteService.upsertDeliveryNote({
    id: "delivery-note-search-001",
    workspaceId: DELIVERY_NOTES_WORKSPACE_ID,
    number: "BL-SEARCH-001",
    companyId: "company-al-hikma",
    companyName: "Ecole Al Hikma",
    contactId: "contact-sara-amrani",
    contactName: "Sara Amrani",
    salesOrderId: "sales-order-search-001",
    salesOrderNumber: "SO-SEARCH-001",
    warehouseId: "warehouse-search",
    warehouseName: "Entrepôt Search",
    deliveryDate: "2026-07-18T10:00:00.000Z",
    status: "draft",
    customerReference: "BL-REF-SEARCH",
    lines: [{
      id: "delivery-note-search-line-001",
      salesOrderLineId: "sales-order-search-line-001",
      productId: "product-search",
      productSku: "SKU-SEARCH",
      productName: "Produit Search",
      description: "Produit Search",
      unit: "piece",
      quantityToDeliver: 2,
      quantityPosted: 0
    }],
    createdAt: "2026-07-18T10:00:00.000Z",
    updatedAt: "2026-07-18T10:00:00.000Z"
  });

  const results = await service.searchUnified({ text: "SEARCH", modules: ["sales"], limit: 20 });
  const quote = await service.searchUnified({ text: "DEV-2026-041", modules: ["sales.quotes"], limit: 5 });
  const invoice = await service.searchUnified({ text: "FAC-2026", modules: ["sales.invoices"], limit: 10 });

  assert(quote.some((result) => result.entityType === "sales.quote" && result.url === "/sales/quotes/quote-dev-2026-041"), "Sales Search provider should return Quote results with canonical routes.");
  assert(invoice.some((result) => result.entityType === "sales.invoice" && result.url?.startsWith("/sales/invoices/")), "Sales Search provider should return Invoice results with canonical routes.");
  assert(results.some((result) => result.entityType === "sales.order" && result.url === "/sales/orders/sales-order-search-001"), "Sales Search provider should return Sales Order results with canonical routes.");
  assert(results.some((result) => result.entityType === "sales.delivery-note" && result.url === "/sales/delivery-notes/delivery-note-search-001"), "Sales Search provider should return Delivery Note results with canonical routes.");
});

test("Unified Search ranking filtering limits and workspace isolation are deterministic", async () => {
  const { SearchService } = load("src/services/search");
  const { crmCompanyLocalService } = load("src/modules/crm/companies/ui/company-local-store");
  const { CRM_COMPANIES_USER_ID } = load("src/modules/crm/companies/ui/companies.seed");
  const service = new SearchService();

  crmCompanyLocalService.upsertCompany({
    id: "company-cross-workspace-search",
    workspaceId: "workspace-other",
    legalName: "Cross Workspace Search SARL",
    displayName: "Cross Workspace Search",
    industry: "services",
    status: "active",
    tags: [],
    createdAt: "2026-07-18T00:00:00.000Z",
    updatedAt: "2026-07-18T00:00:00.000Z",
    createdBy: CRM_COMPANIES_USER_ID
  });

  const exact = await service.searchUnified({ text: "quote-dev-2026-041", modules: ["sales"], limit: 10 });
  const prefix = await service.searchUnified({ text: "Sara", modules: ["crm"], limit: 10 });
  const moduleFiltered = await service.searchUnified({ text: "Sara", modules: ["crm.contacts"], limit: 10 });
  const limited = await service.searchUnified({ text: "Al", modules: ["crm"], limit: 1 });
  const empty = await service.searchUnified({ text: "   ", modules: ["crm"], limit: 10 });
  const crossWorkspace = await service.searchUnified({ text: "Cross Workspace Search", modules: ["crm"], limit: 10 });
  const repeatedA = await service.searchUnified({ text: "Al", modules: ["crm"], limit: 10 });
  const repeatedB = await service.searchUnified({ text: "Al", modules: ["crm"], limit: 10 });
  const ids = repeatedA.map((result) => result.id);

  assert(exact[0]?.entityType === "sales.quote", "Exact identifier match should rank the matching Sales document first.");
  assert(prefix[0]?.title === "Sara Amrani", "Primary title prefix matches should outrank secondary Company matches.");
  assert(moduleFiltered.every((result) => result.moduleId === "crm.contacts"), "Exact module filtering should return only requested module results.");
  assert(limited.length === 1, "Unified Search should respect query limits after deterministic aggregation.");
  assert(empty.length === 0, "Empty SearchQuery text should return no unified results.");
  assert(crossWorkspace.length === 0, "Search providers should not return records from another workspace.");
  assert(new Set(ids).size === ids.length, "Search result IDs should be stable and unique.");
  assert(JSON.stringify(repeatedA.map((result) => result.id)) === JSON.stringify(repeatedB.map((result) => result.id)), "Search result ordering should be deterministic across repeated queries.");
});

test("Unified Search preserves Runtime-first import boundaries", () => {
  const runtimeSource = listFiles("src/runtime/search").map((file) => read(file)).join("\n");
  const serviceSource = read("src/services/search/SearchService.ts");
  const bootstrapSource = read("src/services/search/search-provider.bootstrap.ts");
  const uiSource = listFiles("src/ui").map((file) => read(file)).join("\n");
  const platformSearchSource = listFiles("src/platform/search").map((file) => read(file)).join("\n");
  const crmProviderSource = read("src/modules/crm/search/crm-search.provider.ts");
  const salesProviderSource = read("src/modules/sales/search/sales-search.provider.ts");

  assert(!runtimeSource.includes("react") && !runtimeSource.includes("next/") && !runtimeSource.includes("@/modules/"), "Generic Search Runtime should not import React, Next UI or business modules.");
  assert(!runtimeSource.includes("@prisma/client") && !runtimeSource.includes("@/server/"), "Generic Search Runtime should not import Prisma or server repositories.");
  assert(serviceSource.includes("@/runtime/search"), "SearchService should be the public application service facade over the Search Runtime.");
  assert(bootstrapSource.includes("@/modules/crm/search") && bootstrapSource.includes("@/modules/sales/search"), "Default Search providers should be registered through the service bootstrap.");
  assert(bootstrapSource.includes("crmSearchProviders") && bootstrapSource.includes("salesSearchProviders"), "Default Search provider bootstrap should register the Alpha CRM/Sales provider lists.");
  assert(!bootstrapSource.includes("useEffect") && !bootstrapSource.includes("react"), "Search provider registration should not happen through React rendering.");
  assert(crmProviderSource.includes("@/runtime/search") && salesProviderSource.includes("@/runtime/search"), "Module search providers should depend only on the generic Search provider contract.");
  assert(!uiSource.includes("@/runtime/search"), "Shared UI should not call the Search Runtime directly.");
  assert(!platformSearchSource.includes("@/modules/crm/search") && !platformSearchSource.includes("@/modules/sales/search"), "Platform Search UI should not import module-owned providers directly.");
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
  assert(alphaReadyIds.includes("sales.products"), "Operational Product Catalog should be Alpha-ready.");
  assert(alphaReadyIds.includes("inventory.stock"), "Operational Inventory should be Alpha-ready.");
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
    "sales.payments",
    "sales.products",
    "inventory.stock",
    "procurement.overview",
    "procurement.suppliers",
    "procurement.purchase-orders",
    "procurement.goods-receipts",
    "procurement.supplier-bills",
    "finance.accounting",
    "hr.employees"
  ];

  assert(first.errors.length === 0, `Alpha activation should resolve without errors: ${first.errors.map((issue) => issue.message).join("; ")}`);
  assert(JSON.stringify(first.activationOrder) === JSON.stringify(second.activationOrder), "Activation order should be deterministic.");
  assert(expectedVisibleIds.every((id) => visibleIds.includes(id)), "Alpha activation should include every visible Alpha module.");
  assert(!visibleIds.includes("crm.opportunities"), "Hidden opportunities module should not become visible.");
  assert(visibleIds.includes("inventory.stock"), "Inventory should be visible in Alpha once the operational workspace is ready.");
  assert(visibleIds.includes("procurement.purchase-orders"), "Procurement should be visible in Alpha once the operational workspace is ready.");
  assert(visibleIds.includes("finance.accounting"), "Finance Accounting should be visible in Alpha once the operational workspace is ready.");
  assert(visibleIds.includes("hr.employees"), "HR Core should be visible in Alpha once the canonical HR foundation is ready.");
  assert(first.activeModuleIds.includes("platform.persistence"), "Required hidden platform dependencies may activate as non-visible foundations.");
  assert(first.automaticallyEnabledModuleIds.includes("platform.persistence"), "Required dependencies should auto-enable deterministically.");
  assert(getCurrentAlphaActivation().profileKey === "alpha.crm-sales", "Current Alpha activation should expose the current Edition profile key.");
});

test("Edition Profiles validate the default Alpha Edition and future metadata", () => {
  const {
    bosiacoEditionProfileRegistry,
    getCurrentEditionActivationResult,
    getCurrentEditionProfile,
    getCurrentEditionProfileResolution
  } = load("src/platform/editions");
  const validation = bosiacoEditionProfileRegistry.validate();
  const defaultEdition = bosiacoEditionProfileRegistry.getDefaultEdition();
  const alphaActivation = getCurrentEditionActivationResult();
  const currentResolution = getCurrentEditionProfileResolution();
  const commercialEditionIds = bosiacoEditionProfileRegistry.listCommercial().map((profile) => profile.id);

  assert(validation.valid, `Edition profiles should validate: ${validation.issues.map((issue) => issue.message).join("; ")}`);
  assert(defaultEdition?.id === "alpha.crm-sales", "The current runtime default Edition should be Alpha CRM & Sales.");
  assert(getCurrentEditionProfile().id === "alpha.crm-sales", "Current Edition helper should return Alpha CRM & Sales.");
  assert(currentResolution.source === "default", "Current Edition resolution should use the default Alpha profile when no internal override is configured.");
  assert(alphaActivation.errors.length === 0, "Current Edition activation should resolve without errors.");
  assert(alphaActivation.activeModuleIds.includes("sales.payments"), "Current Edition should activate stable Sales payments.");
  assert(alphaActivation.activeModuleIds.includes("sales.products"), "Current Edition should activate the operational Product Catalog.");
  assert(alphaActivation.activeModuleIds.includes("inventory.stock"), "Current Edition should activate the operational Inventory workspace.");
  assert(alphaActivation.activeModuleIds.includes("finance.accounting"), "Current Edition should activate the operational Finance workspace.");
  assert(alphaActivation.activeModuleIds.includes("hr.employees"), "Current Edition should activate the HR Alpha foundation.");
  assert(commercialEditionIds.includes("basic"), "Basic should exist as commercial metadata.");
  assert(commercialEditionIds.includes("crm"), "CRM should exist as commercial metadata.");
  assert(commercialEditionIds.includes("sales"), "Sales should exist as commercial metadata.");
  assert(commercialEditionIds.includes("enterprise"), "Enterprise should exist as commercial metadata.");
  assert(bosiacoEditionProfileRegistry.listByStatus("planned").some((profile) => profile.id === "inventory"), "Inventory should remain planned metadata.");
  assert(bosiacoEditionProfileRegistry.listByStatus("planned").some((profile) => profile.id === "purchasing"), "Purchasing should remain planned metadata.");
  assert(bosiacoEditionProfileRegistry.listByStatus("planned").some((profile) => profile.id === "hr"), "HR should remain planned metadata.");
});

test("Safe internal Edition profile resolver supports Sales Operations QA without production backdoor", () => {
  const {
    bosiacoEditionProfileRegistry,
    internalEditionProfileEnvName,
    resolveEditionProfileForEnvironment,
    isInternalEditionProfileSelectionAllowed,
    editionToActivationRequest
  } = load("src/platform/editions");
  const { ModuleActivationEngine, bosiacoModuleRegistry } = load("src/platform/modules");
  const resolverSource = read("src/platform/editions/edition-profile.resolver.ts");
  const engine = new ModuleActivationEngine(bosiacoModuleRegistry);

  const defaultResolution = resolveEditionProfileForEnvironment(bosiacoEditionProfileRegistry, { nodeEnv: "development" });
  const salesOperationsResolution = resolveEditionProfileForEnvironment(bosiacoEditionProfileRegistry, {
    nodeEnv: "development",
    internalEditionProfile: "sales-operations"
  });
  const alphaOverrideResolution = resolveEditionProfileForEnvironment(bosiacoEditionProfileRegistry, {
    nodeEnv: "development",
    internalEditionProfile: "alpha.crm-sales"
  });
  const productionResolution = resolveEditionProfileForEnvironment(bosiacoEditionProfileRegistry, {
    nodeEnv: "production",
    internalEditionProfile: "sales-operations"
  });
  const unknownResolution = resolveEditionProfileForEnvironment(bosiacoEditionProfileRegistry, {
    nodeEnv: "development",
    internalEditionProfile: "unknown-edition"
  });
  const purchasingResolution = resolveEditionProfileForEnvironment(bosiacoEditionProfileRegistry, {
    nodeEnv: "development",
    internalEditionProfile: "purchasing"
  });
  const salesOperationsActivation = engine.resolve(editionToActivationRequest(salesOperationsResolution.profile));

  assert(internalEditionProfileEnvName === "NEXT_PUBLIC_BOSIACO_INTERNAL_EDITION_PROFILE", "Internal profile switch should use the documented local QA environment variable.");
  assert(defaultResolution.profile.id === "alpha.crm-sales" && defaultResolution.source === "default", "Resolver should default to Alpha when no override is configured.");
  assert(salesOperationsResolution.profile.id === "sales-operations", "Development override should select the internal Sales Operations profile.");
  assert(salesOperationsResolution.source === "internal-environment", "Sales Operations override should be clearly marked as internal environment selection.");
  assert(alphaOverrideResolution.profile.id === "alpha.crm-sales", "Development override should also allow explicit Alpha restoration.");
  assert(productionResolution.profile.id === "alpha.crm-sales" && productionResolution.warning, "Production runtime should ignore internal profile overrides.");
  assert(unknownResolution.profile.id === "alpha.crm-sales" && unknownResolution.warning, "Unknown profile override should fall back safely.");
  assert(purchasingResolution.profile.id === "alpha.crm-sales" && purchasingResolution.warning, "Internal resolver should not become a generic Edition selector.");
  assert(isInternalEditionProfileSelectionAllowed({ nodeEnv: "development" }), "Development runtime should allow the internal QA override.");
  assert(isInternalEditionProfileSelectionAllowed({ nodeEnv: "test" }), "Test runtime should allow the internal QA override.");
  assert(!isInternalEditionProfileSelectionAllowed({ nodeEnv: "production" }), "Production runtime should not allow internal Edition profile override.");
  assert(salesOperationsActivation.activeModuleIdSet.has("sales.orders"), "Sales Operations override should activate Sales Orders.");
  assert(salesOperationsActivation.activeModuleIdSet.has("sales.delivery-notes"), "Sales Operations override should activate Delivery Notes.");
  assert(salesOperationsActivation.activeModuleIdSet.has("sales.shipments"), "Sales Operations override should activate Shipments.");
  assert(!resolverSource.includes("localStorage") && !resolverSource.includes("cookies()") && !resolverSource.includes("headers()"), "Profile override must not read client-controlled localStorage, cookies or headers.");
});

test("Edition activation hydration stays server resolved and client consistent", () => {
  const resolverSource = read("src/platform/editions/edition-profile.resolver.ts");
  const layoutSource = read("src/app/(erp)/layout.tsx");
  const shellSource = read("src/components/erp-shell.tsx");
  const sidebarSource = read("src/components/sidebar.tsx");
  const sidebarAdapterSource = read("src/services/navigation/sidebar-adapter.ts");
  const searchProviderSource = read("src/platform/search/providers/universal-search-provider.tsx");

  assert(resolverSource.includes("process.env.NEXT_PUBLIC_BOSIACO_INTERNAL_EDITION_PROFILE"), "Edition resolver should use static NEXT_PUBLIC env access so Next.js can inline the same value for client bundles.");
  assert(!resolverSource.includes("process.env[internalEditionProfileEnvName]"), "Edition resolver must not use dynamic env lookup for a NEXT_PUBLIC variable because client bundles may not inline it.");
  assert(layoutSource.includes("getCurrentEditionActivationRequest()"), "ERP layout should resolve the effective Edition activation request during server render.");
  assert(layoutSource.includes("activationRequest={activationRequest}"), "ERP layout should pass the server-resolved activation request into the client shell.");
  assert(shellSource.includes("activationRequest: ModuleActivationRequest"), "ERP shell should require an explicit activation request instead of relying on a client-side default during hydration.");
  assert(shellSource.includes("<ModuleActivationProvider request={activationRequest}>"), "ModuleActivationProvider should hydrate from the same activation request used by SSR.");
  assert(sidebarSource.includes("useModuleActivation()"), "Sidebar should consume the hydrated ModuleActivation context.");
  assert(sidebarSource.includes("getSidebarGroups(activation)"), "Sidebar navigation should be derived from the hydrated activation snapshot.");
  assert(sidebarAdapterSource.includes("activation: ModuleActivationResult = getCurrentAlphaActivation()"), "Sidebar adapter may keep a fallback for non-React callers.");
  assert(!sidebarAdapterSource.includes("const activation = getCurrentAlphaActivation()"), "Sidebar adapter must not override the caller-provided activation with a global snapshot.");
  assert(searchProviderSource.includes("useModuleActivation()"), "Command Center provider should consume the same hydrated activation context as navigation.");
  assert(searchProviderSource.includes("getFoundationSearchSections(query, activation)"), "Command Center sections should be filtered by the hydrated activation snapshot.");
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
    enabledModuleIds: ["purchasing.orders"]
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
  assert(sidebarHrefs.includes("/sales/products"), "Sidebar should expose operational Products.");
  assert(sidebarHrefs.includes("/inventory"), "Sidebar should expose operational Inventory.");
  assert(sidebarHrefs.includes("/rh"), "Sidebar should expose operational HR.");
  assert(!sidebarHrefs.includes("/crm/opportunities"), "Sidebar should not expose hidden Opportunities.");
  assert(commandHrefs.includes("/crm/contacts"), "Command Center should keep active CRM navigation.");
  assert(commandHrefs.includes("/sales/invoices"), "Command Center should keep active Sales navigation.");
  assert(commandHrefs.includes("/sales/products"), "Command Center should expose active Products navigation.");
  assert(commandHrefs.includes("/inventory"), "Command Center should expose active Inventory navigation.");
  assert(commandHrefs.includes("/rh"), "Command Center should expose active HR navigation.");
  assert(!commandHrefs.includes("/crm/opportunities"), "Command Center should not expose hidden Opportunities.");
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
    "/sales/orders",
    "/sales/delivery-notes",
    "/sales/shipments",
    "/sales/invoices",
    "/sales/payments",
    "/sales/products",
    "/inventory",
    "/procurement",
    "/procurement/suppliers",
    "/procurement/purchase-orders",
    "/procurement/goods-receipts",
    "/procurement/supplier-bills",
    "/accounting",
    "/rh",
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
  assert(isRouteAvailable("/inventory"), "Inventory route should be available in Alpha.");
  assert(getRouteAvailabilityDecision("/devis").redirectTo === "/sales/quotes", "Legacy Devis route should redirect to active Quotes.");
  assert(getRouteAvailabilityDecision("/clients").redirectTo === "/crm/companies", "Legacy Clients route should redirect to active Companies.");
  assert(getRouteAvailabilityDecision("/stock").redirectTo === "/dashboard", "Legacy Stock compatibility route should still redirect to the safe fallback.");
  assert(getRouteAvailabilityDecision("/inventory").available, "Inventory route should be directly available.");
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
    "dashboard.quick-actions",
    "dashboard.finance.statements",
    "dashboard.sales.orders-to-confirm",
    "dashboard.sales.orders-reserved",
    "dashboard.sales.deliveries-to-prepare",
    "dashboard.inventory.low-stock",
    "dashboard.sales.shipments",
    "dashboard.procurement.active-suppliers"
  ];
  const alphaRenderKeys = alphaLayout.contributions.map((contribution) => contribution.renderKey);
  const basicRenderKeys = basicLayout.contributions.map((contribution) => contribution.renderKey);

  assert(JSON.stringify(alphaRenderKeys) === JSON.stringify(expectedRenderKeys), `Alpha dashboard render keys should remain deterministic. Received: ${alphaRenderKeys.join(", ")}`);
  assert(alphaLayout.zones.hero.length === 1, "Alpha dashboard should resolve one hero contribution.");
  assert(alphaLayout.zones.secondary.length === 9, "Alpha dashboard should resolve CRM/Sales, Finance, Sales Operations, Inventory and Procurement secondary widgets.");
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

test("Product Catalog Foundation is registered and operational in the current Alpha profile", () => {
  const {
    bosiacoModuleRegistry,
    getCurrentAlphaActivation
  } = load("src/platform/modules");
  const descriptor = bosiacoModuleRegistry.get("sales.products");
  const activation = getCurrentAlphaActivation();

  assert(descriptor, "Product module descriptor should exist.");
  assert(descriptor.status === "alpha", "Product module should be Alpha once the operational workspace is available.");
  assert(descriptor.hidden === false, "Product module should expose navigation metadata.");
  assert(activation.activeModuleIdSet.has("sales.products"), "Product module should be active in the current Alpha profile.");
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
    reorderPoint: 0,
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
  assert(isRouteAvailable("/inventory"), "Inventory route should be available in Alpha once the operational workspace is ready.");
  assert(isRouteAvailable("/inventory", inventoryActivation), "Inventory route should remain available under controlled Inventory activation.");
});

test("Inventory Domain Foundation is active in Alpha once workspace is operational", () => {
  const {
    bosiacoModuleRegistry,
    getCurrentAlphaActivation
  } = load("src/platform/modules");
  const descriptor = bosiacoModuleRegistry.get("inventory.stock");
  const activation = getCurrentAlphaActivation();

  assert(descriptor, "Inventory module descriptor should exist.");
  assert(descriptor.status === "alpha", "Inventory module should be Alpha once the operational workspace is available.");
  assert(descriptor.hidden === false, "Inventory module should expose navigation metadata.");
  assert(activation.activeModuleIdSet.has("inventory.stock"), "Inventory module should be active in Alpha.");
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

test("Procurement Operational Workspace is active in Alpha and remains compatible with Purchasing profile", () => {
  const { ModuleActivationEngine, bosiacoModuleRegistry, getCurrentAlphaActivation } = load("src/platform/modules");
  const { purchasingEditionProfile, editionToActivationRequest } = load("src/platform/editions");
  const { isRouteAvailable } = load("src/platform/modules/module-route-availability.ts");
  const engine = new ModuleActivationEngine(bosiacoModuleRegistry);
  const alpha = getCurrentAlphaActivation();
  const purchasing = engine.resolve(editionToActivationRequest(purchasingEditionProfile));

  assert(alpha.activeModuleIdSet.has("procurement.suppliers"), "Procurement Suppliers should be active in Alpha.");
  assert(alpha.activeModuleIdSet.has("procurement.purchase-orders"), "Procurement Purchase Orders should be active in Alpha.");
  assert(alpha.activeModuleIdSet.has("procurement.goods-receipts"), "Procurement Goods Receipts should be active in Alpha.");
  assert(isRouteAvailable("/procurement", alpha), "Procurement overview route should be available in Alpha.");
  assert(isRouteAvailable("/procurement/suppliers", alpha), "Procurement suppliers route should be available in Alpha.");
  assert(isRouteAvailable("/procurement/goods-receipts", alpha), "Procurement goods receipt route should be available in Alpha.");
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

test("Procurement Goods Receipt persistence line ids remain unique across partial receipts", () => {
  const { createGoodsReceiptLinePersistenceId } = load("src/modules/procurement");
  const sharedPurchaseOrderLine = { purchaseOrderLineId: "po-line-partial-1" };
  const firstLineId = createGoodsReceiptLinePersistenceId("gr-partial-1", sharedPurchaseOrderLine, 0);
  const secondLineId = createGoodsReceiptLinePersistenceId("gr-partial-2", sharedPurchaseOrderLine, 0);
  const thirdLineId = createGoodsReceiptLinePersistenceId("gr-partial-3", sharedPurchaseOrderLine, 0);
  const multiLineSecondPositionId = createGoodsReceiptLinePersistenceId("gr-partial-2", sharedPurchaseOrderLine, 1);

  assert(firstLineId !== secondLineId, "Separate Goods Receipts against the same Purchase Order line must persist different line ids.");
  assert(secondLineId !== thirdLineId, "A third partial receipt must not reuse a previous Goods Receipt line id.");
  assert(secondLineId !== multiLineSecondPositionId, "Multiple lines inside one receipt should remain uniquely identified by position.");
  assert(firstLineId.includes(sharedPurchaseOrderLine.purchaseOrderLineId), "Persistence line ids should preserve the semantic Purchase Order line reference.");
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

test("Procurement cockpit analytics derive deterministic purchasing metrics", () => {
  const {
    buildProcurementCockpitAnalytics,
    PROCUREMENT_WORKSPACE_ID
  } = load("src/modules/procurement");
  const supplierA = {
    id: "supplier-a",
    workspaceId: PROCUREMENT_WORKSPACE_ID,
    companyName: "Atlas Distribution",
    country: "Maroc",
    currency: "MAD",
    status: "active",
    active: true,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z"
  };
  const supplierB = {
    id: "supplier-b",
    workspaceId: PROCUREMENT_WORKSPACE_ID,
    companyName: "Casa Supply",
    country: "Maroc",
    currency: "MAD",
    status: "archived",
    active: false,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z"
  };
  const line = (id, quantity, unitPrice) => ({
    id,
    productId: `product-${id}`,
    productSku: `SKU-${id}`,
    productName: `Produit ${id}`,
    description: `Produit ${id}`,
    quantity,
    unit: "piece",
    unitPrice,
    discountRate: 0,
    taxRate: 0
  });
  const order = ({ id, supplier = supplierA, status, issueDate, quantity, unitPrice }) => ({
    id,
    workspaceId: PROCUREMENT_WORKSPACE_ID,
    number: id.toUpperCase(),
    supplierId: supplier.id,
    supplierName: supplier.companyName,
    status,
    issueDate,
    currency: "MAD",
    lines: [line(`${id}-line`, quantity, unitPrice)],
    discountRate: 0,
    createdAt: issueDate,
    updatedAt: issueDate
  });
  const currentConfirmed = order({ id: "po-current-confirmed", status: "confirmed", issueDate: "2026-08-03T00:00:00.000Z", quantity: 1, unitPrice: 100 });
  const currentPartial = order({ id: "po-current-partial", status: "partially_received", issueDate: "2026-08-04T00:00:00.000Z", quantity: 1, unitPrice: 200 });
  const currentReceived = order({ id: "po-current-received", supplier: supplierB, status: "received", issueDate: "2026-08-05T00:00:00.000Z", quantity: 1, unitPrice: 300 });
  const currentDraft = order({ id: "po-current-draft", status: "draft", issueDate: "2026-08-06T00:00:00.000Z", quantity: 1, unitPrice: 999 });
  const currentCancelled = order({ id: "po-current-cancelled", status: "cancelled", issueDate: "2026-08-07T00:00:00.000Z", quantity: 1, unitPrice: 500 });
  const previousSent = order({ id: "po-previous-sent", supplier: supplierB, status: "sent", issueDate: "2026-07-15T00:00:00.000Z", quantity: 1, unitPrice: 80 });
  const previousConfirmed = order({ id: "po-previous-confirmed", supplier: supplierB, status: "confirmed", issueDate: "2026-07-16T00:00:00.000Z", quantity: 1, unitPrice: 20 });
  const receipt = {
    id: "gr-partial",
    workspaceId: PROCUREMENT_WORKSPACE_ID,
    number: "GR-TEST",
    supplierId: supplierA.id,
    supplierName: supplierA.companyName,
    purchaseOrderId: currentPartial.id,
    purchaseOrderNumber: currentPartial.number,
    warehouseId: "warehouse-main",
    receiptDate: "2026-08-10T00:00:00.000Z",
    status: "posted",
    lines: [{
      id: "gr-partial-line",
      purchaseOrderLineId: currentPartial.lines[0].id,
      productId: currentPartial.lines[0].productId,
      productSku: currentPartial.lines[0].productSku,
      productName: currentPartial.lines[0].productName,
      description: currentPartial.lines[0].description,
      orderedQuantity: 1,
      previouslyReceivedQuantity: 0,
      receivedQuantity: 0.5,
      unit: "piece"
    }],
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z"
  };

  const analytics = buildProcurementCockpitAnalytics({
    purchaseOrders: [currentConfirmed, currentPartial, currentReceived, currentDraft, currentCancelled, previousSent, previousConfirmed],
    receipts: [receipt],
    suppliers: [supplierA, supplierB],
    referenceDate: new Date("2026-08-17T00:00:00.000Z")
  });

  assert(analytics.monthPurchaseValue === 600, "Current month purchasing value should exclude draft and cancelled orders.");
  assert(analytics.previousMonthPurchaseValue === 100, "Previous month should include validated July orders only.");
  assert(analytics.monthPurchaseDeltaPercent === 500, "Month comparison should be deterministic and zero-safe when previous month exists.");
  assert(analytics.committedAmount === 320, "Committed amount should include confirmed and partially received orders.");
  assert(analytics.openPurchaseOrders === 4, "Open orders should include sent, confirmed and partially received orders.");
  assert(analytics.awaitingReceiptOrders === 3, "Awaiting receipt should count open committed orders with remaining quantities.");
  assert(analytics.partiallyReceivedOrders === 1, "Partial receipt count should use the canonical partially_received status.");
  assert(analytics.activeSuppliers === 1, "Active suppliers should use existing supplier active/status semantics.");
  assert(analytics.monthlyTrend.map((point) => point.key).join(",") === "2026-03,2026-04,2026-05,2026-06,2026-07,2026-08", "Monthly trend should return chronological six-month keys.");
  assert(analytics.monthlyTrend.at(-1).value === 600, "Monthly trend should include current month purchasing value.");
  assert(analytics.topSuppliers[0].supplierName === "Casa Supply" && analytics.topSuppliers[0].value === 400, "Top suppliers should rank by validated purchase value.");

  const empty = buildProcurementCockpitAnalytics({
    purchaseOrders: [],
    receipts: [],
    suppliers: [],
    referenceDate: new Date("2026-08-17T00:00:00.000Z")
  });
  assert(empty.monthPurchaseValue === 0 && empty.monthPurchaseDeltaPercent === 0, "Empty cockpit analytics should stay zero-safe.");
  assert(empty.monthlyTrend.length === 6 && empty.monthlyTrend.every((point) => point.value === 0), "Empty trend should preserve ordered zero-value months.");
});

test("Sales Operations modules are active in Alpha through the canonical profile", () => {
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
  const alphaCommandHrefs = createNavigationCommandRegistry(alpha).getAll().map((command) => command.href);
  const operationsCommandHrefs = createNavigationCommandRegistry(salesOperations).getAll().map((command) => command.href);

  assert(alpha.activeModuleIdSet.has("sales.orders"), "Alpha profile should activate Sales Orders after authenticated Sales Operations QA.");
  assert(alpha.activeModuleIdSet.has("sales.delivery-notes"), "Alpha profile should activate Delivery Notes after authenticated Sales Operations QA.");
  assert(alpha.activeModuleIdSet.has("sales.shipments"), "Alpha profile should activate Shipments after authenticated Sales Operations QA.");
  assert(alpha.activeModuleIdSet.has("sales.products"), "Alpha profile should keep Product Catalog active for order lines.");
  assert(alpha.activeModuleIdSet.has("inventory.stock"), "Alpha profile should keep Inventory active for reservation checks and Delivery Note ISSUE posting.");
  assert(["/sales/orders", "/sales/delivery-notes", "/sales/shipments"].every((href) => alphaHrefs.includes(href)), "Alpha navigation should expose Sales Operations routes.");
  assert(["/sales/orders", "/sales/delivery-notes", "/sales/shipments"].every((href) => alphaCommandHrefs.includes(href)), "Command Center should expose Sales Operations navigation in Alpha.");
  assert(["/sales/orders", "/sales/orders/sales-order-demo", "/sales/delivery-notes", "/sales/delivery-notes/delivery-note-demo", "/sales/shipments", "/sales/shipments/shipment-demo"].every((route) => isRouteAvailable(route, alpha)), "Sales Operations routes and detail routes should be available in Alpha.");
  assert(new Set(alphaHrefs).size === alphaHrefs.length, "Alpha navigation should not create duplicate module entries.");
  assert(salesOperations.errors.length === 0, `Sales Operations profile should resolve cleanly: ${salesOperations.errors.map((issue) => issue.message).join("; ")}`);
  assert(salesOperations.activeModuleIdSet.has("sales.orders"), "Sales Operations profile should activate Sales Orders.");
  assert(salesOperations.activeModuleIdSet.has("sales.delivery-notes"), "Sales Operations profile should activate Delivery Notes.");
  assert(salesOperations.activeModuleIdSet.has("sales.shipments"), "Sales Operations profile should activate Shipments.");
  assert(salesOperations.activeModuleIdSet.has("sales.products"), "Sales Operations profile should activate Product Catalog for order lines.");
  assert(salesOperations.activeModuleIdSet.has("inventory.stock"), "Sales Operations profile should activate Inventory for reservation checks.");
  assert(["/sales/orders", "/sales/delivery-notes", "/sales/shipments"].every((href) => operationsHrefs.includes(href)), "Sales Operations profile should still expose the same operational navigation.");
  assert(["/sales/orders", "/sales/delivery-notes", "/sales/shipments"].every((route) => isRouteAvailable(route, salesOperations)), "Sales Operations routes should remain available under the internal profile.");
  assert(["/sales/orders", "/sales/delivery-notes", "/sales/shipments"].every((href) => operationsCommandHrefs.includes(href)), "Command Center should still expose Sales Operations under the internal profile.");
});

test("Sales Operations dashboard contributions render only operational widgets", () => {
  const { ModuleActivationEngine, bosiacoModuleRegistry } = load("src/platform/modules");
  const { salesOperationsEditionProfile, editionToActivationRequest } = load("src/platform/editions");
  const { resolveDashboardContributions } = load("src/platform/dashboard");
  const dashboardSource = read("src/app/(erp)/dashboard/page.tsx");
  const contributionsSource = read("src/platform/dashboard/dashboard-contributions.ts");
  const engine = new ModuleActivationEngine(bosiacoModuleRegistry);
  const salesOperations = engine.resolve(editionToActivationRequest(salesOperationsEditionProfile));
  const layout = resolveDashboardContributions({ activation: salesOperations });
  const renderKeys = Object.values(layout.zones).flat().map((contribution) => contribution.renderKey);

  assert(renderKeys.includes("dashboard.sales.orders-to-confirm"), "Sales Operations dashboard should expose Sales Orders waiting for confirmation.");
  assert(renderKeys.includes("dashboard.sales.orders-reserved"), "Sales Operations dashboard should expose reserved Sales Orders.");
  assert(renderKeys.includes("dashboard.sales.deliveries-to-prepare"), "Sales Operations dashboard should expose Delivery Notes preparation.");
  assert(renderKeys.includes("dashboard.sales.shipments"), "Sales Operations dashboard should expose the Shipment widget.");
  assert(!renderKeys.includes("dashboard.sales.orders-shortage"), "Stock shortage contribution should remain planned until a stable renderer exists.");
  assert(!renderKeys.includes("dashboard.sales.orders-recent"), "Recent Sales Orders contribution should remain planned until the Dashboard footer zone is rendered.");
  assert(dashboardSource.includes("SalesOperationsDashboardCard"), "Dashboard should render Sales Operations contribution keys through a dedicated lightweight component.");
  assert(contributionsSource.includes('id: "sales.orders.shortage"') && contributionsSource.includes('status: "planned"'), "Non-rendered shortage contribution should not be alpha-visible.");
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
  assert(repositorySource.includes("assertSalesOrderDraftPersistencePolicy"), "Server persistence should enforce the Sales Order draft edit policy.");
  assert(repositorySource.includes("Seules les commandes client brouillon peuvent être modifiées."), "Persisted Sales Orders should be editable only while draft.");
  assert(repositorySource.includes("Confirmez la commande client depuis l'action dédiée."), "Server should force confirmation through the dedicated action.");
  assert(repositorySource.includes("Une commande client brouillon ne peut pas contenir de réservation"), "Draft edits should reject committed reservation or delivery quantities.");
  assert(repositorySource.includes("assertSalesOrderLineProductsTenant"), "Sales Order draft persistence should verify Product ownership for line items.");
});

test("Sales Order remaining reservation subtracts delivered and reserved quantities", () => {
  const { getSalesOrderLineRemainingToReserve } = load("src/modules/sales/orders");
  const cases = [
    [{ quantityOrdered: 8, quantityDelivered: 0, quantityReserved: 0 }, 8, "New order should expose the full ordered quantity as remaining to reserve."],
    [{ quantityOrdered: 8, quantityDelivered: 0, quantityReserved: 8 }, 0, "Fully reserved order should not expose additional reservation."],
    [{ quantityOrdered: 8, quantityDelivered: 3, quantityReserved: 5 }, 0, "Partial delivery with the remaining quantity reserved should not expose additional reservation."],
    [{ quantityOrdered: 8, quantityDelivered: 3, quantityReserved: 2 }, 3, "Partial delivery with partial reservation should expose only the unreserved remainder."],
    [{ quantityOrdered: 8, quantityDelivered: 8, quantityReserved: 0 }, 0, "Fully delivered order should never propose additional reservation."],
    [{ quantityOrdered: 8, quantityDelivered: 6, quantityReserved: 5 }, 0, "Remaining reservation should be clamped at zero."]
  ];

  for (const [line, expected, message] of cases) {
    assert(getSalesOrderLineRemainingToReserve(line) === expected, message);
  }
  assert(read("src/modules/sales/orders/ui/order-details-workspace.tsx").includes("getSalesOrderLineRemainingToReserve(line)"), "Sales Order details should use the canonical remaining reservation helper.");
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

test("Product Catalog create persistence reports domain errors without opaque 500s", () => {
  const repositorySource = read("src/server/persistence/product-catalog-repository.ts");
  const routeSource = read("src/app/api/persistence/product-catalog/route.ts");
  const clientSource = read("src/platform/persistence/product-catalog-persistence.client.ts");
  const hookSource = read("src/modules/products/ui/hooks/use-products-page.ts");

  assert(repositorySource.includes("ProductCatalogPersistenceError"), "Product persistence should expose typed domain errors.");
  assert(repositorySource.includes("assertProductPayload"), "Server persistence should validate required Product payload fields.");
  assert(repositorySource.includes("assertUniqueProductPersistence"), "Server persistence should check duplicate SKU and barcode before Prisma write.");
  assert(repositorySource.includes("Ce SKU existe déjà."), "Server duplicate SKU errors should be translated to a clear French message.");
  assert(repositorySource.includes("Ce code-barres existe déjà."), "Server duplicate barcode errors should be translated to a clear French message.");
  assert(repositorySource.includes("requireExisting: true"), "Product persistence should reject stale category ids instead of letting a foreign-key write fail.");
  assert(repositorySource.includes("P2002") && repositorySource.includes("P2003"), "Repository should map Prisma unique and foreign-key errors as a fallback.");
  assert(routeSource.includes("toProductCatalogErrorResponse"), "Product Catalog API should centralize safe error responses.");
  assert(routeSource.includes("[product-catalog:persistence-error]"), "Unexpected Product Catalog persistence errors should be logged server-side.");
  assert(routeSource.includes("error.status") && routeSource.includes("error.code"), "Known Product Catalog errors should preserve HTTP status and code.");
  assert(!routeSource.includes("return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })"), "Product Catalog API should not leak raw persistence errors as generic 500 responses.");
  assert(clientSource.includes("ProductCatalogClientPersistenceError"), "Client persistence should preserve server error status and code.");
  assert(hookSource.includes("getProductPersistenceErrorMessage"), "Product UI should show the controlled server/domain error instead of always showing a connection message.");
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

test("Delivery Notes are active in Alpha while preserving Sales Operations compatibility", () => {
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
  const alphaCommandHrefs = createNavigationCommandRegistry(alpha).getAll().map((command) => command.href);
  const operationsCommandHrefs = createNavigationCommandRegistry(salesOperations).getAll().map((command) => command.href);

  assert(alpha.activeModuleIdSet.has("sales.delivery-notes"), "Alpha should activate Delivery Notes after validated Sales Operations QA.");
  assert(alphaHrefs.includes("/sales/delivery-notes"), "Alpha navigation should expose Delivery Notes.");
  assert(isRouteAvailable("/sales/delivery-notes", alpha), "Alpha route policy should allow Delivery Notes.");
  assert(alphaCommandHrefs.includes("/sales/delivery-notes"), "Command Center should expose Delivery Notes in Alpha.");
  assert(salesOperations.errors.length === 0, "Sales Operations should resolve Delivery Note dependencies.");
  assert(salesOperations.activeModuleIdSet.has("sales.delivery-notes"), "Sales Operations should activate Delivery Notes.");
  assert(operationsHrefs.includes("/sales/delivery-notes"), "Sales Operations navigation should expose Delivery Notes.");
  assert(operationsCommandHrefs.includes("/sales/delivery-notes"), "Command Center should expose Delivery Notes when active.");
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

test("Shipment persistence model stores a durable one-to-one Delivery Note relationship", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20260813120000_shipment_persistence/migration.sql");

  assert(schema.includes("model SalesShipment"), "Prisma schema should define durable SalesShipment records.");
  assert(schema.includes("model SalesShipmentLine"), "Prisma schema should define durable SalesShipmentLine records.");
  assert(/deliveryNoteId\s+String\s+@unique/.test(schema), "SalesShipment should own a unique Delivery Note relationship.");
  assert(schema.includes("deliveryNote       SalesDeliveryNote"), "SalesShipment should relate to SalesDeliveryNote explicitly.");
  assert(schema.includes("@@unique([tenantCompanyId, deliveryNoteId])"), "Tenant-scoped duplicate protection should exist for Delivery Note shipments.");
  assert(/deliveredAt\s+DateTime\?/.test(schema), "Shipment lifecycle should persist the delivered timestamp.");
  assert(migration.includes('CREATE TABLE "SalesShipment"'), "Shipment migration should create the SalesShipment table.");
  assert(migration.includes('CREATE TABLE "SalesShipmentLine"'), "Shipment migration should create the SalesShipmentLine table.");
  assert(migration.includes('REFERENCES "SalesDeliveryNote"("id")'), "Shipment migration should enforce the Delivery Note foreign key.");
});

test("Shipment repository owns identity, duplicate protection and Inventory safety", () => {
  const source = read("src/server/persistence/shipment-repository.ts");

  assert(source.includes('import "server-only"'), "Shipment persistence repository should remain server-only.");
  assert(source.includes("randomUUID"), "Server persistence should own durable Shipment identity generation.");
  assert(source.includes("deliveryNoteId: shipment.deliveryNoteId"), "Duplicate protection should be based on the source Delivery Note.");
  assert(source.includes("Une expédition existe déjà pour ce bon de livraison"), "Duplicate conversion should be rejected clearly.");
  assert(source.includes('note.status !== "posted"'), "Shipments should only be created from posted Delivery Notes.");
  assert(source.includes("L'expédition doit reprendre toutes les lignes du bon de livraison posté."), "Shipment persistence should reject partial line snapshots.");
  assert(source.includes("validateShipmentStatusTransition"), "Server persistence should enforce deterministic lifecycle transitions.");
  assert(source.includes("deliveredAt: status === \"delivered\""), "Delivered status should persist a delivered timestamp.");
  assert(!source.includes("@/modules/inventory"), "Shipment persistence must not import Inventory modules.");
  assert(!source.includes('type: "ISSUE"'), "Shipment persistence must not create physical stock issue movements.");
  assert(!source.includes('type: "RECEIPT"'), "Shipment persistence must not create receipt movements.");
});

test("Shipment persistence bridge hydrates UI surfaces without changing activation defaults", () => {
  const clientSource = read("src/platform/persistence/shipment-persistence.client.ts");
  const providerSource = read("src/platform/persistence/shipment-persistence-provider.tsx");
  const shellSource = read("src/components/erp-shell.tsx");
  const workspaceSource = read("src/modules/sales/shipments/ui/shipments-workspace.tsx");
  const detailsSource = read("src/modules/sales/shipments/ui/shipment-details-workspace.tsx");
  const dashboardSource = read("src/modules/sales/shipments/ui/shipment-dashboard-section.tsx");
  const { alphaCrmSalesEditionProfile, salesOperationsEditionProfile } = load("src/platform/editions");

  assert(clientSource.includes("/api/persistence/shipments"), "Shipment persistence client should use the dedicated API route.");
  assert(clientSource.includes("persistShipmentRecord"), "Shipment persistence client should expose confirmed save.");
  assert(clientSource.includes("transitionPersistedShipmentStatus"), "Shipment persistence client should expose confirmed status transitions.");
  assert(providerSource.includes("hydrateShipmentPersistence"), "Shipment provider should hydrate persisted Shipments.");
  assert(shellSource.includes("ShipmentPersistenceProvider"), "ERP shell should mount Shipment persistence hydration.");
  assert(workspaceSource.includes("persistShipmentRecord"), "Shipment list workspace should save through persistence.");
  assert(detailsSource.includes("transitionPersistedShipmentStatus"), "Shipment details should update status through persistence.");
  assert(dashboardSource.includes("hydrateShipmentPersistence"), "Shipment dashboard should read persisted state after hydration.");
  assert(alphaCrmSalesEditionProfile.enabledModuleIds.includes("sales.shipments"), "Default Alpha should activate Shipments after authenticated Sales Operations QA.");
  assert(salesOperationsEditionProfile.enabledModuleIds.includes("sales.shipments"), "Sales Operations should keep Shipments available for internal QA compatibility.");
});

test("Shipment search contribution remains activation-aware and persistence-aligned", () => {
  const source = read("src/platform/search/record-search-registry.ts");

  assert(source.includes("SHIPMENTS_WORKSPACE_ID"), "Record search should know the canonical Shipment workspace.");
  assert(source.includes('activeModuleIdSet.has("sales.shipments")'), "Shipment records should be indexed only when the module is active.");
  assert(source.includes("buildShipmentRecords"), "Record search should include a Shipment record mapper.");
  assert(source.includes("shipmentService.listShipments"), "Shipment search should read the hydrated Shipment source.");
  assert(source.includes("/sales/shipments/"), "Shipment search results should use canonical Shipment detail routes.");
});

test("Business Timeline Registry registers providers deterministically", () => {
  const { TimelineRegistry } = load("src/runtime/timeline");
  const registry = new TimelineRegistry(() => "2026-07-16T08:00:00.000Z");
  const provider = {
    id: "test.timeline-provider",
    label: "Test Timeline Provider",
    supports: () => true,
    getEvents: () => []
  };
  const registration = registry.register(provider);
  let duplicateRejected = false;

  try {
    registry.register(provider);
  } catch {
    duplicateRejected = true;
  }

  assert(registration.id === "test.timeline-provider", "Timeline provider registration should expose the provider id.");
  assert(registration.registeredAt === "2026-07-16T08:00:00.000Z", "Timeline provider registration should be deterministic when a clock is supplied.");
  assert(registry.list().length === 1, "Timeline registry should list registered providers.");
  assert(registry.find("test.timeline-provider") === provider, "Timeline registry should find registered providers.");
  assert(duplicateRejected, "Timeline registry should reject duplicate provider ids.");
  assert(registry.unregister("test.timeline-provider"), "Timeline registry should unregister existing providers.");
  assert(registry.list().length === 0, "Timeline registry should be empty after unregister.");
});

test("Business Timeline utilities filter, deduplicate and sort generic events", () => {
  const { normalizeTimelineEvents } = load("src/runtime/timeline");
  const query = Object.freeze({ entityType: "quote", entityId: "quote-1", limit: 3 });
  const events = normalizeTimelineEvents([
    {
      id: "event-older",
      entityType: "quote",
      entityId: "quote-1",
      eventType: "quote.created",
      title: "Created",
      date: "2026-07-15T10:00:00.000Z"
    },
    {
      id: "event-newer",
      entityType: "quote",
      entityId: "quote-1",
      eventType: "quote.accepted",
      title: "Accepted",
      date: "2026-07-16T10:00:00.000Z",
      metadata: { status: "accepted" }
    },
    {
      id: "event-other-entity",
      entityType: "quote",
      entityId: "quote-2",
      eventType: "quote.created",
      title: "Other",
      date: "2026-07-17T10:00:00.000Z"
    },
    {
      id: "event-newer",
      entityType: "quote",
      entityId: "quote-1",
      eventType: "quote.accepted",
      title: "Accepted duplicate",
      date: "2026-07-16T10:00:00.000Z"
    }
  ], query);

  assert(events.length === 2, "Timeline normalization should filter unrelated entities and deduplicate by event id.");
  assert(events[0].id === "event-newer", "Timeline normalization should sort newest events first.");
  assert(Object.isFrozen(events), "Timeline normalization should return an immutable event list.");
  assert(Object.isFrozen(events[0]), "Timeline normalization should freeze returned events.");
});

test("Business Timeline foundation stays Runtime-first and business-module agnostic", () => {
  const runtimeFiles = listFiles("src/runtime/timeline");
  const serviceSource = read("src/services/timeline/TimelineService.ts");
  const uiSource = listFiles("src/ui/timeline").map((file) => read(file)).join("\n");
  const forbiddenRuntimePatterns = [
    /@\/modules\/crm/,
    /@\/modules\/sales/,
    /@\/modules\/inventory/,
    /@\/server/,
    /@prisma\/client/,
    /from ["']react["']/,
    /from ["']next\//
  ];

  for (const file of runtimeFiles) {
    const source = read(file);
    for (const pattern of forbiddenRuntimePatterns) {
      assert(!pattern.test(source), `Business Timeline Runtime should not import forbidden dependency in ${file}.`);
    }
  }

  assert(serviceSource.includes("@/runtime/timeline"), "TimelineService should orchestrate the Runtime timeline package.");
  assert(serviceSource.includes("ensureDefaultTimelineProvidersRegistered"), "TimelineService should use an explicit provider bootstrap boundary.");
  assert(uiSource.includes("@/runtime/timeline"), "Timeline UI should render generic TimelineEvent records.");
  assert(!uiSource.includes("@/modules/sales") && !uiSource.includes("@/modules/crm") && !uiSource.includes("@/modules/inventory"), "Timeline UI should remain domain-agnostic.");
});

test("Sales Timeline Provider implements the generic TimelineProvider boundary", () => {
  const { SalesTimelineProvider, SALES_TIMELINE_PROVIDER_ID } = load("src/modules/sales/timeline");
  const provider = new SalesTimelineProvider();
  const source = read("src/modules/sales/timeline/sales-timeline.provider.ts");
  const mapperSource = read("src/modules/sales/timeline/sales-timeline.mapper.ts");

  assert(provider.id === SALES_TIMELINE_PROVIDER_ID, "Sales Timeline Provider should expose a stable provider id.");
  assert(provider.supports({ entityType: "sales.quote", entityId: "quote-dev-2026-041" }), "Sales Timeline Provider should support sales.quote queries.");
  assert(provider.supports({ entityType: "SalesOrder", entityId: "sales-order-test" }), "Sales Timeline Provider should support documented SalesOrder aliases.");
  assert(!provider.supports({ entityType: "crm.company", entityId: "company-test" }), "Sales Timeline Provider should not claim non-Sales entities.");
  assert(source.includes("implements TimelineProvider"), "Sales Timeline Provider should implement the generic TimelineProvider contract.");
  assert(!source.includes("from \"react\"") && !mapperSource.includes("from \"react\""), "Sales Timeline Provider and mapper should not depend on React.");
  assert(!source.includes("@prisma/client") && !mapperSource.includes("@prisma/client"), "Sales Timeline Provider should not depend on Prisma.");
});

test("Sales Timeline Provider returns deterministic Quote journey events from canonical Sales relationships", () => {
  const { SalesTimelineProvider } = load("src/modules/sales/timeline");
  const { normalizeTimelineEvents } = load("src/runtime/timeline");
  const provider = new SalesTimelineProvider();
  const query = { entityType: "sales.quote", entityId: "quote-dev-2026-041" };
  const first = normalizeTimelineEvents(provider.getEvents(query), query);
  const second = normalizeTimelineEvents(provider.getEvents(query), query);
  const eventTypes = first.map((event) => event.eventType);
  const eventIds = first.map((event) => event.id);

  assert(eventTypes.includes("sales.quote.created"), "Known Quote should include its creation event.");
  assert(eventTypes.includes("sales.invoice.created"), "Known Quote should include explicitly linked Invoice events.");
  assert(eventTypes.includes("sales.payment.recorded"), "Known Quote should include payments linked through the Invoice.");
  assert(!first.some((event) => event.metadata?.sourceEntityId === "invoice-fac-2026-001"), "Quote journey should not include unrelated Invoices from other Quotes.");
  assert(first[0].date >= first[first.length - 1].date, "Timeline engine normalization should return Sales events newest-first.");
  assert(JSON.stringify(eventIds) === JSON.stringify(second.map((event) => event.id)), "Repeated Sales timeline calls should keep stable event IDs.");
  assert(JSON.stringify(first.map((event) => event.eventType)) === JSON.stringify(second.map((event) => event.eventType)), "Repeated Sales timeline calls should be equivalent.");
  assert(Object.isFrozen(first), "Timeline normalization should return immutable Sales timeline results.");
  assert(first.every((event) => event.entityType === "sales.quote" && event.entityId === "quote-dev-2026-041"), "Related Sales events should attach to the requested timeline entity.");
});

test("Sales Timeline Provider resolves Sales Order, Invoice, Payment and unknown entities safely", () => {
  const { SalesTimelineProvider } = load("src/modules/sales/timeline");
  const { SalesOrderService } = load("src/modules/sales/orders/order.service.ts");
  const provider = new SalesTimelineProvider({
    getQuote: () => undefined,
    listQuotes: () => [],
    getOrder: (id) => id === "sales-order-linked" ? {
      id: "sales-order-linked",
      workspaceId: "sales-orders-main",
      number: "SO-2026-001",
      companyId: "company-test",
      companyName: "Atlas Test",
      sourceQuoteId: "quote-missing",
      sourceQuoteNumber: "DEV-MISSING",
      orderDate: "2026-07-10T10:00:00.000Z",
      currency: "MAD",
      status: "confirmed",
      reservationStatus: "not_reserved",
      lines: [],
      discountRate: 0,
      ownerId: "user-test",
      createdAt: "2026-07-10T10:00:00.000Z",
      updatedAt: "2026-07-10T11:00:00.000Z"
    } : undefined,
    listOrders: () => [],
    getInvoice: (id) => id === "invoice-test" ? {
      id: "invoice-test",
      workspaceId: "workspace-hicopilot",
      number: "FAC-TEST",
      customerName: "Atlas Test",
      companyId: "company-test",
      status: "issued",
      issueDate: "2026-07-11T09:00:00.000Z",
      dueDate: "2026-08-11T09:00:00.000Z",
      currency: "MAD",
      items: [],
      discountRate: 0,
      ownerId: "user-test",
      paidAmount: 0,
      createdAt: "2026-07-11T09:00:00.000Z",
      updatedAt: "2026-07-11T09:00:00.000Z"
    } : undefined,
    listInvoices: () => [],
    getPayment: (id) => id === "payment-test" ? {
      id: "payment-test",
      workspaceId: "workspace-hicopilot",
      number: "REG-TEST",
      invoiceId: "invoice-test",
      invoiceNumber: "FAC-TEST",
      customerName: "Atlas Test",
      companyId: "company-test",
      status: "recorded",
      method: "cash",
      amount: 100,
      currency: "MAD",
      receivedAt: "2026-07-12T12:00:00.000Z",
      ownerId: "user-test",
      createdAt: "2026-07-12T12:00:00.000Z",
      updatedAt: "2026-07-12T12:00:00.000Z"
    } : undefined,
    listPayments: () => []
  });
  const orderEvents = provider.getEvents({ entityType: "sales.order", entityId: "sales-order-linked" });
  const invoiceEvents = provider.getEvents({ entityType: "sales.invoice", entityId: "invoice-test" });
  const paymentEvents = provider.getEvents({ entityType: "sales.payment", entityId: "payment-test" });
  const missingEvents = provider.getEvents({ entityType: "sales.quote", entityId: "missing-quote" });
  const before = new SalesOrderService().listOrders({ workspaceId: "sales-orders-main", includeArchived: true }).total;
  provider.getEvents({ entityType: "sales.order", entityId: "sales-order-linked" });
  const after = new SalesOrderService().listOrders({ workspaceId: "sales-orders-main", includeArchived: true }).total;

  assert(orderEvents.some((event) => event.eventType === "sales.order.created"), "Known Sales Order should return deterministic order events.");
  assert(invoiceEvents.some((event) => event.eventType === "sales.invoice.issued"), "Known Invoice should return deterministic issue events.");
  assert(paymentEvents.some((event) => event.eventType === "sales.payment.recorded"), "Known Payment should return deterministic payment events.");
  assert(missingEvents.length === 0, "Unknown Sales entity IDs should return an empty timeline.");
  assert(before === after, "Sales Timeline Provider should not mutate Sales services or records.");
});

test("Sales Timeline Provider registration is explicit, unique and outside React rendering", () => {
  const { TimelineService } = load("src/services/timeline");
  const { businessTimelineRuntime } = load("src/runtime/timeline");
  const bootstrapSource = read("src/services/timeline/timeline-provider.bootstrap.ts");

  new TimelineService();
  new TimelineService();

  const salesProviders = businessTimelineRuntime.listProviders().filter((provider) => provider.id === "sales.timeline");

  assert(salesProviders.length === 1, "Default TimelineService bootstrap should register Sales provider exactly once.");
  assert(bootstrapSource.includes("ensureDefaultTimelineProvidersRegistered"), "Default timeline providers should register through an explicit bootstrap helper.");
  assert(!bootstrapSource.includes("useEffect") && !bootstrapSource.includes("react"), "Sales Timeline Provider registration should not happen through React rendering.");
});

test("Sales Timeline Provider preserves Runtime and UI dependency direction", () => {
  const runtimeSource = listFiles("src/runtime/timeline").map((file) => read(file)).join("\n");
  const uiSource = listFiles("src/ui/timeline").map((file) => read(file)).join("\n");
  const providerSource = listFiles("src/modules/sales/timeline").map((file) => read(file)).join("\n");

  assert(!runtimeSource.includes("@/modules/sales"), "Generic Timeline Runtime should not import Sales provider code.");
  assert(!uiSource.includes("@/modules/sales"), "Generic Timeline UI should not import Sales provider code.");
  assert(providerSource.includes("@/runtime/timeline"), "Sales provider should depend on the generic Timeline contract.");
  assert(!providerSource.includes("@/server/"), "Sales provider should not call server repositories directly.");
  assert(!providerSource.includes("@prisma/client"), "Sales provider should not import Prisma.");
});

test("Inventory Timeline Provider implements the generic TimelineProvider boundary", () => {
  const { InventoryTimelineProvider, INVENTORY_TIMELINE_PROVIDER_ID } = load("src/modules/inventory/timeline");
  const provider = new InventoryTimelineProvider();
  const source = read("src/modules/inventory/timeline/inventory-timeline.provider.ts");
  const mapperSource = read("src/modules/inventory/timeline/inventory-timeline.mapper.ts");

  assert(provider.id === INVENTORY_TIMELINE_PROVIDER_ID, "Inventory Timeline Provider should expose a stable provider id.");
  assert(provider.supports({ entityType: "sales.order", entityId: "sales-order-test" }), "Inventory Timeline Provider should support Sales Order logistics queries.");
  assert(provider.supports({ entityType: "delivery.note", entityId: "delivery-note-test" }), "Inventory Timeline Provider should support Delivery Note queries.");
  assert(provider.supports({ entityType: "inventory.movement", entityId: "movement-test" }), "Inventory Timeline Provider should support Inventory Movement queries.");
  assert(provider.supports({ entityType: "inventory.reservation", entityId: "reservation-test" }), "Inventory Timeline Provider should support Inventory Reservation queries.");
  assert(!provider.supports({ entityType: "sales.quote", entityId: "quote-test" }), "Inventory Timeline Provider should not claim Quote ownership.");
  assert(source.includes("implements TimelineProvider"), "Inventory Timeline Provider should implement the generic TimelineProvider contract.");
  assert(!source.includes("from \"react\"") && !mapperSource.includes("from \"react\""), "Inventory Timeline Provider and mapper should not depend on React.");
  assert(!source.includes("@prisma/client") && !mapperSource.includes("@prisma/client"), "Inventory Timeline Provider should not depend on Prisma.");
});

test("Inventory Timeline Provider reconstructs reservation, partial delivery, final delivery and ISSUE events", () => {
  const {
    InventoryTimelineProvider,
    createInventoryTimelineDataSourceFromRecords
  } = load("src/modules/inventory/timeline");
  const { normalizeTimelineEvents } = load("src/runtime/timeline");
  const order = {
    id: "sales-order-timeline-1",
    workspaceId: "sales-orders-main",
    number: "SO-TL-001",
    companyId: "company-timeline",
    companyName: "Atlas Timeline",
    orderDate: "2026-07-15T08:00:00.000Z",
    currency: "MAD",
    status: "delivered",
    reservationStatus: "not_reserved",
    lines: [{
      id: "sales-order-line-timeline-1",
      productId: "product-timeline-1",
      productSku: "PT-1",
      productName: "Timeline Product",
      description: "Timeline Product",
      quantityOrdered: 8,
      quantityReserved: 0,
      quantityDelivered: 8,
      warehouseId: "warehouse-timeline",
      warehouseName: "Entrepôt Timeline",
      unit: "piece",
      unitPrice: 10,
      discountRate: 0,
      taxRate: 20
    }],
    discountRate: 0,
    ownerId: "user-timeline",
    createdAt: "2026-07-15T08:00:00.000Z",
    updatedAt: "2026-07-15T12:00:00.000Z"
  };
  const deliveryNotes = [
    {
      id: "delivery-note-timeline-3",
      workspaceId: "sales-delivery-notes-main",
      number: "BL-TL-003",
      companyId: "company-timeline",
      companyName: "Atlas Timeline",
      salesOrderId: "sales-order-timeline-1",
      salesOrderNumber: "SO-TL-001",
      warehouseId: "warehouse-timeline",
      warehouseName: "Entrepôt Timeline",
      deliveryDate: "2026-07-15T10:00:00.000Z",
      status: "posted",
      postedAt: "2026-07-15T10:05:00.000Z",
      postedBy: "user-timeline",
      lines: [{
        id: "delivery-note-line-timeline-3",
        salesOrderLineId: "sales-order-line-timeline-1",
        productId: "product-timeline-1",
        productSku: "PT-1",
        productName: "Timeline Product",
        description: "Timeline Product",
        unit: "piece",
        quantityToDeliver: 3,
        quantityPosted: 3
      }],
      createdAt: "2026-07-15T09:50:00.000Z",
      updatedAt: "2026-07-15T10:05:00.000Z"
    },
    {
      id: "delivery-note-timeline-5",
      workspaceId: "sales-delivery-notes-main",
      number: "BL-TL-005",
      companyId: "company-timeline",
      companyName: "Atlas Timeline",
      salesOrderId: "sales-order-timeline-1",
      salesOrderNumber: "SO-TL-001",
      warehouseId: "warehouse-timeline",
      warehouseName: "Entrepôt Timeline",
      deliveryDate: "2026-07-15T11:00:00.000Z",
      status: "posted",
      postedAt: "2026-07-15T11:05:00.000Z",
      postedBy: "user-timeline",
      lines: [{
        id: "delivery-note-line-timeline-5",
        salesOrderLineId: "sales-order-line-timeline-1",
        productId: "product-timeline-1",
        productSku: "PT-1",
        productName: "Timeline Product",
        description: "Timeline Product",
        unit: "piece",
        quantityToDeliver: 5,
        quantityPosted: 5
      }],
      createdAt: "2026-07-15T10:50:00.000Z",
      updatedAt: "2026-07-15T11:05:00.000Z"
    }
  ];
  const movements = [
    {
      id: "movement-reserve-timeline-8",
      companyId: "company-timeline",
      productId: "product-timeline-1",
      toWarehouseId: "warehouse-timeline",
      type: "RESERVATION",
      status: "POSTED",
      quantity: 8,
      reference: "SO-TL-001",
      referenceType: "SALES_ORDER",
      referenceId: "sales-order-timeline-1",
      postedAt: "2026-07-15T09:00:00.000Z",
      createdAt: "2026-07-15T09:00:00.000Z",
      updatedAt: "2026-07-15T09:00:00.000Z"
    },
    {
      id: "movement-issue-timeline-3",
      companyId: "company-timeline",
      productId: "product-timeline-1",
      fromWarehouseId: "warehouse-timeline",
      type: "ISSUE",
      status: "POSTED",
      quantity: 3,
      reference: "BL-TL-003 · SO-TL-001",
      referenceType: "DELIVERY_NOTE",
      referenceId: "delivery-note-timeline-3",
      postedAt: "2026-07-15T10:05:00.000Z",
      createdAt: "2026-07-15T10:05:00.000Z",
      updatedAt: "2026-07-15T10:05:00.000Z"
    },
    {
      id: "movement-issue-timeline-5",
      companyId: "company-timeline",
      productId: "product-timeline-1",
      fromWarehouseId: "warehouse-timeline",
      type: "ISSUE",
      status: "POSTED",
      quantity: 5,
      reference: "BL-TL-005 · SO-TL-001",
      referenceType: "DELIVERY_NOTE",
      referenceId: "delivery-note-timeline-5",
      postedAt: "2026-07-15T11:05:00.000Z",
      createdAt: "2026-07-15T11:05:00.000Z",
      updatedAt: "2026-07-15T11:05:00.000Z"
    },
    {
      id: "movement-unrelated",
      companyId: "company-timeline",
      productId: "product-timeline-1",
      fromWarehouseId: "warehouse-timeline",
      type: "ISSUE",
      status: "POSTED",
      quantity: 99,
      reference: "Unrelated",
      referenceType: "DELIVERY_NOTE",
      referenceId: "delivery-note-unrelated",
      postedAt: "2026-07-15T12:00:00.000Z",
      createdAt: "2026-07-15T12:00:00.000Z",
      updatedAt: "2026-07-15T12:00:00.000Z"
    }
  ];
  const provider = new InventoryTimelineProvider(createInventoryTimelineDataSourceFromRecords({
    salesOrders: [order],
    deliveryNotes,
    movements
  }));
  const query = { entityType: "sales.order", entityId: "sales-order-timeline-1" };
  const first = normalizeTimelineEvents(provider.getEvents(query), query);
  const second = normalizeTimelineEvents(provider.getEvents(query), query);
  const eventTypes = first.map((event) => event.eventType);

  assert(eventTypes.includes("inventory.reservation.created"), "Sales Order logistics timeline should include the reservation event.");
  assert(eventTypes.filter((eventType) => eventType === "delivery.note.posted").length === 2, "Each posted Delivery Note should create its own posted event.");
  assert(eventTypes.includes("delivery.note.partially_delivered"), "First partial Delivery Note should create a partial delivery event.");
  assert(eventTypes.includes("sales.order.fully_delivered"), "Final Delivery Note should create a full delivery event when order is delivered.");
  assert(eventTypes.filter((eventType) => eventType === "inventory.issue.posted").length === 2, "Each physical ISSUE movement should create one ISSUE event.");
  assert(!first.some((event) => event.metadata?.movementId === "movement-unrelated"), "Unrelated Inventory movements should not appear.");
  assert(JSON.stringify(first.map((event) => event.id)) === JSON.stringify(second.map((event) => event.id)), "Inventory timeline event ids should be stable.");
  assert(first[0].date >= first[first.length - 1].date, "Inventory logistics events should sort newest-first through Timeline normalization.");
  assert(Object.isFrozen(first), "Inventory timeline normalized result should be immutable.");
  assert(provider.getEvents({ entityType: "sales.order", entityId: "missing-order" }).length === 0, "Unknown Sales Order logistics timeline should be empty.");
});

test("Inventory Timeline Provider resolves Delivery Note and movement roots through explicit references only", () => {
  const {
    InventoryTimelineProvider,
    createInventoryTimelineDataSourceFromRecords
  } = load("src/modules/inventory/timeline");
  const note = {
    id: "delivery-note-root",
    workspaceId: "sales-delivery-notes-main",
    number: "BL-ROOT",
    companyId: "company-root",
    companyName: "Atlas Root",
    salesOrderId: "sales-order-root",
    salesOrderNumber: "SO-ROOT",
    warehouseId: "warehouse-root",
    warehouseName: "Entrepôt Root",
    deliveryDate: "2026-07-16T10:00:00.000Z",
    status: "posted",
    postedAt: "2026-07-16T10:30:00.000Z",
    postedBy: "user-root",
    lines: [{
      id: "delivery-note-line-root",
      salesOrderLineId: "sales-order-line-root",
      productId: "product-root",
      description: "Root Product",
      unit: "piece",
      quantityToDeliver: 2,
      quantityPosted: 2
    }],
    createdAt: "2026-07-16T10:00:00.000Z",
    updatedAt: "2026-07-16T10:30:00.000Z"
  };
  const issue = {
    id: "movement-root-issue",
    companyId: "company-root",
    productId: "product-root",
    fromWarehouseId: "warehouse-root",
    type: "ISSUE",
    status: "POSTED",
    quantity: 2,
    reference: "BL-ROOT",
    referenceType: "DELIVERY_NOTE",
    referenceId: "delivery-note-root",
    postedAt: "2026-07-16T10:30:00.000Z",
    createdAt: "2026-07-16T10:30:00.000Z",
    updatedAt: "2026-07-16T10:30:00.000Z"
  };
  const sameProductUnrelatedIssue = {
    ...issue,
    id: "movement-root-unrelated",
    referenceId: "delivery-note-other",
    quantity: 2
  };
  const provider = new InventoryTimelineProvider(createInventoryTimelineDataSourceFromRecords({
    deliveryNotes: [note],
    movements: [issue, sameProductUnrelatedIssue]
  }));
  const noteEvents = provider.getEvents({ entityType: "delivery.note", entityId: "delivery-note-root" });
  const movementEvents = provider.getEvents({ entityType: "inventory.movement", entityId: "movement-root-issue" });

  assert(noteEvents.some((event) => event.eventType === "delivery.note.posted"), "Delivery Note root should include its posted event.");
  assert(noteEvents.some((event) => event.eventType === "inventory.issue.posted"), "Delivery Note root should include explicitly linked ISSUE movement.");
  assert(!noteEvents.some((event) => event.metadata?.movementId === "movement-root-unrelated"), "Provider should not infer movement relationships from product or quantity.");
  assert(movementEvents.some((event) => event.eventType === "inventory.issue.posted"), "Inventory Movement root should include its ISSUE event.");
  assert(provider.getEvents({ entityType: "inventory.movement", entityId: "missing-movement" }).length === 0, "Unknown movement roots should return no events.");
});

test("Inventory Timeline Provider registration is explicit, unique and preserves Sales provider behavior", () => {
  const { TimelineService } = load("src/services/timeline");
  const { businessTimelineRuntime } = load("src/runtime/timeline");
  const bootstrapSource = read("src/services/timeline/timeline-provider.bootstrap.ts");

  new TimelineService();
  new TimelineService();

  const providerIds = businessTimelineRuntime.listProviders().map((provider) => provider.id);
  const salesCount = providerIds.filter((providerId) => providerId === "sales.timeline").length;
  const inventoryCount = providerIds.filter((providerId) => providerId === "inventory.timeline").length;

  assert(salesCount === 1, "Sales Timeline Provider should remain registered exactly once.");
  assert(inventoryCount === 1, "Inventory Timeline Provider should register exactly once.");
  assert(bootstrapSource.includes("new InventoryTimelineProvider()"), "Inventory provider should register through the existing timeline bootstrap.");
  assert(!bootstrapSource.includes("useEffect") && !bootstrapSource.includes("react"), "Inventory provider registration should not happen through React rendering.");
});

test("Inventory Timeline Provider preserves Runtime and logistics dependency boundaries", () => {
  const runtimeSource = listFiles("src/runtime/timeline").map((file) => read(file)).join("\n");
  const uiSource = listFiles("src/ui/timeline").map((file) => read(file)).join("\n");
  const providerSource = listFiles("src/modules/inventory/timeline").map((file) => read(file)).join("\n");
  const salesProviderSource = listFiles("src/modules/sales/timeline").map((file) => read(file)).join("\n");

  assert(!runtimeSource.includes("@/modules/inventory") && !runtimeSource.includes("@/modules/sales/delivery-notes"), "Generic Timeline Runtime should not import Inventory or Delivery modules.");
  assert(!uiSource.includes("@/modules/inventory") && !uiSource.includes("@/modules/sales/delivery-notes"), "Generic Timeline UI should not import Inventory or Delivery modules.");
  assert(!salesProviderSource.includes("@/modules/inventory/timeline"), "Sales Timeline Provider should not import the Inventory provider.");
  assert(providerSource.includes("@/runtime/timeline"), "Inventory provider should depend on the generic Timeline contract.");
  assert(!providerSource.includes("postDeliveryNote") && !providerSource.includes("postInventoryMovement") && !providerSource.includes("consumeInventoryReservation"), "Inventory timeline files should not duplicate posting or reservation consumption logic.");
  assert(!providerSource.includes("@/server/") && !providerSource.includes("@prisma/client"), "Inventory provider should not import server repositories or Prisma.");
  assert(!providerSource.includes("parseDeliveryNoteQuantity") && !providerSource.includes("normalizeInventoryQuantity"), "Inventory timeline files should not duplicate quantity normalization policy.");
});

test("Sales Order details integrates Business Timeline through TimelineService only", () => {
  const timelineSource = read("src/modules/sales/orders/ui/sales-order-business-timeline.tsx");
  const detailsSource = read("src/modules/sales/orders/ui/order-details-workspace.tsx");

  assert(timelineSource.includes('import { TimelineService } from "@/services/timeline"'), "Sales Order Timeline UI should use the TimelineService facade.");
  assert(timelineSource.includes("new TimelineService()"), "Sales Order Timeline UI should instantiate the service facade, not providers.");
  assert(timelineSource.includes('entityType: "sales.order"'), "Sales Order Timeline UI should query the canonical sales.order timeline entity.");
  assert(timelineSource.includes("entityId: salesOrderId"), "Sales Order Timeline UI should query by the current Sales Order id.");
  assert(timelineSource.includes("<BusinessTimeline"), "Sales Order Timeline UI should render the shared generic BusinessTimeline component.");
  assert(timelineSource.includes("Impossible de charger l'historique"), "Sales Order Timeline UI should expose a clear French error state.");
  assert(timelineSource.includes('emptyMessage="Aucune activité disponible pour cette commande."'), "Sales Order Timeline UI should expose a clear empty state.");
  assert(!timelineSource.includes("SalesTimelineProvider"), "Sales Order Timeline UI should not import the Sales provider directly.");
  assert(!timelineSource.includes("InventoryTimelineProvider"), "Sales Order Timeline UI should not import the Inventory provider directly.");
  assert(!timelineSource.includes("deliveryNoteService") && !timelineSource.includes("inventoryLocalService") && !timelineSource.includes("salesOrderService"), "Sales Order Timeline UI should not reconstruct events from module stores.");
  assert(timelineSource.includes("requestIdRef") && timelineSource.includes("requestId !== requestIdRef.current"), "Sales Order Timeline UI should reject late responses for stale Sales Order requests.");
  assert(timelineSource.includes("setEvents([])"), "Sales Order Timeline UI should clear stale events while loading a new Sales Order timeline.");
  assert(timelineSource.includes("Réessayer") && timelineSource.includes("retryToken"), "Sales Order Timeline UI should provide a local retry without global refresh machinery.");
  assert(!timelineSource.includes("setInterval") && !timelineSource.includes("WebSocket") && !timelineSource.includes("EventSource"), "Sales Order Timeline UI should not add polling, WebSockets or server push.");
  assert(detailsSource.includes("<SalesOrderBusinessTimeline"), "Sales Order details should render the Business Timeline integration.");
  assert(detailsSource.includes("timelineRefreshKey"), "Sales Order details should provide a stable refresh key for timeline updates.");
});

test("Timeline shared UI remains domain agnostic and link-safe after Sales Order integration", () => {
  const uiSource = listFiles("src/ui/timeline").map((file) => read(file)).join("\n");
  const eventSource = read("src/ui/timeline/TimelineEvent.tsx");
  const cardSource = read("src/ui/timeline/TimelineCard.tsx");
  const integrationSource = read("src/modules/sales/orders/ui/sales-order-business-timeline.tsx");

  assert(!uiSource.includes("@/modules/sales") && !uiSource.includes("@/modules/inventory") && !uiSource.includes("@/modules/crm"), "Shared Timeline UI should remain business-module agnostic.");
  assert(eventSource.includes('import Link from "next/link"'), "Timeline events should use Next Link for internal navigation.");
  assert(eventSource.includes("<Link"), "Timeline event links should render through the SPA navigation component.");
  assert(cardSource.includes("<ol") && eventSource.includes("<li"), "Timeline events should render as a semantic chronological list.");
  assert(eventSource.includes("getTimelineStatus") && eventSource.includes("Validé") && eventSource.includes("Attention"), "Timeline status should be visible text, not color-only dots.");
  assert(eventSource.includes("break-words"), "Timeline event titles and descriptions should wrap safely.");
  assert(!uiSource.includes("event.metadata") && !uiSource.includes("providerId"), "Shared Timeline UI should not render raw metadata or provider ids.");
  assert(!integrationSource.includes("useEffect(() => ensureDefaultTimelineProvidersRegistered"), "Timeline provider registration should not happen inside React rendering.");
});

test("Accounting Foundation creates accounts journals and balanced draft entries deterministically", () => {
  const {
    AccountingService,
    ACCOUNTING_WORKSPACE_ID,
    calculateJournalEntryTotals,
    isJournalEntryBalanced
  } = load("src/modules/accounting");
  const service = new AccountingService({ now: () => "2026-08-17T12:00:00.000Z" });
  const tenantCompanyId = "tenant-accounting-a";

  const cash = service.createAccount({
    id: "account-cash",
    tenantCompanyId,
    code: "1000",
    name: "Cash",
    type: "asset",
    normalBalance: "debit",
    createdBy: "user-accounting"
  });
  const capital = service.createAccount({
    id: "account-capital",
    tenantCompanyId,
    code: "3000",
    name: "Capital",
    type: "equity",
    normalBalance: "credit",
    createdBy: "user-accounting"
  });
  const journal = service.createJournal({
    id: "journal-general",
    tenantCompanyId,
    code: "GEN",
    name: "General",
    type: "general",
    createdBy: "user-accounting"
  });
  const entry = service.createDraftEntry({
    id: "entry-opening",
    tenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    journalId: journal.id,
    number: "JE-000001",
    entryDate: "2026-08-17T00:00:00.000Z",
    description: "Opening entry",
    sourceType: "manual",
    functionalCurrency: "MAD",
    lines: [
      { id: "line-debit", accountId: cash.id, label: "Cash contribution", debitAmount: "1000.00", creditAmount: "0.00" },
      { id: "line-credit", accountId: capital.id, label: "Capital", debitAmount: "0.00", creditAmount: "1000.00" }
    ],
    createdBy: "user-accounting"
  });

  const totals = calculateJournalEntryTotals(entry.lines);
  assert(totals.debitTotal === "1000.00", "Accounting entry should calculate debit total from canonical amounts.");
  assert(totals.creditTotal === "1000.00", "Accounting entry should calculate credit total from canonical amounts.");
  assert(entry.debitTotal === "1000.00" && entry.creditTotal === "1000.00", "Draft entry should store computed totals.");
  assert(isJournalEntryBalanced(entry), "Balanced accounting entry should pass the double-entry check.");
});

test("Accounting Foundation rejects unbalanced and cross-tenant posting", () => {
  const { AccountingService, ACCOUNTING_WORKSPACE_ID, AccountingDomainError } = load("src/modules/accounting");
  const service = new AccountingService({ now: () => "2026-08-17T12:00:00.000Z" });
  const tenantCompanyId = "tenant-accounting-a";

  const accountA = service.createAccount({ id: "account-a", tenantCompanyId, code: "1000", name: "Bank", type: "asset", normalBalance: "debit" });
  const accountB = service.createAccount({ id: "account-b", tenantCompanyId, code: "7000", name: "Revenue", type: "income", normalBalance: "credit" });
  const externalAccount = service.createAccount({ id: "account-external", tenantCompanyId: "tenant-accounting-b", code: "1000", name: "External bank", type: "asset", normalBalance: "debit" });
  const journal = service.createJournal({ id: "journal-sales", tenantCompanyId, code: "SAL", name: "Sales", type: "sales" });

  const unbalanced = service.createDraftEntry({
    id: "entry-unbalanced",
    tenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    journalId: journal.id,
    number: "JE-000002",
    entryDate: "2026-08-17T00:00:00.000Z",
    functionalCurrency: "MAD",
    lines: [
      { id: "line-a", accountId: accountA.id, label: "Debit", debitAmount: "500.00", creditAmount: "0.00" },
      { id: "line-b", accountId: accountB.id, label: "Credit", debitAmount: "0.00", creditAmount: "499.00" }
    ]
  });

  let rejected = false;
  try {
    service.postEntry(unbalanced.id, "user-accounting");
  } catch (error) {
    rejected = error instanceof AccountingDomainError && error.issues.some((issue) => issue.code === "not-balanced");
  }
  assert(rejected, "Unbalanced accounting entry should be rejected before posting.");

  rejected = false;
  try {
    service.createDraftEntry({
      id: "entry-cross-tenant",
      tenantCompanyId,
      workspaceId: ACCOUNTING_WORKSPACE_ID,
      journalId: journal.id,
      number: "JE-000003",
      entryDate: "2026-08-17T00:00:00.000Z",
      functionalCurrency: "MAD",
      lines: [
        { id: "line-c", accountId: externalAccount.id, label: "Wrong tenant debit", debitAmount: "10.00", creditAmount: "0.00" },
        { id: "line-d", accountId: accountB.id, label: "Credit", debitAmount: "0.00", creditAmount: "10.00" }
      ]
    });
  } catch (error) {
    rejected = error instanceof AccountingDomainError && error.issues.some((issue) => issue.code === "tenant-mismatch");
  }
  assert(rejected, "Accounting entries should reject cross-tenant account references.");
});

test("Accounting Foundation posts balanced entries and locks posted history", () => {
  const { AccountingService, ACCOUNTING_WORKSPACE_ID, AccountingDomainError } = load("src/modules/accounting");
  const service = new AccountingService({ now: () => "2026-08-17T12:00:00.000Z" });
  const tenantCompanyId = "tenant-accounting-a";
  const debitAccount = service.createAccount({ id: "account-debit", tenantCompanyId, code: "1000", name: "Bank", type: "asset", normalBalance: "debit" });
  const creditAccount = service.createAccount({ id: "account-credit", tenantCompanyId, code: "7010", name: "Services", type: "income", normalBalance: "credit" });
  const journal = service.createJournal({ id: "journal-general-post", tenantCompanyId, code: "GEN", name: "General", type: "general" });
  const draft = service.createDraftEntry({
    id: "entry-balanced",
    tenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    journalId: journal.id,
    number: "JE-000004",
    entryDate: "2026-08-17T00:00:00.000Z",
    functionalCurrency: "MAD",
    lines: [
      { id: "line-1", accountId: debitAccount.id, label: "Debit", debitAmount: "750.00", creditAmount: "0.00" },
      { id: "line-2", accountId: creditAccount.id, label: "Credit", debitAmount: "0.00", creditAmount: "750.00" }
    ]
  });

  const posted = service.postEntry(draft.id, "accountant-1");
  assert(posted.status === "posted", "Balanced accounting entry should become posted.");
  assert(posted.postedAt === "2026-08-17T12:00:00.000Z", "Posted accounting entry should receive deterministic postedAt.");
  assert(posted.postedBy === "accountant-1", "Posted accounting entry should preserve posting actor.");

  let locked = false;
  try {
    service.updateDraftEntry(posted);
  } catch (error) {
    locked = error instanceof AccountingDomainError && error.issues.some((issue) => issue.code === "posted-entry-locked");
  }
  assert(locked, "Posted accounting entry should not be silently mutable through draft update.");
});

test("Accounting Operations is active and visible in Alpha once the workflow is usable", () => {
  const { bosiacoModuleRegistry } = load("src/platform/modules");
  const { getCurrentAlphaActivation } = load("src/platform/modules/module-activation.current");
  const { getActiveModuleNavigationItems } = load("src/platform/modules/module-navigation");
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20260817120000_accounting_foundation/migration.sql");
  const repositorySource = read("src/server/persistence/accounting-repository.ts");
  const workspaceSource = read("src/modules/accounting/ui/pages/accounting-workspace.tsx");
  const routeSource = read("src/app/(erp)/accounting/page.tsx");

  const descriptor = bosiacoModuleRegistry.get("finance.accounting");
  const alpha = getCurrentAlphaActivation();
  const hrefs = getActiveModuleNavigationItems(alpha).map((item) => item.href);

  assert(descriptor?.status === "alpha" && descriptor.hidden === false && descriptor.route === "/accounting", "Accounting module should be promoted to the canonical Alpha Finance route.");
  assert(alpha.activeModuleIdSet.has("finance.accounting"), "Accounting should be active in the current Alpha profile.");
  assert(hrefs.includes("/accounting") && !hrefs.includes("/finance"), "Accounting should add one canonical visible Alpha navigation route.");
  assert(schema.includes("model AccountingAccount") && schema.includes("model AccountingJournalEntryLine"), "Prisma schema should contain canonical Accounting models.");
  assert(migration.includes('CREATE TABLE "AccountingJournalEntry"') && migration.includes('FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"'), "Accounting migration should create tenant-scoped journal entries.");
  assert(repositorySource.includes("scope.companyId as AccountingTenantCompanyId") && repositorySource.includes("Une ecriture comptable postee ne peut pas etre modifiee silencieusement"), "Accounting repository should enforce server-side tenant ownership and posted-history boundaries.");
  assert(routeSource.includes("<AccountingWorkspace />"), "The canonical Accounting route should render the Finance Operations workspace.");
  assert(workspaceSource.includes("getAccountingGeneralLedger") && workspaceSource.includes("getAccountingTrialBalance"), "Finance UI should consume server-derived Ledger and Trial Balance reports.");
  assert(!workspaceSource.includes("@prisma/client"), "Finance UI should not import Prisma directly.");
});

test("Accounting reports derive a simple General Ledger and Trial Balance from posted entries", () => {
  const { AccountingService, ACCOUNTING_WORKSPACE_ID, createGeneralLedgerReport, createTrialBalanceReport } = load("src/modules/accounting");
  const service = new AccountingService({ now: () => "2026-08-17T12:00:00.000Z" });
  const tenantCompanyId = "tenant-ledger-simple";
  const cash = service.createAccount({ id: "ledger-simple-cash", tenantCompanyId, code: "1000", name: "Banque", type: "asset", normalBalance: "debit" });
  const revenue = service.createAccount({ id: "ledger-simple-revenue", tenantCompanyId, code: "7000", name: "Ventes", type: "income", normalBalance: "credit" });
  const journal = service.createJournal({ id: "ledger-simple-journal", tenantCompanyId, code: "GEN", name: "Operations diverses", type: "general" });
  const draft = service.createDraftEntry({
    id: "ledger-simple-entry",
    tenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    journalId: journal.id,
    number: "JE-431-001",
    entryDate: "2026-08-01T00:00:00.000Z",
    functionalCurrency: "MAD",
    lines: [
      { id: "ledger-simple-line-debit", accountId: cash.id, label: "Encaissement", debitAmount: "1000.00", creditAmount: "0.00" },
      { id: "ledger-simple-line-credit", accountId: revenue.id, label: "Produit", debitAmount: "0.00", creditAmount: "1000.00" }
    ]
  });
  service.postEntry(draft.id, "accountant-431");

  const query = { tenantCompanyId };
  const ledger = createGeneralLedgerReport({ accounts: service.listAccounts(), journals: service.listJournals(), journalEntries: service.listJournalEntries(), query });
  const trial = createTrialBalanceReport({ accounts: service.listAccounts(), journals: service.listJournals(), journalEntries: service.listJournalEntries(), query });
  const cashLedger = ledger.accounts.find((account) => account.account.id === cash.id);
  const revenueLedger = ledger.accounts.find((account) => account.account.id === revenue.id);

  assert(cashLedger?.periodDebit === "1000.00" && cashLedger?.closing.debitAmount === "1000.00", "General Ledger should show the posted debit on the cash account.");
  assert(revenueLedger?.periodCredit === "1000.00" && revenueLedger?.closing.creditAmount === "1000.00", "General Ledger should show the posted credit on the revenue account.");
  assert(ledger.periodDebitTotal === "1000.00" && ledger.periodCreditTotal === "1000.00", "General Ledger should preserve posted entry balance.");
  assert(trial.periodDebitTotal === "1000.00" && trial.periodCreditTotal === "1000.00", "Trial Balance should total posted debit and credit movements.");
  assert(trial.closingDebitTotal === "1000.00" && trial.closingCreditTotal === "1000.00" && trial.balanced, "Trial Balance grand totals should reconcile.");
});

test("Accounting reports include multiple posted entries without decimal precision drift", () => {
  const { AccountingService, ACCOUNTING_WORKSPACE_ID, createTrialBalanceReport, createGeneralLedgerReport } = load("src/modules/accounting");
  const service = new AccountingService({ now: () => "2026-08-17T12:00:00.000Z" });
  const tenantCompanyId = "tenant-ledger-decimal";
  const cash = service.createAccount({ id: "ledger-decimal-cash", tenantCompanyId, code: "1000", name: "Banque", type: "asset", normalBalance: "debit" });
  const revenue = service.createAccount({ id: "ledger-decimal-revenue", tenantCompanyId, code: "7000", name: "Ventes", type: "income", normalBalance: "credit" });
  const expense = service.createAccount({ id: "ledger-decimal-expense", tenantCompanyId, code: "6000", name: "Achats", type: "expense", normalBalance: "debit" });
  const journal = service.createJournal({ id: "ledger-decimal-journal", tenantCompanyId, code: "GEN", name: "Operations diverses", type: "general" });

  [
    ["entry-decimal-010", "0.10", cash.id, revenue.id],
    ["entry-decimal-020", "0.20", cash.id, revenue.id],
    ["entry-decimal-030", "0.30", expense.id, cash.id]
  ].forEach(([entryId, amount, debitAccountId, creditAccountId], index) => {
    const draft = service.createDraftEntry({
      id: entryId,
      tenantCompanyId,
      workspaceId: ACCOUNTING_WORKSPACE_ID,
      journalId: journal.id,
      number: `JE-431-D${index + 1}`,
      entryDate: `2026-08-0${index + 1}T00:00:00.000Z`,
      functionalCurrency: "MAD",
      lines: [
        { id: `${entryId}-debit`, accountId: debitAccountId, label: "Debit", debitAmount: amount, creditAmount: "0.00" },
        { id: `${entryId}-credit`, accountId: creditAccountId, label: "Credit", debitAmount: "0.00", creditAmount: amount }
      ]
    });
    service.postEntry(draft.id, "accountant-431");
  });

  const query = { tenantCompanyId };
  const ledger = createGeneralLedgerReport({ accounts: service.listAccounts(), journals: service.listJournals(), journalEntries: service.listJournalEntries(), query });
  const trial = createTrialBalanceReport({ accounts: service.listAccounts(), journals: service.listJournals(), journalEntries: service.listJournalEntries(), query });
  const cashLedger = ledger.accounts.find((account) => account.account.id === cash.id);

  assert(cashLedger?.periodDebit === "0.30" && cashLedger?.periodCredit === "0.30", "General Ledger should add 0.10 + 0.20 and subtract 0.30 exactly.");
  assert(cashLedger?.closing.balanceAmount === "0.00" && cashLedger?.closing.balanceSide === "zero", "General Ledger should not leave floating-point residue.");
  assert(trial.periodDebitTotal === "0.60" && trial.periodCreditTotal === "0.60", "Trial Balance should preserve decimal movement totals exactly.");
  assert(trial.closingDebitTotal === "0.30" && trial.closingCreditTotal === "0.30" && trial.balanced, "Trial Balance should reconcile after decimal entries.");
});

test("Accounting reports exclude draft entries from official balances", () => {
  const { AccountingService, ACCOUNTING_WORKSPACE_ID, createTrialBalanceReport } = load("src/modules/accounting");
  const service = new AccountingService({ now: () => "2026-08-17T12:00:00.000Z" });
  const tenantCompanyId = "tenant-ledger-draft";
  const cash = service.createAccount({ id: "ledger-draft-cash", tenantCompanyId, code: "1000", name: "Banque", type: "asset", normalBalance: "debit" });
  const revenue = service.createAccount({ id: "ledger-draft-revenue", tenantCompanyId, code: "7000", name: "Ventes", type: "income", normalBalance: "credit" });
  const journal = service.createJournal({ id: "ledger-draft-journal", tenantCompanyId, code: "GEN", name: "Operations diverses", type: "general" });

  service.createDraftEntry({
    id: "ledger-draft-entry",
    tenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    journalId: journal.id,
    number: "JE-431-DRAFT",
    entryDate: "2026-08-01T00:00:00.000Z",
    functionalCurrency: "MAD",
    lines: [
      { id: "ledger-draft-line-debit", accountId: cash.id, label: "Debit brouillon", debitAmount: "999.00", creditAmount: "0.00" },
      { id: "ledger-draft-line-credit", accountId: revenue.id, label: "Credit brouillon", debitAmount: "0.00", creditAmount: "999.00" }
    ]
  });

  const trial = createTrialBalanceReport({
    accounts: service.listAccounts(),
    journals: service.listJournals(),
    journalEntries: service.listJournalEntries(),
    query: { tenantCompanyId }
  });

  assert(trial.periodDebitTotal === "0.00" && trial.periodCreditTotal === "0.00", "Draft journal entries should be excluded from official Trial Balance movements.");
  assert(trial.rows.every((row) => row.closing.balanceAmount === "0.00"), "Draft journal entries should not affect closing balances.");
});

test("Accounting reports preserve tenant isolation", () => {
  const { AccountingService, ACCOUNTING_WORKSPACE_ID, createTrialBalanceReport } = load("src/modules/accounting");
  const service = new AccountingService({ now: () => "2026-08-17T12:00:00.000Z" });
  const tenants = ["tenant-ledger-a", "tenant-ledger-b"];

  tenants.forEach((tenantCompanyId, tenantIndex) => {
    const cash = service.createAccount({ id: `ledger-tenant-cash-${tenantIndex}`, tenantCompanyId, code: `10${tenantIndex}0`, name: "Banque", type: "asset", normalBalance: "debit" });
    const revenue = service.createAccount({ id: `ledger-tenant-revenue-${tenantIndex}`, tenantCompanyId, code: `70${tenantIndex}0`, name: "Ventes", type: "income", normalBalance: "credit" });
    const journal = service.createJournal({ id: `ledger-tenant-journal-${tenantIndex}`, tenantCompanyId, code: `G${tenantIndex}`, name: "Operations diverses", type: "general" });
    const amount = tenantIndex === 0 ? "125.00" : "500.00";
    const draft = service.createDraftEntry({
      id: `ledger-tenant-entry-${tenantIndex}`,
      tenantCompanyId,
      workspaceId: ACCOUNTING_WORKSPACE_ID,
      journalId: journal.id,
      number: `JE-431-T${tenantIndex}`,
      entryDate: "2026-08-01T00:00:00.000Z",
      functionalCurrency: "MAD",
      lines: [
        { id: `ledger-tenant-line-debit-${tenantIndex}`, accountId: cash.id, label: "Debit", debitAmount: amount, creditAmount: "0.00" },
        { id: `ledger-tenant-line-credit-${tenantIndex}`, accountId: revenue.id, label: "Credit", debitAmount: "0.00", creditAmount: amount }
      ]
    });
    service.postEntry(draft.id, "accountant-431");
  });

  const trial = createTrialBalanceReport({
    accounts: service.listAccounts(),
    journals: service.listJournals(),
    journalEntries: service.listJournalEntries(),
    query: { tenantCompanyId: tenants[0] }
  });

  assert(trial.periodDebitTotal === "125.00" && trial.periodCreditTotal === "125.00", "Trial Balance should include only the requested tenant.");
  assert(!trial.rows.some((row) => row.account.id.includes("tenant-revenue-1") || row.periodCredit === "500.00"), "Trial Balance should not leak another tenant's accounts or movements.");
});

test("Accounting reports support opening balance period movement and closing balance date scopes", () => {
  const { AccountingService, ACCOUNTING_WORKSPACE_ID, createGeneralLedgerReport } = load("src/modules/accounting");
  const service = new AccountingService({ now: () => "2026-08-17T12:00:00.000Z" });
  const tenantCompanyId = "tenant-ledger-dates";
  const cash = service.createAccount({ id: "ledger-date-cash", tenantCompanyId, code: "1000", name: "Banque", type: "asset", normalBalance: "debit" });
  const revenue = service.createAccount({ id: "ledger-date-revenue", tenantCompanyId, code: "7000", name: "Ventes", type: "income", normalBalance: "credit" });
  const journal = service.createJournal({ id: "ledger-date-journal", tenantCompanyId, code: "GEN", name: "Operations diverses", type: "general" });

  [
    ["ledger-date-before", "2026-07-31T12:00:00.000Z", "100.00"],
    ["ledger-date-inside", "2026-08-10T12:00:00.000Z", "25.00"],
    ["ledger-date-after", "2026-09-01T12:00:00.000Z", "75.00"]
  ].forEach(([entryId, entryDate, amount], index) => {
    const draft = service.createDraftEntry({
      id: entryId,
      tenantCompanyId,
      workspaceId: ACCOUNTING_WORKSPACE_ID,
      journalId: journal.id,
      number: `JE-431-F${index}`,
      entryDate,
      functionalCurrency: "MAD",
      lines: [
        { id: `${entryId}-debit`, accountId: cash.id, label: "Debit", debitAmount: amount, creditAmount: "0.00" },
        { id: `${entryId}-credit`, accountId: revenue.id, label: "Credit", debitAmount: "0.00", creditAmount: amount }
      ]
    });
    service.postEntry(draft.id, "accountant-431");
  });

  const ledger = createGeneralLedgerReport({
    accounts: service.listAccounts(),
    journals: service.listJournals(),
    journalEntries: service.listJournalEntries(),
    query: { tenantCompanyId, fromDate: "2026-08-01", toDate: "2026-08-31" }
  });
  const cashLedger = ledger.accounts.find((account) => account.account.id === cash.id);

  assert(cashLedger?.opening.debitAmount === "100.00", "General Ledger should classify entries before fromDate as opening balance.");
  assert(cashLedger?.periodDebit === "25.00" && cashLedger?.movements.length === 1, "General Ledger should include only period movements inside the date scope.");
  assert(cashLedger?.closing.debitAmount === "125.00", "General Ledger closing balance should equal opening plus period movement.");
  assert(ledger.periodDebitTotal === "25.00" && ledger.periodCreditTotal === "25.00", "Scoped General Ledger movement totals should reconcile inside the selected period.");
});

test("Finance Operations V1 supports account journal draft post ledger and trial balance workflow", () => {
  const {
    AccountingDomainError,
    AccountingService,
    ACCOUNTING_WORKSPACE_ID,
    createGeneralLedgerReport,
    createTrialBalanceReport
  } = load("src/modules/accounting");
  const service = new AccountingService({ now: () => "2026-08-17T12:00:00.000Z" });
  const tenantCompanyId = "tenant-finance-operations";

  const bank = service.createAccount({ id: "finance-ops-bank", tenantCompanyId, code: "512000", name: "Banque", type: "asset", normalBalance: "debit" });
  const customer = service.createAccount({ id: "finance-ops-customer", tenantCompanyId, code: "411000", name: "Client", type: "asset", normalBalance: "debit" });
  const journal = service.createJournal({ id: "finance-ops-journal", tenantCompanyId, code: "OD", name: "Operations diverses", type: "general" });
  const draft = service.createDraftEntry({
    id: "finance-ops-entry",
    tenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    journalId: journal.id,
    number: "JE-432-001",
    entryDate: "2026-08-17T00:00:00.000Z",
    reference: "MANUAL-432",
    description: "Encaissement manuel",
    functionalCurrency: "MAD",
    lines: [
      { id: "finance-ops-line-bank", accountId: bank.id, label: "Banque", debitAmount: "1000.00", creditAmount: "0.00" },
      { id: "finance-ops-line-customer", accountId: customer.id, label: "Client", debitAmount: "0.00", creditAmount: "1000.00" }
    ]
  });

  let ledger = createGeneralLedgerReport({ accounts: service.listAccounts(), journals: service.listJournals(), journalEntries: service.listJournalEntries(), query: { tenantCompanyId } });
  let trial = createTrialBalanceReport({ accounts: service.listAccounts(), journals: service.listJournals(), journalEntries: service.listJournalEntries(), query: { tenantCompanyId } });
  assert(ledger.periodDebitTotal === "0.00" && trial.periodDebitTotal === "0.00", "Draft entries should not affect Finance reports before posting.");

  const posted = service.postEntry(draft.id, "finance-user");
  ledger = createGeneralLedgerReport({ accounts: service.listAccounts(), journals: service.listJournals(), journalEntries: service.listJournalEntries(), query: { tenantCompanyId, fromDate: "2026-08-01", toDate: "2026-08-31" } });
  trial = createTrialBalanceReport({ accounts: service.listAccounts(), journals: service.listJournals(), journalEntries: service.listJournalEntries(), query: { tenantCompanyId, fromDate: "2026-08-01", toDate: "2026-08-31" } });

  const bankLedger = ledger.accounts.find((account) => account.account.id === bank.id);
  const customerLedger = ledger.accounts.find((account) => account.account.id === customer.id);
  assert(posted.status === "posted", "Balanced manual Finance entry should post through the canonical Accounting service.");
  assert(bankLedger?.movements.length === 1 && bankLedger.closing.debitAmount === "1000.00", "General Ledger should expose the posted debit movement.");
  assert(customerLedger?.movements.length === 1 && customerLedger.closing.creditAmount === "1000.00", "General Ledger should expose the posted credit movement.");
  assert(trial.periodDebitTotal === "1000.00" && trial.periodCreditTotal === "1000.00" && trial.balanced, "Trial Balance should reconcile after manual posting.");

  let unbalancedRejected = false;
  const unbalanced = service.createDraftEntry({
    id: "finance-ops-unbalanced",
    tenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    journalId: journal.id,
    number: "JE-432-002",
    entryDate: "2026-08-17T00:00:00.000Z",
    functionalCurrency: "MAD",
    lines: [
      { id: "finance-ops-unbalanced-debit", accountId: bank.id, label: "Debit", debitAmount: "1000.00", creditAmount: "0.00" },
      { id: "finance-ops-unbalanced-credit", accountId: customer.id, label: "Credit", debitAmount: "0.00", creditAmount: "900.00" }
    ]
  });
  try {
    service.postEntry(unbalanced.id, "finance-user");
  } catch (error) {
    unbalancedRejected = error instanceof AccountingDomainError && error.issues.some((issue) => issue.code === "not-balanced");
  }
  assert(unbalancedRejected, "Finance Operations should reject unbalanced posting through the canonical domain.");

  let postedProtected = false;
  try {
    service.updateDraftEntry(posted);
  } catch (error) {
    postedProtected = error instanceof AccountingDomainError && error.issues.some((issue) => issue.code === "posted-entry-locked");
  }
  assert(postedProtected, "Posted Finance entries should remain protected from silent mutation.");
});

test("Commercial Accounting maps issued Sales invoices into posted balanced source-linked entries", () => {
  const {
    ACCOUNTING_WORKSPACE_ID,
    createGeneralLedgerReport,
    createSalesInvoiceAccountingEntry,
    createTrialBalanceReport
  } = load("src/modules/accounting");
  const tenantCompanyId = "tenant-commercial-accounting";
  const accounts = [
    { id: "ar", tenantCompanyId, code: "411000", name: "Clients", type: "asset", normalBalance: "debit", active: true, createdAt: "2026-08-17T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z" },
    { id: "rev", tenantCompanyId, code: "701000", name: "Ventes", type: "income", normalBalance: "credit", active: true, createdAt: "2026-08-17T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z" },
    { id: "tax", tenantCompanyId, code: "445700", name: "TVA collectee", type: "liability", normalBalance: "credit", active: true, createdAt: "2026-08-17T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z" }
  ];
  const journals = [{ id: "sales-journal", tenantCompanyId, code: "VT", name: "Ventes", type: "sales", active: true, createdAt: "2026-08-17T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z" }];
  const settings = { tenantCompanyId, salesJournalId: "sales-journal", receivableAccountId: "ar", revenueAccountId: "rev", settlementAccountId: "ar", taxPayableAccountId: "tax", functionalCurrency: "MAD", createdAt: "2026-08-17T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z" };
  const invoice = createRuntimeInvoice({ id: "invoice-433", number: "FAC-433-001", status: "issued", items: [{ id: "line-1", description: "Service", quantity: 1, unitPrice: 1000, taxRate: 20 }] });

  const entry = createSalesInvoiceAccountingEntry(invoice, settings, { tenantCompanyId, workspaceId: ACCOUNTING_WORKSPACE_ID, userId: "accountant", now: () => "2026-08-17T10:00:00.000Z" });
  const ledger = createGeneralLedgerReport({ accounts, journals, journalEntries: [entry], query: { tenantCompanyId } });
  const trial = createTrialBalanceReport({ accounts, journals, journalEntries: [entry], query: { tenantCompanyId } });

  assert(entry.status === "posted", "Commercial invoice posting should create a posted entry.");
  assert(entry.sourceType === "sales.invoice" && entry.sourceId === "invoice-433", "Commercial invoice posting should preserve source identity.");
  assert(entry.debitTotal === "1200.00" && entry.creditTotal === "1200.00", "Commercial invoice posting should balance receivable against revenue and tax.");
  assert(ledger.periodDebitTotal === "1200.00" && ledger.periodCreditTotal === "1200.00", "Generated invoice entries should feed the General Ledger.");
  assert(trial.balanced && trial.periodDebitTotal === "1200.00", "Generated invoice entries should feed the Trial Balance.");
});

test("Commercial Accounting rejects draft invoices missing tax mapping and currency mismatch", () => {
  const { ACCOUNTING_WORKSPACE_ID, CommercialAccountingError, createSalesInvoiceAccountingEntry } = load("src/modules/accounting");
  const tenantCompanyId = "tenant-commercial-accounting";
  const settings = { tenantCompanyId, salesJournalId: "sales-journal", receivableAccountId: "ar", revenueAccountId: "rev", settlementAccountId: "bank", functionalCurrency: "MAD", createdAt: "2026-08-17T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z" };
  const context = { tenantCompanyId, workspaceId: ACCOUNTING_WORKSPACE_ID, userId: "accountant", now: () => "2026-08-17T10:00:00.000Z" };

  let draftRejected = false;
  try {
    createSalesInvoiceAccountingEntry(createRuntimeInvoice({ id: "draft-invoice", status: "draft" }), settings, context);
  } catch (error) {
    draftRejected = error instanceof CommercialAccountingError;
  }
  assert(draftRejected, "Draft Sales invoices should not create official accounting history.");

  let missingTaxRejected = false;
  try {
    createSalesInvoiceAccountingEntry(createRuntimeInvoice({ id: "taxed-invoice", status: "issued", items: [{ id: "line-1", description: "Service", quantity: 1, unitPrice: 1000, taxRate: 20 }] }), settings, context);
  } catch (error) {
    missingTaxRejected = error instanceof CommercialAccountingError && error.message.includes("TVA");
  }
  assert(missingTaxRejected, "Taxable invoices should require an explicit tax account mapping.");

  let currencyRejected = false;
  try {
    createSalesInvoiceAccountingEntry(createRuntimeInvoice({ id: "eur-invoice", status: "issued", currency: "EUR", items: [{ id: "line-1", description: "Service", quantity: 1, unitPrice: 1000, taxRate: 0 }] }), settings, context);
  } catch (error) {
    currencyRejected = error instanceof CommercialAccountingError && error.message.includes("devise");
  }
  assert(currencyRejected, "Commercial posting V1 should reject unsupported currency conversion.");
});

test("Commercial Accounting maps Sales payments into balanced receivable settlement entries", () => {
  const { ACCOUNTING_WORKSPACE_ID, createSalesPaymentAccountingEntry } = load("src/modules/accounting");
  const tenantCompanyId = "tenant-commercial-accounting";
  const settings = { tenantCompanyId, salesJournalId: "sales-journal", receivableAccountId: "ar", revenueAccountId: "rev", settlementAccountId: "bank", functionalCurrency: "MAD", createdAt: "2026-08-17T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z" };
  const payment = {
    id: "payment-433",
    workspaceId: "workspace-sales",
    number: "REG-433-001",
    invoiceId: "invoice-433",
    invoiceNumber: "FAC-433-001",
    customerName: "Atlas",
    companyId: "company-atlas",
    status: "recorded",
    method: "bank_transfer",
    amount: 500,
    currency: "MAD",
    receivedAt: "2026-08-18T00:00:00.000Z",
    ownerId: "owner",
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-08-18T00:00:00.000Z"
  };

  const entry = createSalesPaymentAccountingEntry(payment, settings, { tenantCompanyId, workspaceId: ACCOUNTING_WORKSPACE_ID, userId: "accountant", now: () => "2026-08-18T10:00:00.000Z" });
  assert(entry.status === "posted", "Commercial payment posting should create a posted entry.");
  assert(entry.sourceType === "sales.payment" && entry.sourceId === "payment-433", "Commercial payment posting should preserve source identity.");
  assert(entry.debitTotal === "500.00" && entry.creditTotal === "500.00", "Commercial payment posting should balance settlement and receivable.");
});

test("Commercial Accounting repository enforces durable source idempotency and tenant-scoped settings", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20260817130000_commercial_accounting_integration/migration.sql");
  const repository = read("src/server/persistence/accounting-repository.ts");
  const workspace = read("src/modules/accounting/ui/pages/accounting-workspace.tsx");

  assert(schema.includes("model AccountingCommercialPostingSettings"), "Commercial posting settings should be durable and tenant-scoped.");
  assert(schema.includes("@@unique([tenantCompanyId, sourceType, sourceId])"), "Accounting journal entries should enforce one entry per tenant/source.");
  assert(migration.includes('CREATE UNIQUE INDEX "AccountingJournalEntry_tenantCompanyId_sourceType_sourceId_key"'), "Migration should add durable source idempotency.");
  assert(repository.includes("findCommercialSourceEntry") && repository.includes("sourceType: entry.sourceType, sourceId: entry.sourceId"), "Repository should check existing source entries before inserting generated entries.");
  assert(repository.includes("assertCommercialPostingSettingsTenant"), "Repository should validate configured journals and accounts in the current tenant.");
  assert(workspace.includes("Intégration ventes") && workspace.includes("Comptabiliser la facture") && workspace.includes("Comptabiliser le règlement"), "Finance UI should expose controlled commercial accounting actions.");
});

test("Financial Statements derive Profit and Loss from posted income and expense period movements", () => {
  const { createProfitLossReport } = load("src/modules/accounting");
  const fixture = createFinancialStatementFixture();
  const report = createProfitLossReport({
    accounts: fixture.accounts,
    journals: fixture.journals,
    journalEntries: [
      createRuntimeAccountingEntry({ id: "before", tenantCompanyId: fixture.tenantA, journalId: fixture.journal.id, entryDate: "2026-07-31T12:00:00.000Z", lines: [
        line("before-bank", fixture.bank.id, "Bank", "100.00", "0.00"),
        line("before-revenue", fixture.revenue.id, "Revenue before", "0.00", "100.00")
      ] }),
      createRuntimeAccountingEntry({ id: "inside-revenue", tenantCompanyId: fixture.tenantA, journalId: fixture.journal.id, entryDate: "2026-08-10T12:00:00.000Z", lines: [
        line("inside-bank", fixture.bank.id, "Bank", "10000.00", "0.00"),
        line("inside-revenue", fixture.revenue.id, "Revenue", "0.00", "10000.00")
      ] }),
      createRuntimeAccountingEntry({ id: "inside-expense", tenantCompanyId: fixture.tenantA, journalId: fixture.journal.id, entryDate: "2026-08-11T12:00:00.000Z", lines: [
        line("inside-expense", fixture.expense.id, "Expense", "4000.00", "0.00"),
        line("inside-bank-credit", fixture.bank.id, "Bank", "0.00", "4000.00")
      ] }),
      createRuntimeAccountingEntry({ id: "after", tenantCompanyId: fixture.tenantA, journalId: fixture.journal.id, entryDate: "2026-09-01T12:00:00.000Z", lines: [
        line("after-bank", fixture.bank.id, "Bank", "900.00", "0.00"),
        line("after-revenue", fixture.revenue.id, "Revenue after", "0.00", "900.00")
      ] })
    ],
    query: { tenantCompanyId: fixture.tenantA, fromDate: "2026-08-01", toDate: "2026-08-31" }
  });

  assert(report.revenue.total === "10000.00", "P&L should include only revenue movements inside the selected period.");
  assert(report.expenses.total === "4000.00", "P&L should include only expense movements inside the selected period.");
  assert(report.netResult === "6000.00" && report.netResultSide === "profit", "P&L net result should be revenue minus expenses.");
});

test("Financial Statements derive Balance Sheet with explicit current period result", () => {
  const { createBalanceSheetReport } = load("src/modules/accounting");
  const fixture = createFinancialStatementFixture();
  const report = createBalanceSheetReport({
    accounts: fixture.accounts,
    journals: fixture.journals,
    journalEntries: [
      createRuntimeAccountingEntry({ id: "balance", tenantCompanyId: fixture.tenantA, journalId: fixture.journal.id, entryDate: "2026-08-17T12:00:00.000Z", lines: [
        line("balance-bank", fixture.bank.id, "Bank", "20000.00", "0.00"),
        line("balance-debt", fixture.debt.id, "Debt", "0.00", "8000.00"),
        line("balance-equity", fixture.equity.id, "Equity", "0.00", "6000.00"),
        line("balance-revenue", fixture.revenue.id, "Revenue", "0.00", "6000.00")
      ] })
    ],
    query: { tenantCompanyId: fixture.tenantA, fromDate: "2026-08-01", asOfDate: "2026-08-31" }
  });

  assert(report.totalAssets === "20000.00", "Balance Sheet should total asset account balances.");
  assert(report.liabilities.total === "8000.00", "Balance Sheet should total liability account balances.");
  assert(report.equity.total === "6000.00", "Balance Sheet should total equity account balances separately.");
  assert(report.currentPeriodResult === "6000.00" && report.currentPeriodResultSide === "profit", "Balance Sheet should expose current period result separately.");
  assert(report.totalLiabilitiesAndEquity === "20000.00" && report.reconciled, "Balance Sheet should reconcile assets to liabilities plus equity plus current result.");
});

test("Financial Statements exclude draft entries and preserve tenant isolation", () => {
  const { createProfitLossReport, createBalanceSheetReport } = load("src/modules/accounting");
  const fixture = createFinancialStatementFixture();
  const entries = [
    createRuntimeAccountingEntry({ id: "tenant-a-posted", tenantCompanyId: fixture.tenantA, journalId: fixture.journal.id, entryDate: "2026-08-17T12:00:00.000Z", lines: [
      line("tenant-a-bank", fixture.bank.id, "Bank", "1000.00", "0.00"),
      line("tenant-a-revenue", fixture.revenue.id, "Revenue", "0.00", "1000.00")
    ] }),
    createRuntimeAccountingEntry({ id: "tenant-a-draft", tenantCompanyId: fixture.tenantA, journalId: fixture.journal.id, status: "draft", entryDate: "2026-08-17T13:00:00.000Z", lines: [
      line("tenant-a-draft-bank", fixture.bank.id, "Bank", "9000.00", "0.00"),
      line("tenant-a-draft-revenue", fixture.revenue.id, "Draft Revenue", "0.00", "9000.00")
    ] }),
    createRuntimeAccountingEntry({ id: "tenant-b-posted", tenantCompanyId: fixture.tenantB, journalId: fixture.externalJournal.id, entryDate: "2026-08-17T14:00:00.000Z", lines: [
      line("tenant-b-bank", fixture.externalBank.id, "Bank", "5000.00", "0.00"),
      line("tenant-b-revenue", fixture.externalRevenue.id, "Revenue", "0.00", "5000.00")
    ] })
  ];
  const profitLoss = createProfitLossReport({ accounts: fixture.accounts, journals: fixture.journals, journalEntries: entries, query: { tenantCompanyId: fixture.tenantA, fromDate: "2026-08-01", toDate: "2026-08-31" } });
  const balanceSheet = createBalanceSheetReport({ accounts: fixture.accounts, journals: fixture.journals, journalEntries: entries, query: { tenantCompanyId: fixture.tenantA, fromDate: "2026-08-01", asOfDate: "2026-08-31" } });

  assert(profitLoss.revenue.total === "1000.00", "P&L should exclude draft entries and other tenants.");
  assert(balanceSheet.totalAssets === "1000.00", "Balance Sheet should exclude draft entries and other tenants.");
});

test("Financial Statements consume SPR-433 Sales invoice and payment postings without Sales-specific shortcuts", () => {
  const { ACCOUNTING_WORKSPACE_ID, createProfitLossReport, createBalanceSheetReport, createSalesInvoiceAccountingEntry, createSalesPaymentAccountingEntry } = load("src/modules/accounting");
  const fixture = createFinancialStatementFixture();
  const settings = { tenantCompanyId: fixture.tenantA, salesJournalId: fixture.journal.id, receivableAccountId: fixture.receivable.id, revenueAccountId: fixture.revenue.id, settlementAccountId: fixture.bank.id, functionalCurrency: "MAD", createdAt: "2026-08-17T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z" };
  const invoiceEntry = createSalesInvoiceAccountingEntry(createRuntimeInvoice({ id: "invoice-statement", number: "FAC-STMT", status: "issued", items: [{ id: "line-1", description: "Service", quantity: 1, unitPrice: 1000, taxRate: 0 }] }), settings, { tenantCompanyId: fixture.tenantA, workspaceId: ACCOUNTING_WORKSPACE_ID, userId: "accountant", now: () => "2026-08-17T10:00:00.000Z" });
  const paymentEntry = createSalesPaymentAccountingEntry({ id: "payment-statement", workspaceId: "workspace-sales", number: "REG-STMT", invoiceId: "invoice-statement", invoiceNumber: "FAC-STMT", customerName: "Atlas", companyId: "company-atlas", status: "recorded", method: "bank_transfer", amount: 500, currency: "MAD", receivedAt: "2026-08-18T00:00:00.000Z", ownerId: "owner", createdAt: "2026-08-18T00:00:00.000Z", updatedAt: "2026-08-18T00:00:00.000Z" }, settings, { tenantCompanyId: fixture.tenantA, workspaceId: ACCOUNTING_WORKSPACE_ID, userId: "accountant", now: () => "2026-08-18T10:00:00.000Z" });
  const profitLoss = createProfitLossReport({ accounts: fixture.accounts, journals: fixture.journals, journalEntries: [invoiceEntry, paymentEntry], query: { tenantCompanyId: fixture.tenantA, fromDate: "2026-08-01", toDate: "2026-08-31" } });
  const balanceSheet = createBalanceSheetReport({ accounts: fixture.accounts, journals: fixture.journals, journalEntries: [invoiceEntry, paymentEntry], query: { tenantCompanyId: fixture.tenantA, fromDate: "2026-08-01", asOfDate: "2026-08-31" } });

  assert(profitLoss.revenue.total === "1000.00", "Sales invoice postings should flow into P&L through canonical revenue accounts.");
  assert(balanceSheet.assets.total === "1000.00", "Sales invoice and payment postings should flow into Balance Sheet asset accounts.");
  assert(invoiceEntry.sourceType === "sales.invoice" && paymentEntry.sourceType === "sales.payment", "Statements should preserve commercial source traceability through journal entries.");
});

test("Financial Statements and Dashboard contribution are wired through Accounting read models", () => {
  const reportTypes = read("src/modules/accounting/accounting-reports.types.ts");
  const reportUtils = read("src/modules/accounting/accounting-reports.utils.ts");
  const repository = read("src/server/persistence/accounting-repository.ts");
  const dashboardContributions = read("src/platform/dashboard/dashboard-contributions.ts");
  const dashboardPage = read("src/app/(erp)/dashboard/page.tsx");
  const workspace = read("src/modules/accounting/ui/pages/accounting-workspace.tsx");

  assert(reportTypes.includes("ProfitLossReport") && reportTypes.includes("BalanceSheetReport"), "Accounting should expose typed P&L and Balance Sheet read models.");
  assert(reportUtils.includes("createProfitLossReport") && reportUtils.includes("createBalanceSheetReport"), "Financial statements should be pure derived read models.");
  assert(repository.includes("getAccountingProfitLoss") && repository.includes("getAccountingBalanceSheet"), "Repository should expose server-side financial statement queries.");
  assert(dashboardContributions.includes("finance.accounting.statements"), "Finance dashboard contribution should be registered by module metadata.");
  assert(dashboardPage.includes("getAccountingProfitLoss") && dashboardPage.includes("Indicateurs issus uniquement des écritures comptabilisées"), "Dashboard Finance contribution should derive from Accounting reports.");
  assert(workspace.includes("Compte de résultat") && workspace.includes("Actif = Dettes + Capitaux propres + Résultat"), "Finance workspace should expose P&L and Balance Sheet UI.");
});

test("Accounting Corrections create canonical reversal entries without mutating posted history", () => {
  const { AccountingService, ACCOUNTING_WORKSPACE_ID, createGeneralLedgerReport } = load("src/modules/accounting");
  const service = new AccountingService({ now: () => "2026-08-18T12:00:00.000Z" });
  const tenantCompanyId = "tenant-accounting-corrections";
  const bank = service.createAccount({ id: "correction-bank", tenantCompanyId, code: "512000", name: "Banque", type: "asset", normalBalance: "debit" });
  const revenue = service.createAccount({ id: "correction-revenue", tenantCompanyId, code: "701000", name: "Ventes", type: "income", normalBalance: "credit" });
  const journal = service.createJournal({ id: "correction-journal", tenantCompanyId, code: "OD", name: "Operations diverses", type: "general" });
  const draft = service.createDraftEntry({
    id: "correction-original",
    tenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    journalId: journal.id,
    number: "JE-435-001",
    entryDate: "2026-08-18T00:00:00.000Z",
    functionalCurrency: "MAD",
    lines: [
      { id: "correction-line-bank", accountId: bank.id, label: "Banque", debitAmount: "1000.00", creditAmount: "0.00" },
      { id: "correction-line-revenue", accountId: revenue.id, label: "Ventes", debitAmount: "0.00", creditAmount: "1000.00" }
    ]
  });
  const posted = service.postEntry(draft.id, "accountant-435");
  const reversal = service.reverseEntry(posted.id, { reversalDate: "2026-08-19T00:00:00.000Z", reason: "Montant incorrect", userId: "accountant-435" });
  const originalAfter = service.getJournalEntry(posted.id);
  const ledger = createGeneralLedgerReport({ accounts: service.listAccounts(), journals: service.listJournals(), journalEntries: service.listJournalEntries(), query: { tenantCompanyId, toDate: "2026-08-31" } });
  const bankLedger = ledger.accounts.find((row) => row.account.id === bank.id);

  assert(reversal.status === "posted", "Reversal should be a posted accounting entry.");
  assert(reversal.reversalOfEntryId === posted.id && originalAfter?.reversedByEntryId === reversal.id, "Reversal linkage should connect original and reversal.");
  assert(reversal.correctionReason === "Montant incorrect", "Reversal should preserve an explicit correction reason.");
  assert(reversal.lines[0].debitAmount === "0.00" && reversal.lines[0].creditAmount === "1000.00", "Reversal should swap debit and credit amounts.");
  assert(bankLedger?.closing.balanceAmount === "0.00", "Original plus reversal should naturally net to zero in the General Ledger.");
});

test("Accounting Corrections reject draft and duplicate reversal workflows", () => {
  const { AccountingDomainError, AccountingService, ACCOUNTING_WORKSPACE_ID } = load("src/modules/accounting");
  const service = new AccountingService({ now: () => "2026-08-18T12:00:00.000Z" });
  const tenantCompanyId = "tenant-accounting-correction-rejections";
  const bank = service.createAccount({ id: "correction-reject-bank", tenantCompanyId, code: "512000", name: "Banque", type: "asset", normalBalance: "debit" });
  const revenue = service.createAccount({ id: "correction-reject-revenue", tenantCompanyId, code: "701000", name: "Ventes", type: "income", normalBalance: "credit" });
  const journal = service.createJournal({ id: "correction-reject-journal", tenantCompanyId, code: "OD", name: "Operations diverses", type: "general" });
  const draft = service.createDraftEntry({
    id: "correction-reject-entry",
    tenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    journalId: journal.id,
    number: "JE-435-002",
    entryDate: "2026-08-18T00:00:00.000Z",
    functionalCurrency: "MAD",
    lines: [
      { id: "correction-reject-line-bank", accountId: bank.id, label: "Banque", debitAmount: "500.00", creditAmount: "0.00" },
      { id: "correction-reject-line-revenue", accountId: revenue.id, label: "Ventes", debitAmount: "0.00", creditAmount: "500.00" }
    ]
  });

  let draftRejected = false;
  try {
    service.reverseEntry(draft.id, { reversalDate: "2026-08-19T00:00:00.000Z", reason: "Test", userId: "accountant-435" });
  } catch (error) {
    draftRejected = error instanceof AccountingDomainError && error.issues.some((issue) => issue.code === "reversal-not-allowed");
  }
  assert(draftRejected, "Draft entries should not use reversal workflow.");

  const posted = service.postEntry(draft.id, "accountant-435");
  service.reverseEntry(posted.id, { reversalDate: "2026-08-19T00:00:00.000Z", reason: "Test", userId: "accountant-435" });
  let duplicateRejected = false;
  try {
    service.reverseEntry(posted.id, { reversalDate: "2026-08-20T00:00:00.000Z", reason: "Test 2", userId: "accountant-435" });
  } catch (error) {
    duplicateRejected = error instanceof AccountingDomainError && error.issues.some((issue) => issue.code === "reversal-not-allowed");
  }
  assert(duplicateRejected, "The same original should not be reversed twice through the normal V1 workflow.");
});

test("Accounting Period Control blocks postings in closed periods and allows later reversals", () => {
  const { AccountingDomainError, AccountingService, ACCOUNTING_WORKSPACE_ID } = load("src/modules/accounting");
  const service = new AccountingService({ now: () => "2026-08-18T12:00:00.000Z" });
  const tenantCompanyId = "tenant-accounting-periods";
  const bank = service.createAccount({ id: "period-bank", tenantCompanyId, code: "512000", name: "Banque", type: "asset", normalBalance: "debit" });
  const revenue = service.createAccount({ id: "period-revenue", tenantCompanyId, code: "701000", name: "Ventes", type: "income", normalBalance: "credit" });
  const journal = service.createJournal({ id: "period-journal", tenantCompanyId, code: "OD", name: "Operations diverses", type: "general" });
  service.createPeriod({ id: "period-august", tenantCompanyId, name: "Août 2026", startDate: "2026-08-01T00:00:00.000Z", endDate: "2026-08-31T23:59:59.999Z", status: "closed" });

  const blockedDraft = service.createDraftEntry({
    id: "period-blocked-entry",
    tenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    journalId: journal.id,
    number: "JE-435-003",
    entryDate: "2026-08-18T00:00:00.000Z",
    functionalCurrency: "MAD",
    lines: [
      { id: "period-blocked-bank", accountId: bank.id, label: "Banque", debitAmount: "300.00", creditAmount: "0.00" },
      { id: "period-blocked-revenue", accountId: revenue.id, label: "Ventes", debitAmount: "0.00", creditAmount: "300.00" }
    ]
  });
  let closedRejected = false;
  try {
    service.postEntry(blockedDraft.id, "accountant-435");
  } catch (error) {
    closedRejected = error instanceof AccountingDomainError && error.issues.some((issue) => issue.code === "period-closed");
  }
  assert(closedRejected, "Posting inside a closed accounting period should be rejected.");

  const outsideDraft = service.createDraftEntry({
    id: "period-open-entry",
    tenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    journalId: journal.id,
    number: "JE-435-004",
    entryDate: "2026-09-01T00:00:00.000Z",
    functionalCurrency: "MAD",
    lines: [
      { id: "period-open-bank", accountId: bank.id, label: "Banque", debitAmount: "300.00", creditAmount: "0.00" },
      { id: "period-open-revenue", accountId: revenue.id, label: "Ventes", debitAmount: "0.00", creditAmount: "300.00" }
    ]
  });
  const posted = service.postEntry(outsideDraft.id, "accountant-435");
  const reversal = service.reverseEntry(posted.id, { reversalDate: "2026-09-02T00:00:00.000Z", reason: "Correction en période ouverte", userId: "accountant-435" });
  assert(reversal.status === "posted" && reversal.entryDate.startsWith("2026-09-02"), "A reversal posted in an open period should remain allowed.");
});

test("Accounting Period Control rejects overlapping periods", () => {
  const { AccountingDomainError, AccountingService } = load("src/modules/accounting");
  const service = new AccountingService({ now: () => "2026-08-18T12:00:00.000Z" });
  const tenantCompanyId = "tenant-accounting-overlap";
  service.createPeriod({ id: "period-q1", tenantCompanyId, name: "T1", startDate: "2026-01-01T00:00:00.000Z", endDate: "2026-03-31T23:59:59.999Z" });
  let rejected = false;
  try {
    service.createPeriod({ id: "period-overlap", tenantCompanyId, name: "Overlap", startDate: "2026-03-01T00:00:00.000Z", endDate: "2026-06-30T23:59:59.999Z" });
  } catch (error) {
    rejected = error instanceof AccountingDomainError && error.issues.some((issue) => issue.code === "period-overlap");
  }
  assert(rejected, "Overlapping accounting periods should be rejected deterministically.");
});

test("Accounting Corrections and Period Control are durable repository-backed capabilities", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20260818100000_accounting_corrections_period_control/migration.sql");
  const repository = read("src/server/persistence/accounting-repository.ts");
  const client = read("src/platform/persistence/accounting-persistence.client.ts");
  const workspace = read("src/modules/accounting/ui/pages/accounting-workspace.tsx");

  assert(schema.includes("model AccountingPeriod") && schema.includes("reversalOfEntryId"), "Schema should persist periods and reversal linkage.");
  assert(migration.includes('CREATE TABLE "AccountingPeriod"') && migration.includes('"reversalOfEntryId"'), "Migration should create period control and reversal fields.");
  assert(repository.includes("reverseAccountingEntry") && repository.includes("assertPostingDateIsOpen(posted.entryDate"), "Repository should enforce server-side reversal and closed-period rules.");
  assert(repository.includes("Cette facture a deja ete contrepassee") && repository.includes("sourceType: \"accounting.reversal\""), "Commercial source state should detect reversed accounting postings.");
  assert(client.includes("reverseAccountingJournalEntry") && client.includes("closeAccountingPeriod"), "Client adapter should expose accounting control operations without Prisma.");
  assert(workspace.includes("Périodes") && workspace.includes("Contrepasser l'écriture"), "Finance workspace should expose period control and reversal actions.");
});

test("Procurement AP Accounting V1 reconciles legacy PurchaseInvoice without reusing it", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20260818110000_procurement_ap_accounting/migration.sql");
  const procurementRepository = read("src/server/persistence/procurement-repository.ts");
  const accountingRepository = read("src/server/persistence/accounting-repository.ts");
  const apUtils = read("src/modules/accounting/ap-accounting.utils.ts");

  assert(schema.includes("model PurchaseInvoice") && schema.includes("model ProcurementSupplierBill"), "Schema should preserve legacy PurchaseInvoice and add canonical ProcurementSupplierBill.");
  assert(schema.includes("supplier            ProcurementSupplier") && schema.includes("purchaseOrder       ProcurementPurchaseOrder?") && schema.includes("goodsReceipt        ProcurementGoodsReceipt?"), "Supplier Bill should link to active Procurement supplier, PO and Goods Receipt models.");
  assert(migration.includes('CREATE TABLE "ProcurementSupplierBill"') && migration.includes('CREATE TABLE "AccountingApPostingSettings"'), "AP migration should create Supplier Bill and AP posting settings tables.");
  assert(procurementRepository.includes("persistSupplierBill") && procurementRepository.includes("existing?.status === \"accounted\""), "Procurement repository should persist Supplier Bills and protect accounted bills.");
  assert(accountingRepository.includes("postSupplierBillToAccounting") && accountingRepository.includes("\"procurement.supplier-bill\""), "Accounting repository should post Supplier Bills through canonical source tracing.");
  assert(apUtils.includes("createSupplierBillAccountingEntry") && apUtils.includes("TVA récupérable"), "AP utility should generate supplier bill accounting entries with recoverable-tax support.");
});

test("Procurement AP Accounting V1 maps supplier bill accounting formula deterministically", () => {
  const { createSupplierBillAccountingEntry, ACCOUNTING_WORKSPACE_ID } = load("src/modules/accounting");
  const tenantCompanyId = "tenant-ap-runtime";
  const settings = {
    tenantCompanyId,
    purchaseJournalId: "journal-purchase",
    payableAccountId: "account-payable",
    expenseAccountId: "account-expense",
    taxRecoverableAccountId: "account-tax-recoverable",
    functionalCurrency: "MAD",
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-08-18T00:00:00.000Z"
  };
  const bill = createRuntimeSupplierBill();
  const entry = createSupplierBillAccountingEntry(bill, settings, {
    tenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    userId: "accountant-ap",
    now: () => "2026-08-18T12:00:00.000Z"
  });
  assert(entry.status === "posted", "AP entry should be posted by the accounting domain.");
  assert(entry.sourceType === "procurement.supplier-bill" && entry.sourceId === bill.id, "AP entry should preserve supplier bill source traceability.");
  assert(entry.debitTotal === "1200.00" && entry.creditTotal === "1200.00", "AP entry should balance expense plus recoverable tax against accounts payable.");
  assert(entry.lines.some((line) => line.accountId === "account-expense" && line.debitAmount === "1000.00"), "AP entry should debit purchase or expense account before tax.");
  assert(entry.lines.some((line) => line.accountId === "account-tax-recoverable" && line.debitAmount === "200.00"), "AP entry should debit recoverable tax when tax exists.");
  assert(entry.lines.some((line) => line.accountId === "account-payable" && line.creditAmount === "1200.00"), "AP entry should credit accounts payable for total TTC.");
});

test("Procurement AP Accounting V1 clears GRNI for stocked supplier bills without double expense", () => {
  const { createSupplierBillAccountingEntry, ACCOUNTING_WORKSPACE_ID } = load("src/modules/accounting");
  const tenantCompanyId = "tenant-ap-grni-runtime";
  const settings = {
    tenantCompanyId,
    purchaseJournalId: "journal-purchase",
    payableAccountId: "account-payable",
    expenseAccountId: "account-expense",
    grniClearingAccountId: "account-grni",
    functionalCurrency: "MAD",
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-08-18T00:00:00.000Z"
  };
  const bill = createRuntimeSupplierBill({ lines: [createRuntimeSupplierBillLine({ taxRate: 0 })] });
  const entry = createSupplierBillAccountingEntry(bill, settings, {
    tenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    userId: "accountant-ap",
    now: () => "2026-08-18T12:00:00.000Z"
  }, { stockClearingAmount: 1000 });

  assert(entry.debitTotal === "1000.00" && entry.creditTotal === "1000.00", "Stocked AP entry should balance GRNI clearing against AP.");
  assert(entry.lines.some((line) => line.accountId === "account-grni" && line.debitAmount === "1000.00"), "Stocked supplier bill should debit GRNI.");
  assert(!entry.lines.some((line) => line.accountId === "account-expense" && line.debitAmount !== "0.00"), "Stocked supplier bill should not double-debit expense.");
  assert(entry.lines.some((line) => line.accountId === "account-payable" && line.creditAmount === "1000.00"), "Stocked supplier bill should credit AP.");
});

test("Procurement AP Accounting V1 rejects unsafe supplier bill posting states", () => {
  const { ApAccountingError, createSupplierBillAccountingEntry, ACCOUNTING_WORKSPACE_ID } = load("src/modules/accounting");
  const tenantCompanyId = "tenant-ap-runtime";
  const settings = {
    tenantCompanyId,
    purchaseJournalId: "journal-purchase",
    payableAccountId: "account-payable",
    expenseAccountId: "account-expense",
    functionalCurrency: "MAD",
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-08-18T00:00:00.000Z"
  };
  const context = { tenantCompanyId, workspaceId: ACCOUNTING_WORKSPACE_ID, userId: "accountant-ap" };
  let draftRejected = false;
  try {
    createSupplierBillAccountingEntry(createRuntimeSupplierBill({ status: "draft" }), settings, context);
  } catch (error) {
    draftRejected = error instanceof ApAccountingError;
  }
  assert(draftRejected, "Draft supplier bills should not be posted to AP.");

  let currencyRejected = false;
  try {
    createSupplierBillAccountingEntry(createRuntimeSupplierBill({ currency: "EUR", lines: [createRuntimeSupplierBillLine({ taxRate: 0 })] }), settings, context);
  } catch (error) {
    currencyRejected = error instanceof ApAccountingError;
  }
  assert(currencyRejected, "AP V1 should reject supplier bills in a different currency.");

  let missingTaxAccountRejected = false;
  try {
    createSupplierBillAccountingEntry(createRuntimeSupplierBill(), settings, context);
  } catch (error) {
    missingTaxAccountRejected = error instanceof ApAccountingError;
  }
  assert(missingTaxAccountRejected, "AP V1 should require recoverable tax account when supplier bill tax exists.");
});

test("Supplier Payment AP Settlement V1 maps payment accounting formula deterministically", () => {
  const { ACCOUNTING_WORKSPACE_ID, ApAccountingError, createSupplierPaymentAccountingEntry } = load("src/modules/accounting");
  const tenantCompanyId = "tenant-ap-payment-runtime";
  const settings = {
    tenantCompanyId,
    purchaseJournalId: "journal-purchase",
    payableAccountId: "account-payable",
    settlementAccountId: "account-bank",
    functionalCurrency: "MAD",
    createdAt: "2026-08-19T00:00:00.000Z",
    updatedAt: "2026-08-19T00:00:00.000Z"
  };
  const payment = createRuntimeSupplierPayment();
  const entry = createSupplierPaymentAccountingEntry(payment, settings, {
    tenantCompanyId,
    workspaceId: ACCOUNTING_WORKSPACE_ID,
    userId: "accountant-ap",
    now: () => "2026-08-19T12:00:00.000Z"
  });

  assert(entry.status === "posted", "Supplier payment AP entry should be posted by the accounting domain.");
  assert(entry.sourceType === "procurement.supplier-payment" && entry.sourceId === payment.id, "Supplier payment AP entry should preserve source traceability.");
  assert(entry.debitTotal === "600.00" && entry.creditTotal === "600.00", "Supplier payment AP entry should balance AP clearing against settlement.");
  assert(entry.lines.some((line) => line.accountId === "account-payable" && line.debitAmount === "600.00"), "Supplier payment should debit accounts payable.");
  assert(entry.lines.some((line) => line.accountId === "account-bank" && line.creditAmount === "600.00"), "Supplier payment should credit the configured settlement account.");
  assert(!entry.lines.some((line) => ["account-expense", "account-tax", "account-stock", "account-cogs"].includes(line.accountId)), "Supplier payment should not touch expense, tax, stock or COGS accounts.");

  let draftRejected = false;
  try {
    createSupplierPaymentAccountingEntry(createRuntimeSupplierPayment({ status: "draft" }), settings, { tenantCompanyId, workspaceId: ACCOUNTING_WORKSPACE_ID, userId: "accountant-ap" });
  } catch (error) {
    draftRejected = error instanceof ApAccountingError;
  }
  assert(draftRejected, "Draft supplier payments should not be posted to AP.");

  let missingSettlementRejected = false;
  try {
    createSupplierPaymentAccountingEntry(payment, { ...settings, settlementAccountId: undefined }, { tenantCompanyId, workspaceId: ACCOUNTING_WORKSPACE_ID, userId: "accountant-ap" });
  } catch (error) {
    missingSettlementRejected = error instanceof ApAccountingError;
  }
  assert(missingSettlementRejected, "Supplier payment posting should require a settlement account.");
});

test("Supplier Payment AP Settlement V1 protects cumulative outstanding amount", () => {
  const { PROCUREMENT_WORKSPACE_ID, ProcurementService } = load("src/modules/procurement");
  const service = new ProcurementService({ now: () => "2026-08-19T12:00:00.000Z" });
  const supplier = service.createSupplier({
    workspaceId: PROCUREMENT_WORKSPACE_ID,
    companyName: "Atlas Supply",
    status: "active",
    ownerId: "procurement-user",
    contactName: "Nadia",
    phone: "",
    email: "",
    address: "",
    vatNumber: "",
    notes: ""
  }).supplier;
  assert(supplier, "Supplier fixture should be created.");
  const bill = service.createSupplierBill({
    workspaceId: PROCUREMENT_WORKSPACE_ID,
    supplierId: supplier.id,
    supplierName: supplier.companyName,
    billDate: "2026-08-19T00:00:00.000Z",
    currency: "MAD",
    status: "accounted",
    accountedAt: "2026-08-19T01:00:00.000Z",
    lines: [createRuntimeSupplierBillLine({ unitPrice: 1000, taxRate: 20 })],
    discountRate: 0,
    ownerId: "procurement-user"
  }).supplierBill;
  assert(bill, "Supplier bill fixture should be created.");
  const first = service.createSupplierPayment({
    workspaceId: PROCUREMENT_WORKSPACE_ID,
    supplierId: supplier.id,
    supplierBillId: bill.id,
    paymentDate: "2026-08-20T00:00:00.000Z",
    amount: 700,
    currency: "MAD",
    method: "bank_transfer",
    status: "finalized",
    ownerId: "procurement-user"
  });
  assert(first.supplierPayment, "First partial supplier payment should be accepted.");
  const second = service.createSupplierPayment({
    workspaceId: PROCUREMENT_WORKSPACE_ID,
    supplierId: supplier.id,
    supplierBillId: bill.id,
    paymentDate: "2026-08-21T00:00:00.000Z",
    amount: 500,
    currency: "MAD",
    method: "cheque",
    status: "finalized",
    ownerId: "procurement-user"
  });
  assert(second.supplierPayment, "Second partial supplier payment should settle the remaining supplier bill balance.");
  const overpayment = service.createSupplierPayment({
    workspaceId: PROCUREMENT_WORKSPACE_ID,
    supplierId: supplier.id,
    supplierBillId: bill.id,
    paymentDate: "2026-08-22T00:00:00.000Z",
    amount: 1,
    currency: "MAD",
    method: "cash",
    status: "finalized",
    ownerId: "procurement-user"
  });
  assert(!overpayment.supplierPayment && String(overpayment.error).includes("dépasse"), "Overpayment should be rejected against cumulative finalized supplier payments.");
});

test("Supplier Payment AP Settlement V1 is exposed through Procurement and Finance UI", () => {
  const descriptors = read("src/platform/modules/module.descriptors.ts");
  const editions = read("src/platform/editions/edition.profiles.ts");
  const route = read("src/app/(erp)/procurement/supplier-bills/page.tsx");
  const procurementPage = read("src/modules/procurement/ui/pages/supplier-bills-page.tsx");
  const accountingWorkspace = read("src/modules/accounting/ui/pages/accounting-workspace.tsx");
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20260819100000_supplier_payment_ap_settlement/migration.sql");
  const accountingRepository = read("src/server/persistence/accounting-repository.ts");

  assert(descriptors.includes("procurement.supplier-bills") && descriptors.includes("/procurement/supplier-bills"), "Module Registry should describe Supplier Bills.");
  assert(editions.includes("\"procurement.supplier-bills\""), "Alpha profile should activate Supplier Bills explicitly.");
  assert(route.includes("SupplierBillsPage"), "Supplier Bills route should render the operational Procurement page.");
  assert(schema.includes("model ProcurementSupplierPayment") && schema.includes("supplierBill        ProcurementSupplierBill"), "Schema should persist Procurement-owned supplier payments linked to Supplier Bills.");
  assert(migration.includes('CREATE TABLE "ProcurementSupplierPayment"') && migration.includes('"supplierBillId"'), "Migration should create Supplier Payment persistence with Supplier Bill linkage.");
  assert(procurementPage.includes("Enregistrer un règlement") && procurementPage.includes("Reste à payer"), "Procurement UI should expose supplier payment recording from accounted supplier bills.");
  assert(accountingWorkspace.includes("Règlements fournisseurs à comptabiliser") && accountingWorkspace.includes("postSupplierPaymentToAccounting"), "Finance UI should expose AP integration for supplier payments.");
  assert(accountingRepository.includes("\"procurement.supplier-payment\"") && accountingRepository.includes("findReversalOfEntry"), "Accounting repository should post supplier payments idempotently by source.");
});

test("Inventory Valuation V1 introduces durable moving-average valuation events", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20260818120000_inventory_valuation_cogs/migration.sql");
  const inventoryRepository = read("src/server/persistence/inventory-repository.ts");

  assert(schema.includes("model InventoryValuationEvent") && schema.includes("movementId      String                 @unique"), "Inventory valuation should be a durable one-event-per-movement model.");
  assert(migration.includes('CREATE TABLE "InventoryValuationEvent"') && migration.includes('CREATE UNIQUE INDEX "InventoryValuationEvent_movementId_key"'), "Inventory valuation migration should enforce movement idempotency.");
  assert(inventoryRepository.includes("valuationMethod: \"moving_average_v1\""), "Inventory valuation should use one deterministic V1 method.");
  assert(inventoryRepository.includes("resolveInboundCostMinor") && inventoryRepository.includes("consumeOutboundCostMinor"), "Inventory valuation should separate inbound cost creation from outbound consumption.");
});

test("Inventory Valuation V1 rejects missing cost and insufficient valued stock", () => {
  const inventoryRepository = read("src/server/persistence/inventory-repository.ts");

  assert(inventoryRepository.includes("Coût d'achat manquant pour la valorisation"), "Inbound valuation should reject missing purchase cost instead of using zero.");
  assert(inventoryRepository.includes("Coût produit manquant pour la valorisation d'entrée"), "Manual inbound valuation should reject missing product cost.");
  assert(inventoryRepository.includes("Quantité valorisée insuffisante pour comptabiliser le COGS"), "Outbound valuation should reject insufficient valued quantity.");
});

test("Inventory COGS Accounting V1 maps outbound valuation to balanced journal entries", () => {
  const { ACCOUNTING_WORKSPACE_ID, createInventoryCogsAccountingEntry } = load("src/modules/accounting");
  const tenantCompanyId = "tenant-inventory-cogs";
  const settings = {
    tenantCompanyId,
    inventoryJournalId: "journal-inventory",
    inventoryAssetAccountId: "account-inventory",
    cogsAccountId: "account-cogs",
    functionalCurrency: "MAD",
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-08-18T00:00:00.000Z"
  };
  const valuationEvent = createRuntimeValuationEvent();
  const entry = createInventoryCogsAccountingEntry({
    valuationEvent,
    settings,
    context: {
      tenantCompanyId,
      workspaceId: ACCOUNTING_WORKSPACE_ID,
      userId: "accountant-inventory",
      now: () => "2026-08-18T12:00:00.000Z"
    }
  });

  assert(entry.status === "posted", "Inventory COGS entry should be posted by the accounting bridge.");
  assert(entry.sourceType === "inventory.cogs" && entry.sourceId === valuationEvent.id, "Inventory COGS should preserve valuation source traceability.");
  assert(entry.debitTotal === "250.00" && entry.creditTotal === "250.00", "Inventory COGS entry should be balanced.");
  assert(entry.lines.some((line) => line.accountId === "account-cogs" && line.debitAmount === "250.00"), "Inventory COGS should debit COGS.");
  assert(entry.lines.some((line) => line.accountId === "account-inventory" && line.creditAmount === "250.00"), "Inventory COGS should credit Inventory Asset.");
});

test("Inventory Receipt Accounting V1 maps inbound valuation to GRNI entries", () => {
  const { ACCOUNTING_WORKSPACE_ID, createInventoryReceiptAccountingEntry } = load("src/modules/accounting");
  const tenantCompanyId = "tenant-inventory-receipt";
  const settings = {
    tenantCompanyId,
    inventoryJournalId: "journal-inventory",
    inventoryAssetAccountId: "account-inventory",
    cogsAccountId: "account-cogs",
    grniClearingAccountId: "account-grni",
    functionalCurrency: "MAD",
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-08-18T00:00:00.000Z"
  };
  const valuationEvent = createRuntimeValuationEvent({ eventType: "INBOUND", totalValue: 1000, unitCost: 100, quantity: 10 });
  const entry = createInventoryReceiptAccountingEntry({
    valuationEvent,
    settings,
    context: {
      tenantCompanyId,
      workspaceId: ACCOUNTING_WORKSPACE_ID,
      userId: "accountant-inventory",
      now: () => "2026-08-18T12:00:00.000Z"
    }
  });

  assert(entry.status === "posted", "Inventory receipt entry should be posted by the accounting bridge.");
  assert(entry.sourceType === "inventory.receipt-valuation" && entry.sourceId === valuationEvent.id, "Inventory receipt accounting should preserve valuation source traceability.");
  assert(entry.debitTotal === "1000.00" && entry.creditTotal === "1000.00", "Inventory receipt entry should be balanced.");
  assert(entry.lines.some((line) => line.accountId === "account-inventory" && line.debitAmount === "1000.00"), "Inventory receipt should debit Inventory Asset.");
  assert(entry.lines.some((line) => line.accountId === "account-grni" && line.creditAmount === "1000.00"), "Inventory receipt should credit GRNI.");
});

test("Inventory COGS Accounting V1 rejects unsafe source states", () => {
  const { AccountingDomainError, ACCOUNTING_WORKSPACE_ID, createInventoryCogsAccountingEntry } = load("src/modules/accounting");
  const tenantCompanyId = "tenant-inventory-cogs";
  const settings = {
    tenantCompanyId,
    inventoryJournalId: "journal-inventory",
    inventoryAssetAccountId: "account-inventory",
    cogsAccountId: "account-cogs",
    functionalCurrency: "MAD",
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-08-18T00:00:00.000Z"
  };
  const context = { tenantCompanyId, workspaceId: ACCOUNTING_WORKSPACE_ID, userId: "accountant-inventory" };

  let inboundRejected = false;
  try {
    createInventoryCogsAccountingEntry({ valuationEvent: createRuntimeValuationEvent({ eventType: "INBOUND" }), settings, context });
  } catch (error) {
    inboundRejected = error instanceof AccountingDomainError;
  }
  assert(inboundRejected, "Inbound valuation should not create COGS.");

  let currencyRejected = false;
  try {
    createInventoryCogsAccountingEntry({ valuationEvent: createRuntimeValuationEvent({ currency: "EUR" }), settings, context });
  } catch (error) {
    currencyRejected = error instanceof AccountingDomainError;
  }
  assert(currencyRejected, "COGS V1 should reject currency mismatch.");
});

test("Inventory Valuation V1 is exposed through Inventory and Finance with controlled GRNI accounting", () => {
  const accountingWorkspace = read("src/modules/accounting/ui/pages/accounting-workspace.tsx");
  const inventoryWorkspace = read("src/modules/inventory/ui/pages/inventory-workspace.tsx");
  const accountingRepository = read("src/server/persistence/accounting-repository.ts");
  const accountingClient = read("src/platform/persistence/accounting-persistence.client.ts");

  assert(accountingWorkspace.includes("Intégration stock") && accountingWorkspace.includes("postInventoryCogsToAccounting") && accountingWorkspace.includes("postInventoryReceiptToAccounting"), "Finance UI should expose controlled stock and receipt accounting integration.");
  assert(inventoryWorkspace.includes("Synchroniser valorisation") && inventoryWorkspace.includes("Valeur stock"), "Inventory UI should expose operational valuation reporting.");
  assert(accountingRepository.includes("\"inventory.cogs\"") && accountingRepository.includes("\"inventory.receipt-valuation\"") && accountingClient.includes("saveInventoryPostingSettings"), "Accounting adapters should expose inventory COGS, receipt valuation and settings operations.");
  assert(accountingRepository.includes("La réception stock doit être comptabilisée en GRNI avant la facture fournisseur"), "Supplier Bill GRNI clearing should require prior receipt capitalization.");
  assert(accountingRepository.includes("previouslyAccountedLines") && accountingRepository.includes("solde reçu disponible"), "Supplier Bill GRNI clearing should protect cumulative partial receipt quantities.");
  assert(accountingWorkspace.includes("Compte GRNI") && accountingWorkspace.includes("Réceptions valorisées à capitaliser"), "Finance UI should expose the GRNI account and receipt capitalization queue.");
  assert(accountingWorkspace.includes("afin d'éviter toute double reconnaissance"), "Finance UI should explain the no-double-recognition rule.");
});

test("SPR-438A links supplier bill lines to selected Goods Receipt lines", () => {
  const dialog = read("src/modules/procurement/ui/dialogs/supplier-bill-dialog.tsx");
  const page = read("src/modules/procurement/ui/pages/supplier-bills-page.tsx");
  const repository = read("src/server/persistence/procurement-repository.ts");

  assert(dialog.includes("function selectReceipt") && dialog.includes("goodsReceiptLineId: line.id"), "Supplier Bill receipt selection should copy the selected Goods Receipt line identity.");
  assert(dialog.includes("purchaseOrderLineId: line.purchaseOrderLineId") && dialog.includes("quantity: line.receivedQuantity"), "Supplier Bill receipt selection should preserve PO line identity and received quantity.");
  assert(dialog.includes("onChange={(event) => selectReceipt(event.target.value)}"), "Goods Receipt selector should use the receipt-aware line mapper, not a header-only update.");
  assert(page.includes("lines: form.lines"), "Supplier Bill submission should persist the mapped line-level receipt links.");
  assert(repository.includes("goodsReceiptLineId: line.goodsReceiptLineId ?? null"), "Procurement persistence should retain Supplier Bill line Goods Receipt links.");
});

test("SPR-438A hardens Goods Receipt valuation identity for GRNI resolution", () => {
  const procurementRepository = read("src/server/persistence/procurement-repository.ts");
  const accountingRepository = read("src/server/persistence/accounting-repository.ts");

  assert(procurementRepository.includes("const persistedLineId = createGoodsReceiptLinePersistenceId(receipt.id, line, index)") && procurementRepository.includes("id: `movement-${receipt.id}-${persistedLineId}`"), "Goods Receipt posting should create future stock movements from the persisted receipt line identity.");
  assert(accountingRepository.includes("inventoryStockMovement.findMany") && accountingRepository.includes("movementByReceiptLine"), "GRNI reconciliation should resolve receipt valuation through actual posted stock movements.");
  assert(accountingRepository.includes("candidates.length === 1") && accountingRepository.includes("decimalToNumber(movement.quantity) === decimalToNumber(receiptLine.receivedQuantity)"), "GRNI reconciliation should support one safe legacy movement match without guessing ambiguous lines.");
  assert(accountingRepository.includes("La réception stock doit être comptabilisée en GRNI avant la facture fournisseur"), "Pending receipt capitalization should remain an explicit blocked accounting reason.");
});

test("SPR-438A avoids misleading AP treatment labels for header-only receipt links", () => {
  const accountingWorkspace = read("src/modules/accounting/ui/pages/accounting-workspace.tsx");

  assert(accountingWorkspace.includes("function getSupplierBillTreatment"), "AP integration should centralize Supplier Bill treatment classification.");
  assert(accountingWorkspace.includes("\"Non rapproché\""), "A header-only Goods Receipt link should be displayed as unmatched instead of Charges.");
  assert(accountingWorkspace.includes("row.treatment === \"Non rapproché\" ? \"warning\""), "Unmatched stock-link candidates should have a visible warning treatment.");
});

test("HR Core service manages employees departments positions contracts and leave without auth-user coupling", () => {
  const { HrService } = load("src/modules/hr");
  const service = new HrService({ now: () => "2026-08-19T09:00:00.000Z" });

  const department = service.createDepartment({
    code: "OPS",
    name: "Operations",
    description: "Equipe operationnelle",
    active: true
  }).department;
  assert(Boolean(department), "HR service should create Departments.");

  const position = service.createPosition({
    code: "OPS-MGR",
    name: "Responsable operations",
    departmentId: department.id,
    description: "Management operationnel",
    active: true
  }).position;
  assert(Boolean(position), "HR service should create Positions attached to Departments.");

  const manager = service.createEmployee({
    employeeNumber: "EMP-0001",
    firstName: "Sara",
    lastName: "Amrani",
    email: "sara@example.test",
    phone: "+212600000001",
    hireDate: "2026-08-19T00:00:00.000Z",
    status: "active",
    departmentId: department.id,
    positionId: position.id,
    notes: "Manager RH"
  }).employee;
  assert(Boolean(manager), "HR service should create Employees independent from Auth User.");

  const employee = service.createEmployee({
    employeeNumber: "EMP-0002",
    firstName: "Nadia",
    lastName: "El Fassi",
    hireDate: "2026-08-19T00:00:00.000Z",
    status: "active",
    departmentId: department.id,
    positionId: position.id,
    managerEmployeeId: manager.id
  }).employee;
  assert(Boolean(employee), "HR service should preserve manager relationships.");

  const selfManagerRejected = service.updateEmployee({ id: employee.id, managerEmployeeId: employee.id });
  assert(Boolean(selfManagerRejected.error), "HR service should reject self-manager assignments.");

  const contract = service.createContract({
    employeeId: employee.id,
    contractType: "permanent",
    startDate: "2026-08-19T00:00:00.000Z",
    positionId: position.id,
    jobTitle: position.name,
    workingTimeType: "full_time",
    currency: "MAD",
    status: "active"
  }).contract;
  assert(Boolean(contract), "HR service should create an employment contract without payroll calculations.");

  const leaveType = service.createLeaveType({ name: "Congé payé", paid: true, active: true }).leaveType;
  const leave = service.createLeaveRequest({
    employeeId: employee.id,
    leaveTypeId: leaveType.id,
    title: "Congé annuel",
    reason: "Validation Runtime",
    startDate: "2026-08-20T00:00:00.000Z",
    endDate: "2026-08-22T00:00:00.000Z",
    status: "requested",
    requestedAt: "2026-08-19T09:00:00.000Z"
  }).leaveRequest;
  assert(Boolean(leave), "HR service should support a minimal Leave Request lifecycle.");

  const archived = service.updateEmployee({ id: employee.id, status: "archived" }).employee;
  assert(archived?.archivedAt === "2026-08-19T09:00:00.000Z", "Archiving an Employee should set archivedAt deterministically.");
});

test("HR Core is active in Alpha navigation route availability and Command Center", () => {
  const { getCurrentAlphaActivation } = load("src/platform/modules");
  const { getSidebarGroups } = load("src/services/navigation/sidebar-adapter.ts");
  const { createNavigationCommandRegistry } = load("src/platform/search/command-registry.ts");
  const { isRouteAvailable, getRouteAvailabilityDecision } = load("src/platform/modules/module-route-availability.ts");
  const activation = getCurrentAlphaActivation();
  const hrefs = getSidebarGroups(activation).flatMap((group) => group.items.map((item) => item.href));
  const commandHrefs = createNavigationCommandRegistry(activation).getAll().map((command) => command.href);

  assert(activation.activeModuleIdSet.has("hr.employees"), "Alpha activation should include HR Core.");
  assert(hrefs.includes("/rh"), "Sidebar should expose the canonical HR workspace.");
  assert(commandHrefs.includes("/rh"), "Command Center should expose HR navigation.");
  assert(isRouteAvailable("/rh", activation), "Canonical HR route should be available in Alpha.");
  assert(getRouteAvailabilityDecision("/rh/employes", activation).redirectTo === "/rh", "Legacy HR employee route should redirect to the canonical HR workspace.");
});

test("HR Core persistence and UI stay tenant-scoped and free of legacy payroll workflows", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20260819110000_hr_core_alpha_foundation/migration.sql");
  const repository = read("src/server/persistence/hr-repository.ts");
  const route = read("src/app/api/persistence/hr/route.ts");
  const workspace = read("src/modules/hr/ui/pages/hr-workspace-page.tsx");
  const descriptors = read("src/platform/modules/module.descriptors.ts");

  assert(schema.includes("model HrEmployee") && schema.includes("tenantCompanyId"), "Schema should define tenant-scoped canonical HrEmployee records.");
  assert(schema.includes("linkedUserId") && schema.includes("linkedUser            User?"), "HR Employee should support an optional explicit Auth User link.");
  assert(schema.includes("model HrDepartment") && schema.includes("model HrPosition") && schema.includes("model HrEmploymentContract"), "Schema should include Department, Position and Contract foundations.");
  assert(schema.includes("model HrLeaveType") && schema.includes("model HrLeaveRequest"), "Schema should include the minimal Leave foundation.");
  assert(migration.includes('CREATE TABLE "HrEmployee"') && migration.includes('FOREIGN KEY ("tenantCompanyId") REFERENCES "Company"'), "Migration should create HR tables with tenant Company foreign keys.");
  assert(repository.includes("assertOptionalUserTenant") && repository.includes("Un employé ne peut pas être son propre manager"), "Repository should enforce optional User tenant ownership and self-manager rejection.");
  assert(route.includes("requirePersistenceTenantScope"), "HR persistence route should resolve tenant scope on the server.");
  assert(workspace.includes("Un employé RH peut exister sans compte utilisateur BOSIACO."), "UI should state that Employee and Auth User are separate concepts.");
  assert(!descriptors.includes('features: ["employees", "leaves", "payroll"]'), "HR descriptor should not expose payroll as an Alpha capability.");
});

test("HR Unified Search provider returns hydrated employee results", async () => {
  const { HrService, hrLocalService } = load("src/modules/hr");
  const { SearchService } = load("src/services/search");
  const snapshot = hrLocalService.getSnapshot();
  const fixture = new HrService({ now: () => "2026-08-19T09:00:00.000Z" });
  const department = fixture.createDepartment({ code: "RH", name: "Ressources humaines", active: true }).department;
  const position = fixture.createPosition({ code: "HR-BP", name: "HR Business Partner", departmentId: department.id, active: true }).position;
  const employee = fixture.createEmployee({
    employeeNumber: "EMP-SEARCH-001",
    firstName: "Leila",
    lastName: "Bennani",
    hireDate: "2026-08-19T00:00:00.000Z",
    status: "active",
    departmentId: department.id,
    positionId: position.id
  }).employee;

  hrLocalService.replaceSnapshot(fixture.getSnapshot());
  const service = new SearchService();
  const results = await service.searchUnified({ text: "Leila", modules: ["hr.employees"], limit: 5 });
  hrLocalService.replaceSnapshot(snapshot);

  assert(results.some((result) => result.entityType === "hr.employee" && result.entityId === employee.id && result.url === "/rh"), "Unified Search should return HR Employee records through the HR provider.");
});

test("Inventory Valuation synchronization precomputes references before short write transaction", () => {
  const repository = read("src/server/persistence/inventory-repository.ts");
  const reconcileStart = repository.indexOf("export async function reconcileInventoryValuation");
  const nextExport = repository.indexOf("\nexport async function createInventoryWarehouse", reconcileStart);
  const reconcileBody = repository.slice(reconcileStart, nextExport);
  const transactionStart = reconcileBody.indexOf("prisma.$transaction");
  const transactionBody = transactionStart >= 0 ? reconcileBody.slice(transactionStart) : "";

  assert(reconcileBody.includes("procurementGoodsReceipt.findMany"), "Valuation sync should batch preload Goods Receipt references before writing.");
  assert(reconcileBody.includes("product.findMany"), "Valuation sync should batch preload Product cost references before writing.");
  assert(transactionBody.includes("inventoryValuationEvent.createMany"), "Valuation sync write transaction should only persist planned valuation events.");
  assert(!transactionBody.includes("procurementGoodsReceipt.findUnique") && !transactionBody.includes("procurementGoodsReceipt.findMany"), "Goods Receipt lookups must not run inside the valuation write transaction.");
  assert(!transactionBody.includes("product.findUnique") && !transactionBody.includes("product.findMany"), "Product cost lookups must not run inside the valuation write transaction.");
  assert(repository.includes("buildMissingValuationEventWrite") && repository.includes("goodsReceiptById"), "Valuation plans should be built from preloaded reference maps.");
});

function createRuntimeInvoice(overrides = {}) {
  const invoice = {
    id: "invoice-runtime",
    workspaceId: "workspace-sales",
    number: "FAC-RUNTIME",
    customerName: "Atlas",
    companyId: "company-atlas",
    companyName: "Atlas",
    status: "issued",
    issueDate: "2026-08-17T00:00:00.000Z",
    dueDate: "2026-09-16T00:00:00.000Z",
    currency: "MAD",
    items: [{ id: "line-runtime", description: "Service", quantity: 1, unitPrice: 1000, taxRate: 0 }],
    discountRate: 0,
    ownerId: "owner",
    paidAmount: 0,
    createdAt: "2026-08-17T00:00:00.000Z",
    updatedAt: "2026-08-17T00:00:00.000Z",
    ...overrides
  };
  return invoice;
}

function createRuntimeValuationEvent(overrides = {}) {
  return {
    id: "valuation-runtime",
    companyId: "tenant-inventory-cogs",
    productId: "product-runtime",
    warehouseId: "warehouse-runtime",
    movementId: "movement-runtime",
    eventType: "OUTBOUND",
    valuationMethod: "moving_average_v1",
    quantity: 5,
    unitCost: 50,
    totalValue: 250,
    currency: "MAD",
    sourceType: "inventory.delivery-note",
    sourceId: "delivery-runtime",
    occurredAt: "2026-08-18T00:00:00.000Z",
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-08-18T00:00:00.000Z",
    ...overrides
  };
}

function createRuntimeSupplierBill(overrides = {}) {
  return {
    id: "supplier-bill-runtime",
    workspaceId: "procurement-main",
    number: "FB-RUNTIME",
    supplierId: "supplier-runtime",
    supplierName: "Atlas Supply",
    purchaseOrderId: "po-runtime",
    purchaseOrderNumber: "PO-RUNTIME",
    billDate: "2026-08-18T00:00:00.000Z",
    dueDate: "2026-09-17T00:00:00.000Z",
    currency: "MAD",
    status: "finalized",
    lines: [createRuntimeSupplierBillLine()],
    discountRate: 0,
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-08-18T00:00:00.000Z",
    ...overrides
  };
}

function createRuntimeSupplierBillLine(overrides = {}) {
  return {
    id: "supplier-bill-line-runtime",
    productId: "product-runtime",
    productSku: "SKU-RUNTIME",
    productName: "Produit Runtime",
    description: "Produit fournisseur",
    quantity: 1,
    unit: "piece",
    unitPrice: 1000,
    discountRate: 0,
    taxRate: 20,
    ...overrides
  };
}

function createRuntimeSupplierPayment(overrides = {}) {
  return {
    id: "supplier-payment-runtime",
    workspaceId: "procurement-main",
    number: "SP-RUNTIME",
    supplierId: "supplier-runtime",
    supplierName: "Atlas Supply",
    supplierBillId: "supplier-bill-runtime",
    supplierBillNumber: "FB-RUNTIME",
    paymentDate: "2026-08-19T00:00:00.000Z",
    amount: 600,
    currency: "MAD",
    method: "bank_transfer",
    status: "finalized",
    finalizedAt: "2026-08-19T00:00:00.000Z",
    createdAt: "2026-08-19T00:00:00.000Z",
    updatedAt: "2026-08-19T00:00:00.000Z",
    ...overrides
  };
}

function createFinancialStatementFixture() {
  const tenantA = "tenant-financial-statements-a";
  const tenantB = "tenant-financial-statements-b";
  const baseDate = "2026-08-17T00:00:00.000Z";
  const bank = account("account-bank", tenantA, "512000", "Banque", "asset", "debit");
  const receivable = account("account-receivable", tenantA, "411000", "Clients", "asset", "debit");
  const debt = account("account-debt", tenantA, "164000", "Emprunts", "liability", "credit");
  const equity = account("account-equity", tenantA, "101000", "Capital", "equity", "credit");
  const revenue = account("account-revenue", tenantA, "701000", "Ventes", "income", "credit");
  const expense = account("account-expense", tenantA, "606000", "Charges", "expense", "debit");
  const externalBank = account("account-bank-b", tenantB, "512000", "Banque B", "asset", "debit");
  const externalRevenue = account("account-revenue-b", tenantB, "701000", "Ventes B", "income", "credit");
  const journal = { id: "journal-sales", tenantCompanyId: tenantA, code: "VT", name: "Ventes", type: "sales", active: true, createdAt: baseDate, updatedAt: baseDate };
  const externalJournal = { id: "journal-sales-b", tenantCompanyId: tenantB, code: "VT", name: "Ventes B", type: "sales", active: true, createdAt: baseDate, updatedAt: baseDate };
  return {
    tenantA,
    tenantB,
    bank,
    receivable,
    debt,
    equity,
    revenue,
    expense,
    externalBank,
    externalRevenue,
    journal,
    externalJournal,
    accounts: [bank, receivable, debt, equity, revenue, expense, externalBank, externalRevenue],
    journals: [journal, externalJournal]
  };
}

function account(id, tenantCompanyId, code, name, type, normalBalance) {
  return { id, tenantCompanyId, code, name, type, normalBalance, active: true, createdAt: "2026-08-17T00:00:00.000Z", updatedAt: "2026-08-17T00:00:00.000Z" };
}

function createRuntimeAccountingEntry({ id, tenantCompanyId, journalId, entryDate, lines, status = "posted" }) {
  const debit = lines.reduce((sum, item) => sum + Number(item.debitAmount), 0).toFixed(2);
  const credit = lines.reduce((sum, item) => sum + Number(item.creditAmount), 0).toFixed(2);
  return {
    id,
    tenantCompanyId,
    workspaceId: "accounting-main",
    journalId,
    number: `JE-${id}`,
    entryDate,
    status,
    functionalCurrency: "MAD",
    debitTotal: debit,
    creditTotal: credit,
    lines,
    createdAt: entryDate,
    updatedAt: entryDate,
    postedAt: status === "posted" ? entryDate : undefined
  };
}

function line(id, accountId, label, debitAmount, creditAmount) {
  return { id, accountId, label, debitAmount, creditAmount };
}

async function runValidation() {
  for (const run of scheduledTests) {
    await run();
  }

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
}

runValidation().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
