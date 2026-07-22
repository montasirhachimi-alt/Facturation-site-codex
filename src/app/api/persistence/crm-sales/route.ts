import { NextResponse } from "next/server";
import {
  cancelSalesOrder,
  confirmSalesOrder,
  loadCrmSalesSnapshot,
  persistCrmSalesRecord,
  transitionQuoteStatus,
  type CrmSalesPersistenceResource
} from "@/server/persistence/crm-sales-repository";
import { requirePersistenceTenantScope } from "@/server/persistence/tenant-scope";
import type { SalesOrder } from "@/modules/sales/orders";
import type { QuoteStatus } from "@/modules/sales/quotes";

const resources = new Set<CrmSalesPersistenceResource>(["company", "customer", "contact", "meeting", "task", "note", "quote", "salesOrder", "invoice", "payment"]);
const route = "/api/persistence/crm-sales";

export async function GET() {
  try {
    const scope = await requirePersistenceTenantScope();
    const snapshot = await loadCrmSalesSnapshot(scope);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  let operation = "persistCrmSalesRecord";
  let entityType: string | undefined;

  try {
    const scope = await requirePersistenceTenantScope();
    const body = await request.json() as {
      operation?: "confirmSalesOrder" | "cancelSalesOrder" | "transitionQuoteStatus";
      payload?: { order?: SalesOrder; orderId?: string; quoteId?: string; status?: QuoteStatus; reserve?: boolean; warehouseId?: string; allowPartial?: boolean };
      resource?: CrmSalesPersistenceResource;
      record?: unknown;
    };
    operation = body.operation ?? "persistCrmSalesRecord";
    entityType = body.resource;

    if (body.operation === "confirmSalesOrder" && body.payload?.order) {
      entityType = "salesOrder";
      const result = await confirmSalesOrder(scope, body.payload.order, {
        reserve: body.payload.reserve,
        warehouseId: body.payload.warehouseId,
        allowPartial: body.payload.allowPartial
      });
      return NextResponse.json({ snapshot: result.crmSalesSnapshot, inventorySnapshot: result.inventorySnapshot });
    }
    if (body.operation === "cancelSalesOrder" && body.payload?.orderId) {
      entityType = "salesOrder";
      const result = await cancelSalesOrder(scope, body.payload.orderId);
      return NextResponse.json({ snapshot: result.crmSalesSnapshot, inventorySnapshot: result.inventorySnapshot });
    }
    if (body.operation === "transitionQuoteStatus" && body.payload?.quoteId && body.payload.status) {
      entityType = "quote";
      const record = await transitionQuoteStatus(scope, body.payload.quoteId, body.payload.status);
      const snapshot = await loadCrmSalesSnapshot(scope);
      return NextResponse.json({ record, snapshot });
    }
    if (!body.resource || !resources.has(body.resource) || !body.record) {
      return NextResponse.json({ error: "Payload de persistance invalide." }, { status: 400 });
    }

    const record = await persistCrmSalesRecord(scope, body.resource, body.record);
    return NextResponse.json({ record });
  } catch (error) {
    logPersistenceError({ operation, entityType, error });
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur de persistance inconnue.";
}

function logPersistenceError({ operation, entityType, error }: { operation: string; entityType?: string; error: unknown }) {
  console.error("[crm-sales:persistence-error]", {
    operation,
    route,
    entityType: entityType ?? "unknown",
    errorName: getErrorName(error),
    errorMessage: getSafeErrorMessage(error),
    prismaCode: getPrismaErrorCode(error),
    stack: getErrorStack(error)
  });
}

function getErrorName(error: unknown) {
  return error instanceof Error ? error.name : typeof error;
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Unknown persistence error.";
}

function getPrismaErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function getErrorStack(error: unknown) {
  return error instanceof Error ? error.stack : undefined;
}
