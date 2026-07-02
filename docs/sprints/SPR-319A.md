# SPR-319A — Product Consistency & French Localization

## Summary

SPR-319A improves visible product consistency by standardizing key Sidebar, Topbar, CRM Home, Company Workspace and Contact Workspace labels in French.

This sprint does not add business features and does not change services, runtime, permissions, Prisma or APIs.

## Objective

Make HicoPilot feel more like a polished French-first commercial product by removing mixed English/French UI in the visible CRM experience and documenting official terminology.

## Files Created

| File | Purpose |
| --- | --- |
| `docs/08_LOCALIZATION_GUIDE.md` | Official French terminology and UI copy rules. |
| `docs/sprints/SPR-319A.md` | Sprint documentation. |

## Files Modified

- `docs/00_ENGINEERING_CHARTER.md`
- `docs/02_PROJECT_STATUS.md`
- `src/services/navigation/sidebar-adapter.ts`
- `src/components/topbar.tsx`
- `src/app/(erp)/dashboard/page.tsx`
- CRM Customers UI
- CRM Companies UI
- CRM Contacts UI
- CRM Meetings UI
- CRM Tasks UI
- CRM Notes UI
- CRM Home UI
- CRM navigation metadata

## Terminology Changes

Examples standardized:

- Dashboard → Tableau de bord
- Workspace → Espace de travail
- Companies → Sociétés
- Customers → Clients
- Owner → Responsable
- Status → Statut
- Updated → Mis à jour
- Meeting → Réunion
- Tasks → Tâches
- Coming soon → Bientôt disponible

## Architecture

No architecture changes were made.

The sprint only updates visible UI copy and documentation. Domain types, services, runtime, permissions and data foundations remain unchanged.

## Validation

Run:

```bash
npm run validate:runtime
npm run typecheck
npm run build
```

## Known Risks

- Some internal validation messages and technical metadata remain in English because they are not primary visible product UI.
- Full i18n is still not implemented; the guide is the current source of truth for manual French-first copy.

## Future Work

- Introduce full localization/i18n when the product reaches production readiness.
- Continue polishing legacy ERP module labels outside the CRM experience.
