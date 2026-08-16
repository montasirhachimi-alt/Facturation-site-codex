import { ShipmentDetailsWorkspace } from "@/modules/sales/shipments/ui";

export default async function ShipmentDetailsRoute({ params }: { params: Promise<{ shipmentId: string }> }) {
  const { shipmentId } = await params;
  return <ShipmentDetailsWorkspace shipmentId={shipmentId} />;
}
