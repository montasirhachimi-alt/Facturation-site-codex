import type { CrmCommandType, CrmEntityType } from "./crm-types";

export type CrmCommand<TPayload extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>> = Readonly<{
  id: string;
  type: CrmCommandType;
  entityType: CrmEntityType;
  workspaceId: string;
  actorId: string;
  payload: TPayload;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type CreateCustomerCommand = CrmCommand<Readonly<{ displayName: string; companyName?: string; email?: string; phone?: string }>>;
export type UpdateCustomerCommand = CrmCommand<Readonly<{ customerId: string; displayName?: string; companyName?: string; email?: string; phone?: string }>>;
export type ArchiveCustomerCommand = CrmCommand<Readonly<{ customerId: string }>>;

export function createCrmCommand<TPayload extends Readonly<Record<string, unknown>>>(command: CrmCommand<TPayload>) {
  return Object.freeze({
    ...command,
    payload: Object.freeze({ ...command.payload }),
    metadata: command.metadata ? Object.freeze({ ...command.metadata }) : undefined
  });
}

