export type CrmErrorCode =
  | "validation_error"
  | "permission_denied"
  | "workspace_mismatch"
  | "entity_not_found"
  | "conflict"
  | "unknown_error";

export type CrmErrorSeverity = "info" | "warning" | "error";

export type CrmError = Readonly<{
  code: CrmErrorCode;
  message: string;
  severity: CrmErrorSeverity;
  field?: string;
  entityId?: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export function createCrmError(input: CrmError): CrmError {
  return Object.freeze({
    ...input,
    metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined
  });
}

export const crmErrors = Object.freeze({
  validation(message: string, field?: string) {
    return createCrmError({ code: "validation_error", message, field, severity: "error" });
  },
  permissionDenied(message = "CRM operation is not permitted.") {
    return createCrmError({ code: "permission_denied", message, severity: "error" });
  },
  workspaceMismatch(message = "CRM entity does not belong to the requested workspace.") {
    return createCrmError({ code: "workspace_mismatch", message, severity: "error" });
  },
  entityNotFound(message = "CRM entity was not found.", entityId?: string) {
    return createCrmError({ code: "entity_not_found", message, entityId, severity: "warning" });
  },
  conflict(message = "CRM entity conflict detected.", entityId?: string) {
    return createCrmError({ code: "conflict", message, entityId, severity: "warning" });
  }
});

