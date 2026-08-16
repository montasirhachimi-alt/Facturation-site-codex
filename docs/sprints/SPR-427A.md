# SPR-427A — Edition Profile Hydration Consistency Fix

Date: 2026-08-15

## Executive Summary

SPR-427A fixes the hydration mismatch introduced by the safe internal Sales Operations profile switch.

The fix keeps the SPR-427 security model intact while making Edition activation deterministic between:

- server rendering;
- client hydration;
- Sidebar navigation;
- Command Center search;
- route availability;
- dashboard and activation consumers.

No Sales Operations promotion was made. Default Alpha remains `alpha.crm-sales`.

## Exact Root Cause

SPR-427 read the public environment variable through a dynamic key:

```ts
process.env[internalEditionProfileEnvName]
```

In Next.js client bundles, public environment variables are reliably inlined when accessed statically. Dynamic lookup can produce a different client-side value than the server-side value.

That created this failure mode when running:

```bash
NEXT_PUBLIC_BOSIACO_INTERNAL_EDITION_PROFILE=sales-operations npm run dev
```

- server render resolved `sales-operations`;
- client hydration could fall back to `alpha.crm-sales`;
- Sidebar and navigation links were rendered from different activation snapshots;
- React detected different HTML and reported a hydration mismatch.

The mismatch appeared in Sidebar `Link` output, but Sidebar was only the visible symptom.

## Server Profile Before Fix

When the internal environment variable was present, the server could resolve:

- profile: `sales-operations`;
- active modules included `sales.orders`, `sales.delivery-notes`, `sales.shipments`.

## Client Profile Before Fix

The client could fail to read the dynamically accessed `NEXT_PUBLIC` value and resolve:

- profile: `alpha.crm-sales`;
- active modules excluded `sales.orders`, `sales.delivery-notes`, `sales.shipments`.

## Fix

SPR-427A applies three focused corrections:

1. The Edition resolver now reads the public variable with static access:

```ts
process.env.NEXT_PUBLIC_BOSIACO_INTERNAL_EDITION_PROFILE
```

2. The ERP server layout resolves the effective activation request once and passes it into the client shell.

3. Sidebar and Command Center consumers read the hydrated `ModuleActivationProvider` context instead of independently recalculating the current profile during first client render.

## Hydration-Safe Flow

```text
Trusted environment configuration
        ↓
Edition Profile Resolver
        ↓
Server-resolved Activation Request
        ↓
ModuleActivationProvider
        ↓
Sidebar / Search / Command Center
```

## Preserved SPR-427 Security Rules

- `alpha.crm-sales` remains the default profile.
- `sales-operations` is still internal QA only.
- Override is allowed only in `development` and `test`.
- Production ignores the override.
- Only `alpha.crm-sales` and `sales-operations` are allow-listed.
- No URL parameter, cookie, localStorage or request header controls activation.

## Files Created

- `docs/sprints/SPR-427A.md`

## Files Modified

- `src/platform/editions/edition-profile.resolver.ts`
- `src/app/(erp)/layout.tsx`
- `src/components/erp-shell.tsx`
- `src/components/sidebar.tsx`
- `src/services/navigation/sidebar-adapter.ts`
- `src/platform/search/providers/universal-search-provider.tsx`
- `scripts/validate-runtime.cjs`
- `docs/02_PROJECT_STATUS.md`
- `docs/03_DECISIONS_LOG.md`

## Validation

| Command | Result |
| --- | --- |
| `npx prisma validate` | Passed. |
| `npx prisma generate` | Passed. |
| `npm run typecheck` | Passed. |
| `npm run validate:runtime` | Passed with 164/164 checks. |
| `npm run build` | Passed. Known `src/components/pdf-preview.tsx` `<img>` warning remains. |
| `git diff --check` | Passed. |

Clean runtime checks:

- `.next` deleted before default Alpha startup.
- `npm run dev` started successfully; port `3000` was occupied, so Next.js used `http://localhost:3001`.
- `/` returned `200`.
- `/sales/orders` redirected to `/` without a valid session, confirming the authentication boundary.
- server stopped cleanly.
- `.next` deleted again before internal Sales Operations startup.
- `NEXT_PUBLIC_BOSIACO_INTERNAL_EDITION_PROFILE=sales-operations npm run dev` started successfully.
- `/` returned `200`.
- `/sales/orders` redirected to `/` without a valid session, confirming the authentication boundary still applies under the internal profile.
- server stopped cleanly.

Authenticated browser visual QA could not be completed because the local authenticated QA credential remains unavailable.

## Remaining Limitations

SPR-427A does not complete authenticated Sales Operations E2E QA.

The QA blocker from SPR-427 remains: the repository still needs a documented local authenticated QA path before Sales Operations can be promoted to default Alpha.

## Final State

Edition activation is now deterministic and hydration-safe.

Sales Operations remain gated.
