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
  assert(crmModule.navigation.children.length === 5, "CRM navigation should prepare five child placeholders.");
  assert(crmModule.routes.every((route) => route.lazy), "CRM routes should be lazy-load-ready placeholders.");
});

test("CRM Module Foundation remains platform-consumer only", () => {
  const crmFiles = listFiles("src/modules/crm").filter((file) => !file.includes("/customers/"));
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
  const customerFiles = listFiles("src/modules/crm/customers");
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
