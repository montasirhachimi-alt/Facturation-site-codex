# SPR-441B — HR Modal Error Feedback Hardening

## Summary

SPR-441B is a focused UX hardening pass for the SPR-441 / SPR-441A HR Operations workflow.

No new capability sprint was started. No HR business rule, Prisma schema, persistence architecture, authentication, permission or module activation redesign was introduced.

## Authenticated QA Defect

Authenticated Manual QA found that an attendance save rejected by the HR consistency rule did not show the error where the user attempted the action.

Scenario:

- Workspace: `RH -> Présences`
- Employee: `Youssef Alami`
- Date: `25/08/2026`
- Attendance status attempted: `Présent`
- Existing approved leave: `24/08/2026 -> 28/08/2026`

The backend/business rule correctly rejected the save with:

```text
Un congé approuvé existe pour cette date. Utilisez le statut En congé ou résolvez le congé.
```

However, the attendance modal stayed open without a visible modal-level error. The parent page notice became visible only after closing the modal, which made the user perceive that nothing happened.

## Fix

The RH workspace now uses dialog-scoped error state for modal submit failures.

For attendance creation/update behavior:

- failed saves keep the modal open;
- the backend/business error is passed into the existing `EntityDialog` inline alert;
- entered values are preserved so the user can change `Présent` to `En congé`;
- the submit loading state resets after failure;
- the same error is not duplicated in the parent page notice while the modal is open;
- successful saves still close the modal and show the existing success feedback.

The same RH modal submit pattern was applied consistently to the adjacent HR dialogs that already used the same parent-notice-only failure path:

- employee;
- department;
- position;
- contract;
- leave request;
- annual leave entitlement;
- manual absence;
- attendance.

Leave decision actions remain inline table actions rather than modal form submissions, so they continue to use the parent page notice.

## Reuse Decision

`EntityDialog` already supported an inline `error` prop with a visible alert. SPR-441B reuses that shared UI affordance instead of introducing a new modal component or redesigning the RH workspace.

No Architecture Decision Record was added because this is reuse of an existing product/UI pattern, not a new reusable product decision.

## Files Modified

- `src/modules/hr/ui/pages/hr-workspace-page.tsx`
- `scripts/validate-runtime.cjs`
- `docs/02_PROJECT_STATUS.md`
- `docs/sprints/SPR-441B.md`

## Runtime Validation

Runtime validation now covers the attendance dialog feedback path:

- rejected attendance save exposes the error through dialog state;
- rejected attendance save does not clear the entered attendance form values;
- rejected attendance save resets the loading/submitting state;
- successful attendance save still closes the modal and shows the existing success notice;
- existing server-side consistency rules remain unchanged.

## Authenticated Manual E2E QA Closure

SPR-441B is manually verified as part of the SPR-441 authenticated QA closure.

Authenticated browser QA verified:

- workspace: `RH -> Présences`;
- employee: `EMP-0001` / `Youssef Alami`;
- date: `25/08/2026`;
- attempted status: `Présent`;
- approved leave period: `24/08/2026 -> 28/08/2026`.

After clicking `Enregistrer la présence`, the operation was correctly rejected and the attendance modal stayed open. The error appeared immediately inside the modal:

```text
Un congé approuvé existe pour cette date. Utilisez le statut En congé ou résolvez le congé.
```

The entered values were preserved, and the user could correct the status without closing or reopening the modal.

Corrective attendance QA then changed the status from `Présent` to `En congé` for Youssef Alami on `25/08/2026`. The save succeeded.

Verified result:

- success feedback: `Présence enregistrée.`;
- attendance row persisted: Youssef Alami, `25 août 2026`, `En congé`;
- leave balance remained `13.00` days;
- no second leave consumption occurred.

This confirms the full UX and business flow:

```text
Approved Leave
  -> contradictory Présent rejected
  -> modal shows the error immediately
  -> compatible En congé accepted
  -> no duplicate balance consumption
```

SPR-441B is therefore closed as modal error-feedback hardening.
