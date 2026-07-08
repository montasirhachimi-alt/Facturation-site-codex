# SPR-330B — Normalize KPI Card Icon Treatment

## Summary

SPR-330B normalizes KPI card icon treatment across the shared `MetricCard` component used by Dashboard, CRM and Sales KPI rows. The sprint fixes inconsistent perceived icon size, positioning and decorative background behavior while preserving all KPI data, routes and business behavior.

No Runtime, Services, business logic, routes, Prisma, database, APIs, permissions, backend behavior, AI or workflows were changed.

## Component Responsible

- `src/ui/cards/metric-card.tsx`

The inconsistency came from the shared metric card using a large pale decorative circle positioned outside the top-right card area, plus a larger icon tile. Depending on icon shape and surrounding KPI text, the treatment could make some icons feel cropped, hidden or visually heavier than others.

## What Changed

- Removed the oversized pale blue decorative circle from the metric card.
- Standardized the icon tile to a fixed small dark navy block.
- Standardized icon size and stroke weight.
- Kept the icon in the top-right with identical spacing and no overlap with KPI value text.
- Preserved the blue top accent line as part of the BOSIACO identity.
- Kept the KPI value as the strongest visual element.

## Shared Or Local

This is a shared fix in `MetricCard`, not a one-off Dashboard override. It affects every current KPI card using the shared component.

## Affected Cards Verified

- `Chiffre d'affaires`
- `Reste à encaisser`
- `Marge brute`
- `Pipeline actif`

The same treatment also applies to CRM Home KPI cards and Sales KPI cards that consume `MetricCard`.

## Desktop Result

On desktop, KPI icons now align consistently in the top-right corner with identical tile size, icon size and visual weight. The values remain dominant and no decorative shape competes with the numbers.

## Mobile Result

On mobile, the icon treatment remains compact and stable. Icons no longer risk touching or visually competing with long KPI values.

## Files Modified

- `docs/02_PROJECT_STATUS.md`
- `docs/sprints/SPR-330B.md`
- `src/ui/cards/metric-card.tsx`

## Validation

- `npm run typecheck` requested; passed through the local `tsc --noEmit` script equivalent because `npm` is unavailable in this environment.
- `npm run build` requested; passed through the local `next build` script equivalent because `npm` is unavailable in this environment.

## Known Warnings

- The existing `@next/next/no-img-element` warning in `src/components/pdf-preview.tsx` is expected to remain during build.
