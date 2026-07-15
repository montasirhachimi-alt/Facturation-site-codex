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
  try {
    const scope = await requirePersistenceTenantScope();
    const body = await request.json() as {
      operation?: "confirmSalesOrder" | "cancelSalesOrder" | "transitionQuoteStatus";
      payload?: { order?: SalesOrder; orderId?: string; quoteId?: string; status?: QuoteStatus; reserve?: boolean; warehouseId?: string; allowPartial?: boolean };
      resource?: CrmSalesPersistenceResource;
      record?: unknown;
    };
    if (body.operation === "confirmSalesOrder" && body.payload?.order) {
      const result = await confirmSalesOrder(scope, body.payload.order, {
        reserve: body.payload.reserve,
        warehouseId: body.payload.warehouseId,
        allowPartial: body.payload.allowPartial
      });
      return NextResponse.json({ snapshot: result.crmSalesSnapshot, inventorySnapshot: result.inventorySnapshot });
    }
    if (body.operation === "cancelSalesOrder" && body.payload?.orderId) {
      const result = await cancelSalesOrder(scope, body.payload.orderId);
      return NextResponse.json({ snapshot: result.crmSalesSnapshot, inventorySnapshot: result.inventorySnapshot });
    }
    if (body.operation === "transitionQuoteStatus" && body.payload?.quoteId && body.payload.status) {
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
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur de persistance inconnue.";
}
