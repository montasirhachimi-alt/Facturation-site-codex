import { QuoteDetailsWorkspace } from "@/modules/sales/quotes/ui";

export default async function SalesQuoteDetailsPage({ params }: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await params;
  return <QuoteDetailsWorkspace quoteId={quoteId} />;
}
