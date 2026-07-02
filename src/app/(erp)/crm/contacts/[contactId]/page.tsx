import { ContactDetailsPage } from "@/modules/crm/contacts";

export default async function CrmContactDetailsRoute({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;
  return <ContactDetailsPage contactId={contactId} />;
}
