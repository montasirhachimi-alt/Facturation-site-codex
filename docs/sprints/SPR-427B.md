# SPR-427B — Product Catalog Create Persistence Fix

Date: 2026-08-16

## Executive Summary

SPR-427B hardens the Product Catalog create persistence path exposed during authenticated Sales Operations QA.

The Product Catalog API no longer lets known product persistence failures fall through as opaque `500` responses. Server-side persistence now validates the product payload, checks tenant-scoped SKU and barcode uniqueness before writing, rejects stale category IDs before Prisma foreign-key failure, maps Prisma unique and foreign-key errors to controlled French messages, and logs unexpected persistence failures safely on the server.

No Product Catalog redesign, Inventory behavior change, profile promotion, Prisma schema change, migration or Sales Operations activation change was made.

## Observed Failure

Browser QA reported:

- Product creation dialog opens normally.
- `GET /api/persistence/product-catalog` can return `200` once the session is ready.
- `POST /api/persistence/product-catalog` returns `500`.
- The failure persists with a unique SKU such as `SKU-TEST-160826-01`.

Therefore duplicate SKU was not assumed to be the only possible cause.

## Exact Local Reproduction Result

In this development environment, the API failed before the product insert:

```text
Invalid prisma.company.upsert() invocation
Error querying the database: FATAL: (ENOTFOUND) tenant/user ... not found
```

The failing operation was:

```text
POST /api/persistence/product-catalog
→ requirePersistenceTenantScope()
→ ensureTenantCompany()
→ prisma.company.upsert()
```

That local failure indicates a database connection/configuration problem in this environment, not a product payload issue. Because of it, authenticated create-through-browser QA could not be completed here.

## Product Persistence Defect Fixed

The Product Catalog POST path still had a real robustness defect:

- `persistProduct()` accepted the client product record and delegated most failures to Prisma.
- A stale/non-persisted `categoryId` could reach Prisma and fail as a foreign-key error.
- Duplicate SKU/barcode/reference conflicts could surface as raw Prisma errors if client state was stale.
- The API converted unexpected persistence failures into generic `500` behavior.
- The UI always replaced persistence failures with a misleading connection-oriented message.

SPR-427B fixes those defects at the persistence boundary.

## Server-Side Corrections

`src/server/persistence/product-catalog-repository.ts` now provides:

- `ProductCatalogPersistenceError` with safe `code` and HTTP `status`.
- product payload validation for required identity, price, VAT and reorder fields.
- tenant-scoped duplicate SKU checks before Prisma writes.
- tenant-scoped duplicate barcode checks before Prisma writes.
- required persisted category validation when a Product references `categoryId`.
- parent category existence validation for Product Categories.
- fallback Prisma `P2002` and `P2003` mapping.
- preserved tenant ownership checks.
- preserved unsafe stockable-to-service transition protection.

## API Error Handling

`src/app/api/persistence/product-catalog/route.ts` now:

- returns known domain errors with their intended HTTP status;
- returns controlled French messages to the browser;
- distinguishes unauthorized and missing tenant cases;
- logs unexpected server-side failures using `[product-catalog:persistence-error]`;
- avoids returning raw Prisma internals to the client.

## UI Error Handling

Product Catalog UI now displays the controlled server/domain message instead of always showing:

```text
Le produit n'a pas pu être enregistré dans la base. Vérifiez la connexion puis réessayez.
```

Examples:

- `Ce SKU existe déjà.`
- `Ce code-barres existe déjà.`
- `Cette catégorie produit n'existe plus. Actualisez le catalogue puis réessayez.`
- `Session expirée. Reconnectez-vous puis réessayez.`

## Tenant Safety

Tenant safety was preserved:

- Product writes still use `requirePersistenceTenantScope()`.
- Product records are written with `scope.companyId`.
- Existing Product and Product Category ownership is checked before update.
- Cross-tenant access is rejected with a controlled `403`.

## QA Result

Automated validation passed.

Local HTTP checks confirmed that raw Prisma errors are no longer exposed in API responses.

Authenticated product creation persistence could not be fully verified in this environment because the local database connection fails during tenant bootstrap before Product persistence:

```text
ensureTenantCompany() → prisma.company.upsert()
```

## Validation

| Command | Result |
| --- | --- |
| `npx prisma validate` | Passed. |
| `npx prisma generate` | Passed. |
| `npm run typecheck` | Passed. |
| `npm run validate:runtime` | Passed with 165/165 checks. |
| `npm run build` | Passed. Known `src/components/pdf-preview.tsx` `<img>` warning remains. |
| `git diff --check` | Passed. |

## Files Created

- `docs/sprints/SPR-427B.md`

## Files Modified

- `src/app/api/persistence/product-catalog/route.ts`
- `src/server/persistence/product-catalog-repository.ts`
- `src/platform/persistence/product-catalog-persistence.client.ts`
- `src/modules/products/ui/hooks/use-products-page.ts`
- `src/modules/products/ui/pages/product-details-page.tsx`
- `scripts/validate-runtime.cjs`
- `docs/02_PROJECT_STATUS.md`

## Remaining Limitations

- Full authenticated browser QA for creating a real stockable and service Product remains blocked in this environment by the local database connection error.
- Duplicate SKU QA through browser UI still needs to be repeated once the database connection is healthy.
- No migration or schema change was made.

## Final State

Product Catalog create persistence now has deterministic server-side guards and safe error handling.

Sales Operations remain gated.
