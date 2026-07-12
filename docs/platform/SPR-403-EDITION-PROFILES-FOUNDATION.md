# SPR-403 — Edition Profiles Foundation

## Executive Summary

SPR-403 introduces the Edition Profiles Foundation for BOSIACO's Modular Editions Platform.

SPR-401 describes what modules exist.
SPR-402 determines which modules are active.
SPR-403 defines reusable commercial Edition profiles that provide activation input.

One codebase can now describe multiple future Editions without changing the current Alpha user experience.

## Architecture

Implementation lives in `src/platform/editions/`:

- `edition.types.ts`
- `edition.profiles.ts`
- `edition.registry.ts`
- `edition.validation.ts`
- `edition.utils.ts`
- `edition.current.ts`
- `index.ts`

The dependency flow is:

```text
Module Registry
  ↓
Module Activation Engine
  ↓
Edition Profile
  ↓
Edition-to-Activation Adapter
  ↓
Current Activation Result
  ↓
Sidebar / Command Center / future Dashboard
```

Consumers must depend on activation state, not Edition IDs.

## Edition ID Convention

Edition IDs are stable technical identifiers and must not use translated labels.

Current IDs:

- `alpha.crm-sales`
- `basic`
- `crm`
- `sales`
- `inventory`
- `purchasing`
- `hr`
- `enterprise`
- `custom`

Display names may change later without changing IDs.

## Edition Profile Model

An `EditionProfile` can describe:

- identity: `id`, `name`, `shortName`, `description`
- lifecycle: `status`, `version`
- target audience
- enabled module IDs
- disabled module IDs
- preview, planned, hidden and deprecated module policies
- dependency strictness
- runtime default metadata
- commercial metadata
- ordering and tags
- future license key and plan code placeholders
- future metadata-only feature overrides

Profiles intentionally do not store:

- React components
- UI callbacks
- Prisma clients
- service instances
- billing logic
- tenant records
- route components

## Edition Statuses

Supported statuses:

- `active`
- `alpha`
- `preview`
- `planned`
- `deprecated`
- `internal`

Only `active` or `alpha` profiles may become the current runtime default.

Planned Editions are metadata only and cannot become the default Alpha runtime profile.

## Current Alpha Edition

The current runtime default is:

- ID: `alpha.crm-sales`
- Name: `BOSIACO Alpha CRM & Sales`
- Status: `alpha`

It enables exactly the current visible Alpha product:

- `core.dashboard`
- `core.settings`
- `crm.overview`
- `crm.companies`
- `crm.contacts`
- `crm.meetings`
- `crm.tasks`
- `crm.notes`
- `sales.quotes`
- `sales.invoices`
- `sales.payments`

The Module Activation Engine automatically enables:

- `platform.persistence`

It does not activate:

- `crm.opportunities`
- `sales.products`
- `inventory.stock`
- `purchasing.orders`
- `purchasing.suppliers`
- `finance.cash`
- `finance.reports`
- `hr.employees`
- `platform.notifications`
- `platform.audit`
- `ai.assistant`

## Future Edition Metadata

SPR-403 defines future profiles safely:

- `basic`: dashboard, settings, companies, contacts
- `crm`: CRM overview, companies, contacts, meetings, tasks, notes
- `sales`: CRM foundation plus quotes, invoices and payments
- `inventory`: planned product/stock metadata only
- `purchasing`: planned supplier/purchasing metadata only
- `hr`: planned HR metadata only
- `enterprise`: future all-stable-modules profile
- `custom`: internal foundation for future declarative selections

Future profiles are not exposed to users and are not selectable at runtime.

## Edition Registry

`EditionProfileRegistry` supports:

- register Edition profile
- get Edition by ID
- list Editions
- list Editions by status
- list commercial Editions
- get default Edition
- validate profiles
- deterministic ordering

Registration is explicit. The registry does not scan files automatically.

## Validation Rules

Validation detects:

- duplicate Edition IDs
- empty Edition names
- duplicate module IDs inside a profile
- the same module both enabled and disabled
- unknown module IDs
- hidden module references without allowance
- planned module references without allowance
- invalid default profile status
- multiple runtime defaults
- activation engine errors
- blocked required dependencies

Edition validation uses the Module Activation Engine. It does not duplicate dependency resolution.

## Edition-to-Activation Adapter

`editionToActivationRequest(profile)` maps an Edition profile into a `ModuleActivationRequest`:

- `enabledModuleIds`
- `disabledModuleIds`
- `includeDefaults`
- `strictDependencies`
- `allowPreview`
- `allowPlanned`
- `allowHidden`
- `allowDeprecated`

The Module Activation Engine remains authoritative.

## Current Edition Source

`edition.current.ts` provides:

- `currentEditionProfile`
- `getCurrentEditionProfile()`
- `getCurrentEditionActivationRequest()`
- `getCurrentEditionActivationResult()`

The previous Alpha activation compatibility export now derives from the Edition profile instead of maintaining a second Alpha module list.

## Custom Edition Foundation

`createCustomEditionProfile()` prepares a future custom Edition builder path.

It:

- accepts declarative module selections
- returns serializable metadata
- validates through the same Edition and Activation rules
- does not persist
- does not license modules
- does not add tenant-specific behavior
- does not expose UI

## Sidebar and Command Center Compatibility

Sidebar and Command Center remain activation consumers.

They do not check Edition IDs.

Correct flow:

```text
Edition Profile
  ↓
Module Activation Engine
  ↓
Sidebar / Command Center
```

The visible product remains unchanged.

## Import Safety

The Edition layer is client-safe and metadata-only.

It does not import:

- Prisma
- server repositories
- CRM/Sales UI pages
- persistence clients
- authentication
- permissions
- billing
- React components

The Module Registry and Activation Engine do not import Edition profiles.

## Validation

Runtime validation now covers:

- default Alpha Edition resolves expected modules
- only one runtime default exists
- Basic, CRM, Sales and Enterprise exist as safe future metadata
- Inventory, Purchasing and HR remain planned metadata
- duplicate Edition IDs are rejected
- unknown module IDs are reported
- contradictory module selections are reported
- disabled required dependencies are reported through activation validation
- Edition adapter output is deterministic
- current Edition activation matches the SPR-402 activation result
- Custom Edition helper produces valid metadata

Latest SPR-403 result:

- `npm run validate:runtime`: passed, 86/86 checks

## Limitations

- No Edition selector UI.
- No licensing.
- No billing.
- No tenant Edition assignment.
- No admin Edition builder.
- No route gating by Edition yet.
- No feature flag engine.
- No dashboard composition by Edition yet.

## Next Sprint Expectations

Future sprints can now add:

- dynamic Edition selection
- tenant Edition assignment
- licensing-aware activation
- route gating through activation state
- dynamic dashboard composition
- Edition-aware onboarding
- a future Edition Builder
