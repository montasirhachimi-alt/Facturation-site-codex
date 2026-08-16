import { NextResponse } from "next/server";
import type { Shipment, ShipmentStatus } from "@/modules/sales/shipments";
import { loadShipmentSnapshot, persistShipment, updateShipmentStatus } from "@/server/persistence/shipment-repository";
import { requirePersistenceTenantScope } from "@/server/persistence/tenant-scope";

type ShipmentRequest =
  | { operation: "save"; payload: Shipment }
  | { operation: "status"; payload: { shipmentId: string; status: ShipmentStatus } };

export async function GET() {
  try {
    const scope = await requirePersistenceTenantScope();
    return NextResponse.json(await loadShipmentSnapshot(scope));
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const scope = await requirePersistenceTenantScope();
    const body = await request.json() as ShipmentRequest;

    if (body.operation === "save") {
      const record = await persistShipment(scope, body.payload);
      return NextResponse.json({ record, snapshot: await loadShipmentSnapshot(scope) });
    }

    if (body.operation === "status") {
      const record = await updateShipmentStatus(scope, body.payload.shipmentId, body.payload.status);
      return NextResponse.json({ record, snapshot: await loadShipmentSnapshot(scope) });
    }

    return NextResponse.json({ error: "Opération d'expédition invalide." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur d'expédition inconnue.";
}
