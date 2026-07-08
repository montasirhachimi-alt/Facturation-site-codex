# SPR-330A — Fix CRM Home Quick Actions Layout

## Summary

SPR-330A refines the CRM Home quick actions layout after product owner feedback on the SPR-330 grouped section. The sprint keeps the removal of floating plus buttons, preserves the grouped quick actions model and makes the section lighter, more balanced and more coherent with the rest of CRM Home.

No Runtime, Services, business logic, routes, Prisma, database, APIs, permissions, backend behavior, AI or workflows were changed.

## What Was Wrong After SPR-330

- The grouped section solved the floating plus issue, but the outer panel felt too visually heavy.
- The header and badge created more emphasis than the section needed.
- The quick actions looked slightly more like a block inserted between CRM sections than a natural action rail.

## What Changed In SPR-330A

- Kept quick actions grouped in one section.
- Lightened the section background, border and shadow.
- Reduced header visual weight and replaced the count badge with a calmer CRM label.
- Tightened the grid spacing.
- Made action cards more compact and aligned with surrounding CRM cards.
- Kept left icons, title, helper text and subtle arrow affordances.
- Preserved all existing routes and click behavior.

## Desktop Result

On desktop, quick actions read as a lighter five-column action rail that sits naturally between the CRM command strip and KPI cards.

## Mobile Result

On mobile, quick actions stack cleanly as compact rows with clear icons and text, without floating controls or oversized card height.

## Files Modified

- `docs/02_PROJECT_STATUS.md`
- `docs/sprints/SPR-330A.md`
- `src/modules/crm/home/crm-home-page.tsx`

## Validation

- `npm run typecheck` requested; passed through the local `tsc --noEmit` script equivalent because `npm` is unavailable in this environment.
- `npm run build` requested; passed through the local `next build` script equivalent because `npm` is unavailable in this environment.

## Known Warnings

- The existing `@next/next/no-img-element` warning in `src/components/pdf-preview.tsx` is expected to remain during build.
