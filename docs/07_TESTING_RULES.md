# HicoPilot Testing Rules

## Validation Policy

Every sprint must preserve application behavior unless the sprint explicitly changes it.

## Required Checks

| Check | Command | Required |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | Yes |
| Production Build | `npm run build` | Yes |
| Runtime Architecture | `npm run validate:runtime` | Yes for runtime/platform sprints |

## Unit Tests

No dedicated unit test suite is currently configured. Future service and engine logic should receive unit tests as behavior becomes persistent and business-critical.

## Integration Tests

No dedicated integration test suite is currently configured. Runtime architecture validation is currently handled by `npm run validate:runtime`, which checks the Platform Event Runtime, Notification Event Subscriber, Activity Event Subscriber, Audit Event Subscriber, Permission Enforcement, Permission Runtime Integration, Capability Registry, Manifest System, Module Loader, Plugin Runtime, Preferences Runtime, Widget Runtime, Workspace Context and Platform Search separation.

## Future E2E Tests

Future end-to-end tests should cover:

- Authentication and logout.
- Sidebar navigation.
- Header search.
- Command palette.
- Dashboard loading.
- Workspace switching when UI exists.
- Business document workflows.

## Regression Policy

For every sprint, confirm:

- No unauthorized UI change.
- No route change.
- No database or Prisma change unless required.
- No permission regression.
- Existing build still passes.
- Runtime architecture validation passes when runtime, platform, context or service architecture is touched.

## Sprint Validation Checklist

- [ ] Read required docs.
- [ ] Inspect existing implementation.
- [ ] Identify protected areas.
- [ ] Implement minimal change.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `npm run validate:runtime` when touching runtime, platform, context or service architecture.
- [ ] Document files changed.
- [ ] Document known risks.

## Known Build Warning

`src/components/pdf-preview.tsx` currently uses `<img>`, which produces a Next.js image optimization warning during build. This is known and not related to platform documentation.
