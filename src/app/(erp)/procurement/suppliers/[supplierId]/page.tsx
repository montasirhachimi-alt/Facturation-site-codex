import { SupplierDetailsPage } from "@/modules/procurement/ui";

export default async function ProcurementSupplierDetailsRoute({
  params
}: {
  params: Promise<{ supplierId: string }>;
}) {
  const { supplierId } = await params;
  return <SupplierDetailsPage supplierId={supplierId} />;
}
