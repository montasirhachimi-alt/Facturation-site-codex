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

export const HR_DOCUMENT_STATUS_LABELS = {
  missing: "Manquant",
  generated: "Généré",
  awaiting_signature: "En attente de signature",
  signed: "Signé / final",
  uploaded: "Téléversé",
  expired: "Expiré",
  archived: "Archivé"
} as const;

export const HR_DOCUMENT_SOURCE_LABELS = {
  manual: "Manuel",
  generated: "Généré",
  uploaded: "Téléversé"
} as const;

export const HR_DOCUMENT_CATEGORY_OPTIONS = [
  "Contrat de travail",
  "Fiche de poste",
  "Identité",
  "RIB",
  "Diplôme",
  "Confidentialité",
  "Règlement intérieur",
  "Attestation",
  "Document signé",
  "Justificatif",
  "Autre"
] as const;

export const HR_TEMPLATE_VARIABLES = [
  "employee.firstName",
  "employee.lastName",
  "employee.displayName",
  "employee.employeeNumber",
  "employee.email",
  "employee.phone",
  "employee.hireDate",
  "department.name",
  "position.name",
  "manager.displayName",
  "contract.type",
  "contract.startDate",
  "contract.endDate",
  "contract.title",
  "contract.workingTimeType",
  "company.name",
  "company.address",
  "company.email",
  "company.phone"
] as const;
