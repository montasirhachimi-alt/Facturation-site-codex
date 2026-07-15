# SPR-413E — Quote Lifecycle Actions & Conversion Readiness

## Executive Summary

SPR-413E makes the existing Quote lifecycle actionable without introducing a new status model or a new Sales workflow.

Quotes still start as `draft`. Users can now move a Quote through the minimal validated lifecycle:

```text
Brouillon -> Envoye -> Accepte / Refuse
```

Sales Order conversion remains available only for accepted Quotes and is now protected on both the UI and persistence boundaries.

## Scope

Implemented:

- Quote detail lifecycle actions.
- Persistent Quote status transition operation.
- Server-side transition validation through the Commercial Documents lifecycle.
- Server-side Sales Order conversion guard requiring an accepted source Quote.
- Runtime validation coverage for lifecycle and conversion readiness.

Not implemented:

- Email sending.
- Electronic signature.
- Approval workflow.
- Delivery Notes.
- Physical stock `ISSUE`.
- Returns.
- Accounting.
- Manufacturing.
- POS.
- AI.
- Kanban.

## Lifecycle Rules

The Sprint reuses `src/platform/commercial-documents/document.lifecycle.ts` as the canonical lifecycle authority.

Allowed V1 transitions:

| From | To | Purpose |
| --- | --- | --- |
| `draft` | `sent` | The Quote has been sent to the customer. |
| `sent` | `accepted` | The Quote is ready for Sales Order or Invoice conversion. |
| `sent` | `refused` | The Quote is closed as refused. |

Direct `draft -> accepted` is intentionally rejected.

Accepted and refused Quotes are terminal for this V1 workflow.

## UI Behavior

Quote details now show contextual lifecycle actions based on current status:

- Draft: `Marquer comme envoye`.
- Sent: `Marquer comme accepte`, `Marquer comme refuse`.
- Accepted: `Creer une commande client` when the controlled Sales Orders profile is active.

The Sales Order action remains hidden in normal Alpha because `sales.orders` is inactive by default.

Errors from persistence are shown in the Quote details page rather than failing silently.

## Persistence Behavior

The CRM/Sales persistence API now exposes a dedicated `transitionQuoteStatus` operation.

The repository validates:

- New Quotes must be created as `draft`.
- Status changes must follow the canonical lifecycle.
- Sales Orders with `sourceQuoteId` can only be persisted if the source Quote exists in the tenant scope and has status `accepted`.

No Prisma schema or migration change was required.

## Conversion Readiness

Quote-to-Sales-Order conversion remains the same commercial conversion path from SPR-413D, but its accessibility is now tied to the Quote lifecycle:

```text
Quote draft
  -> cannot create Sales Order

Quote sent
  -> cannot create Sales Order

Quote accepted
  -> can create Sales Order in controlled Sales Operations profile
```

## Validation

Runtime validation now checks:

- Quote lifecycle allows `draft -> sent`.
- Quote lifecycle allows `sent -> accepted`.
- Quote lifecycle allows `sent -> refused`.
- Quote lifecycle rejects `draft -> accepted`.
- Quote service enforces canonical transitions.
- Quote details exposes lifecycle actions.
- Sales Order conversion remains accepted-only.
- Persistence validates transitions and source Quote acceptance.

## Known Limitations

- Quote edit remains outside this Sprint because there is no stable Quote edit workflow to expose without creating a second dialog path.
- Sending a Quote is a status transition only; no email is sent.
- Acceptance/refusal is manual; no customer portal or signature workflow exists yet.
- Sales Orders remain controlled-profile only and inactive in normal Alpha.

## Confirmation

SPR-413E did not introduce Delivery Notes, physical stock issue movements, accounting, manufacturing, POS, AI, Kanban, Prisma schema changes, permissions changes or authentication changes.
