import type { CreateOpportunityInput, OpportunityStage, OpportunityStatus, OpportunityPriority, UpdateOpportunityInput } from "./opportunity.types";
import { OPPORTUNITY_PRIORITIES, OPPORTUNITY_STAGES, OPPORTUNITY_STATUSES } from "./opportunity.constants";

export type OpportunityValidationIssue = Readonly<{
  field: string;
  message: string;
}>;

export type OpportunityValidationResult = Readonly<{
  valid: boolean;
  issues: readonly OpportunityValidationIssue[];
}>;

export function validateCreateOpportunityInput(input: CreateOpportunityInput): OpportunityValidationResult {
  const issues: OpportunityValidationIssue[] = [];

  validateWorkspace(input.workspaceId, issues);
  validateCompany(input.companyId, issues);
  validateContact(input.primaryContactId, issues);
  validateTitle(input.title, issues);
  validateProbability(input.probability, issues);
  validateValue(input.estimatedValue?.amount, issues);
  validateStage(input.stage, issues);
  validateStatus(input.status, issues);
  validatePriority(input.priority, issues);
  validatePermission(input.permission, issues);

  if (!input.ownerId) {
    issues.push({ field: "ownerId", message: "Le propriétaire est requis." });
  }

  return createValidationResult(issues);
}

export function validateUpdateOpportunityInput(input: UpdateOpportunityInput): OpportunityValidationResult {
  const issues: OpportunityValidationIssue[] = [];

  if (!input.id) issues.push({ field: "id", message: "L'identifiant de l'opportunité est requis." });
  validateWorkspace(input.workspaceId, issues);
  if (input.companyId !== undefined) validateCompany(input.companyId, issues);
  if (input.primaryContactId !== undefined) validateContact(input.primaryContactId, issues);
  if (input.title !== undefined) validateTitle(input.title, issues);
  validateProbability(input.probability, issues);
  if (input.estimatedValue !== undefined) validateValue(input.estimatedValue.amount, issues);
  validateStage(input.stage, issues);
  validateStatus(input.status, issues);
  validatePriority(input.priority, issues);
  validatePermission(input.permission, issues);

  return createValidationResult(issues);
}

function validateWorkspace(value: unknown, issues: OpportunityValidationIssue[]) {
  if (!value) issues.push({ field: "workspaceId", message: "Le workspace est requis." });
}

function validateCompany(value: unknown, issues: OpportunityValidationIssue[]) {
  if (!value) issues.push({ field: "companyId", message: "La société est requise." });
}

function validateContact(value: unknown, issues: OpportunityValidationIssue[]) {
  if (!value) issues.push({ field: "primaryContactId", message: "Le contact principal est requis." });
}

function validateTitle(value: string | undefined, issues: OpportunityValidationIssue[]) {
  if (!value?.trim()) issues.push({ field: "title", message: "Le titre de l'opportunité est requis." });
}

function validateProbability(value: number | undefined, issues: OpportunityValidationIssue[]) {
  if (value === undefined) return;
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    issues.push({ field: "probability", message: "La probabilité doit être comprise entre 0 et 100." });
  }
}

function validateValue(value: number | undefined, issues: OpportunityValidationIssue[]) {
  if (!Number.isFinite(value) || Number(value) < 0) {
    issues.push({ field: "estimatedValue", message: "La valeur estimée doit être positive." });
  }
}

function validateStage(value: OpportunityStage | undefined, issues: OpportunityValidationIssue[]) {
  if (value !== undefined && !OPPORTUNITY_STAGES.includes(value)) {
    issues.push({ field: "stage", message: "Le stade de pipeline est invalide." });
  }
}

function validateStatus(value: OpportunityStatus | undefined, issues: OpportunityValidationIssue[]) {
  if (value !== undefined && !OPPORTUNITY_STATUSES.includes(value)) {
    issues.push({ field: "status", message: "Le statut est invalide." });
  }
}

function validatePriority(value: OpportunityPriority | undefined, issues: OpportunityValidationIssue[]) {
  if (value !== undefined && !OPPORTUNITY_PRIORITIES.includes(value)) {
    issues.push({ field: "priority", message: "La priorité est invalide." });
  }
}

function validatePermission(value: CreateOpportunityInput["permission"] | UpdateOpportunityInput["permission"], issues: OpportunityValidationIssue[]) {
  if (value && !value.allowed) {
    issues.push({ field: "permission", message: "Permission refusée pour cette opportunité." });
  }
}

function createValidationResult(issues: OpportunityValidationIssue[]): OpportunityValidationResult {
  return Object.freeze({
    valid: issues.length === 0,
    issues: Object.freeze([...issues])
  });
}
