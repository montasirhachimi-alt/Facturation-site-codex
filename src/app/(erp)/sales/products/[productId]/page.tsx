import { ProductDetailsPage } from "@/modules/products/ui";

export default async function SalesProductDetailsRoute({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return <ProductDetailsPage productId={productId} />;
}
