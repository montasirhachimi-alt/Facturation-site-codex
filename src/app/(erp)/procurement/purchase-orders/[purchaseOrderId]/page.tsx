import { PurchaseOrderDetailsPage } from "@/modules/procurement/ui";

export default async function ProcurementPurchaseOrderDetailsRoute({
  params
}: {
  params: Promise<{ purchaseOrderId: string }>;
}) {
  const { purchaseOrderId } = await params;
  return <PurchaseOrderDetailsPage purchaseOrderId={purchaseOrderId} />;
}
