import { NextResponse } from "next/server";
import { applySupplierImport, deleteDraftPurchaseOrder, loadProcurementSnapshot, persistProcurementRecord, postGoodsReceipt, type ProcurementPersistenceResource } from "@/server/persistence/procurement-repository";
import { requirePersistenceTenantScope } from "@/server/persistence/tenant-scope";
import type { GoodsReceipt, PurchaseOrderId, SupplierImportRequest } from "@/modules/procurement";

const resources = new Set<ProcurementPersistenceResource>(["supplier", "purchaseOrder", "goodsReceipt", "supplierBill", "supplierPayment"]);

export async function GET() {
  try {
    const scope = await requirePersistenceTenantScope();
    const snapshot = await loadProcurementSnapshot(scope);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const scope = await requirePersistenceTenantScope();
    const body = await request.json() as { operation?: "deleteDraftPurchaseOrder" | "importSuppliers" | "postGoodsReceipt"; payload?: PurchaseOrderId | SupplierImportRequest | GoodsReceipt; resource?: ProcurementPersistenceResource; record?: unknown };
    if (body.operation === "importSuppliers" && body.payload) {
      const result = await applySupplierImport(scope, body.payload as SupplierImportRequest);
      const snapshot = await loadProcurementSnapshot(scope);
      return NextResponse.json({ result, snapshot });
    }
    if (body.operation === "postGoodsReceipt" && body.payload) {
      const result = await postGoodsReceipt(scope, body.payload as GoodsReceipt);
      return NextResponse.json({ snapshot: result.procurementSnapshot, inventorySnapshot: result.inventorySnapshot });
    }
    if (body.operation === "deleteDraftPurchaseOrder" && body.payload) {
      const snapshot = await deleteDraftPurchaseOrder(scope, body.payload as PurchaseOrderId);
      return NextResponse.json({ snapshot });
    }
    if (!body.resource || !resources.has(body.resource) || !body.record) {
      return NextResponse.json({ error: "Payload achats invalide." }, { status: 400 });
    }

    const record = await persistProcurementRecord(scope, body.resource, body.record);
    const snapshot = await loadProcurementSnapshot(scope);
    return NextResponse.json({ record, snapshot });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur achats inconnue.";
}
