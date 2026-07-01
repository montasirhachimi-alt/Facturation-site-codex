import { CompanyDetailsPage } from "@/modules/crm/companies";

export default async function CrmCompanyDetailsRoute({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  return <CompanyDetailsPage companyId={companyId} />;
}
