import type { HrWorkspaceId } from "./hr.types";

export const HR_WORKSPACE_ID = "hr-main" as HrWorkspaceId;
export const HR_DEFAULT_CURRENCY = "MAD";

export const HR_EMPLOYEE_STATUS_LABELS = {
  active: "Actif",
  inactive: "Inactif",
  on_leave: "En congé",
  terminated: "Sorti",
  archived: "Archivé"
} as const;

export const HR_CONTRACT_STATUS_LABELS = {
  active: "Actif",
  ended: "Terminé",
  cancelled: "Annulé",
  archived: "Archivé"
} as const;

export const HR_CONTRACT_TYPE_LABELS = {
  permanent: "CDI",
  fixed_term: "CDD",
  internship: "Stage",
  temporary: "Temporaire",
  freelance: "Freelance",
  other: "Autre"
} as const;

export const HR_WORKING_TIME_TYPE_LABELS = {
  full_time: "Temps plein",
  part_time: "Temps partiel",
  other: "Autre"
} as const;

export const HR_LEAVE_REQUEST_STATUS_LABELS = {
  draft: "Brouillon",
  requested: "Demandé",
  approved: "Approuvé",
  rejected: "Refusé",
  cancelled: "Annulé",
  archived: "Archivé"
} as const;

export const HR_ATTENDANCE_STATUS_LABELS = {
  present: "Présent",
  absent: "Absent",
  leave: "En congé",
  remote: "Télétravail",
  partial: "Partiel",
  other: "Autre"
} as const;

export const HR_WORKFORCE_STATE_LABELS = {
  ...HR_ATTENDANCE_STATUS_LABELS,
  not_recorded: "Non renseigné"
} as const;

export const HR_ABSENCE_SOURCE_LABELS = {
  manual: "Absence manuelle",
  leave: "Congé approuvé"
} as const;
