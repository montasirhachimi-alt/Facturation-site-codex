# SPR-330C — Improve KPI Card Vertical Rhythm

## Summary

SPR-330C refines the shared `MetricCard` vertical rhythm after SPR-330B normalized KPI icon treatment. The sprint keeps the KPI card design, colors, data and routes unchanged while making the KPI value breathe more clearly beneath the title and away from the icon area.

No Runtime, Services, business logic, routes, Prisma, database, APIs, permissions, backend behavior, AI or workflows were changed.

## What Changed

- Increased the spacing between KPI title and KPI value.
- Increased the horizontal gap between KPI content and the icon tile.
- Added slightly more right padding to the text block so values do not visually compete with the icon.
- Reduced the shared icon tile from `size-11` to `size-10`.
- Reduced the icon from `18px` to `17px`.
- Preserved the blue top accent line and existing color language.

## Affected Cards Verified

- `Chiffre d'affaires`
- `Reste à encaisser`
- `Marge brute`
- `Pipeline actif`

The same shared rhythm also applies to CRM and Sales KPI cards that consume `MetricCard`.

## Desktop Result

On desktop, the KPI values have more breathing room and remain the strongest visual element. The icon tile now supports the card without competing with the number.

## Mobile Result

On mobile, the smaller icon tile and increased content gap reduce visual crowding while preserving the existing responsive card layout.

## Files Modified

- `docs/02_PROJECT_STATUS.md`
- `docs/sprints/SPR-330C.md`
- `src/ui/cards/metric-card.tsx`

## Validation

- `npm run typecheck` requested; passed through the local `tsc --noEmit` script equivalent because `npm` is unavailable in this environment.
- `npm run build` requested; passed through the local `next build` script equivalent because `npm` is unavailable in this environment.

## Known Warnings

- The existing `@next/next/no-img-element` warning in `src/components/pdf-preview.tsx` is expected to remain during build.
