# SPR-333A — Fix CRM Contacts Navigation

## Summary

SPR-333A fixes the remaining Contacts sidebar issue after SPR-333. The CRM navigation entry for Contacts now behaves as a normal direct workspace item and resolves to `/crm/contacts`.

## Root Cause

The Contacts route had been changed to `/crm/contacts`, but the navigation metadata still classified Contacts as contextual. That old classification came from the earlier simplification phase where Contacts guided users through Sociétés.

## Fix

- Removed the contextual classification from Contacts.
- Applied the same cleanup to Activités, Réunions, Tâches and Notes so all independent CRM workspace entries are treated consistently.
- Kept helper text and contextual links inside workspace rows/details.
- Confirmed `/crm/contacts/page.tsx` renders the Contacts workspace directly.

## Route

| Navigation item | Route |
| --- | --- |
| Contacts | `/crm/contacts` |

## Validation

| Command | Result |
| --- | --- |
| `npm run typecheck` | Passed via local `tsc --noEmit` equivalent because `npm` is unavailable in this environment. |
| `npm run build` | Passed via local `next build` equivalent because `npm` is unavailable in this environment. |

## Known Warnings

- Existing `@next/next/no-img-element` warning remains in `src/components/pdf-preview.tsx`.
