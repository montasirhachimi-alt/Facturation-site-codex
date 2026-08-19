# SPR-441A — Attendance / Absence Consistency Hardening

## Summary

SPR-441A hardens the SPR-441 HR Operations consistency model after authenticated Manual QA found that the same employee/date could be recorded as both manually absent and present.

No new HR capability sprint was started. No payroll, scheduling, time-clock, biometric, GPS, CNSS, IR or Moroccan payroll behavior was introduced.

## Authenticated QA Defect

Authenticated Manual QA found this contradictory state:

- Employee: `EMP-0001` / `Youssef Alami`
- Manual absence: `20/08/2026 -> 20/08/2026`
- Type: `Absence`
- Justified: `No`
- Attendance: `20/08/2026`
- Status: `Présent`

The UI could display `Présent` while the manual absence for the same employee/date still existed.

This violated the SPR-441 operational daily-state model because one employee could be both absent and present for the same calendar day.

## Repository Reconciliation

SPR-441 already enforced:

- one attendance record per employee/date;
- approved leave prevents `present` attendance;
- approved leave can drive workforce state;
- manual absences are canonical `HrAbsence` records;
- attendance records are canonical `HrAttendanceRecord` records.

The defect existed because manual absences were not checked by attendance creation/update, and attendance was checked before absence in workforce-state derivation.

Read-only inspection of the configured database for the reported `EMP-0001` / `20/08/2026` contradiction could not complete from this environment because the configured Supabase pooler was unreachable. No data was deleted or mutated.

## Canonical Consistency Rule

For a manual absence covering date `D`, the only attendance status compatible with that same employee/date is:

```text
absent
```

These statuses are incompatible with a manual absence on the same date:

```text
present
remote
partial
other
leave
```

`leave` remains reserved for approved leave visibility, not manual absence.

## Bidirectional Enforcement

SPR-441A enforces the rule in both directions:

- manual absence first, then incompatible attendance: rejected;
- incompatible attendance first, then overlapping manual absence: rejected;
- multi-day manual absences inspect every covered calendar day;
- non-conflicting dates remain accepted;
- `absent` attendance remains compatible with a manual absence.

The invariant is enforced in both:

- `HrService`, for deterministic local/session behavior;
- `hr-repository`, for server-side persistence authority.

## Today-State Fix

Workforce-state derivation now prioritizes approved leave and manual absence before attendance records.

This prevents already-existing contradictory local data from displaying `Présent` when a manual absence covers the same date.

A valid attendance record for the current business date still drives the employee operational state when no approved leave or manual absence applies.

## Files Modified

- `src/modules/hr/hr.service.ts`
- `src/server/persistence/hr-repository.ts`
- `scripts/validate-runtime.cjs`
- `docs/02_PROJECT_STATUS.md`
- `docs/03_DECISIONS_LOG.md`
- `docs/sprints/SPR-441A.md`

## Migration

No Prisma schema change and no migration were required.

SPR-441A does not delete or repair existing contradictory QA data. If the local database still contains the reported contradiction, the safe manual cleanup is to resolve one side explicitly after validating the record ids:

```text
Either remove/update the contradictory attendance `present` record,
or remove/update the manual absence,
but do not silently mutate both.
```

## Runtime Validation

Runtime validation now covers:

- manual absence then `present` attendance is rejected;
- manual absence then `remote` attendance is rejected;
- manual absence then `absent` attendance is accepted;
- `present` attendance then overlapping manual absence is rejected;
- multi-day manual absence conflict detection;
- non-conflicting absence dates are accepted;
- approved leave then `present` attendance remains rejected;
- one employee/date attendance invariant remains enforced;
- contradictory legacy data resolves workforce state as `absent`;
- valid attendance for the business date still resolves workforce state correctly;
- repository/server-side consistency guard presence.

## Authenticated Manual E2E QA Closure

SPR-441A is manually verified as part of the SPR-441 authenticated QA closure.

Verified defect history:

- Tenant: `company-hicotech`
- Employee: `EMP-0001` / `Youssef Alami`
- Manual absence: `20/08/2026 -> 20/08/2026`
- Type: `Absence`
- Source: `Manuelle`
- Justified: `Non`
- Legacy attendance: `20/08/2026`, status `Présent`

The legacy contradictory attendance record was created before SPR-441A. It remains in the database as pre-hardening QA evidence and was not silently deleted or rewritten during closure.

Authenticated browser QA after the hardening confirmed that another attendance attempt for `20/08/2026` was rejected because an attendance record already existed for that employee/date. This confirms the one employee/date invariant in the current UI flow, while the runtime validation covers the post-hardening creation rules directly:

- manual absence then `present` attendance is rejected;
- `present` attendance then overlapping manual absence is rejected;
- approved leave then `present` attendance is rejected;
- multi-day absence conflict detection is enforced;
- tenant isolation remains wired through persistence;
- one attendance record per employee/date remains enforced.

Authenticated browser QA also verified the approved-leave consistency rule by attempting to save `Présent` for Youssef Alami on `25/08/2026`, inside the approved leave period `24/08/2026 -> 28/08/2026`. The operation was rejected with:

```text
Un congé approuvé existe pour cette date. Utilisez le statut En congé ou résolvez le congé.
```

SPR-441A is therefore closed as corrective hardening. The old `20/08/2026` contradiction must be treated only as legacy QA data that motivated the hardening, not as current valid behavior.
