import type { CompanyId } from "@/modules/crm/companies";
import type { ContactId } from "@/modules/crm/contacts";
import type { OpportunityId } from "@/modules/crm/opportunities";
import type { Quote, QuoteId, UserId, WorkspaceId } from "./quote.types";

export const SALES_QUOTES_WORKSPACE_ID = "workspace-hicopilot" as WorkspaceId;
export const SALES_QUOTES_USER_ID = "user-admin" as UserId;

export const quoteSeed: readonly Quote[] = Object.freeze([
  {
    id: "quote-dev-2026-041" as QuoteId,
    workspaceId: SALES_QUOTES_WORKSPACE_ID,
    number: "DEV-2026-041",
    customerName: "Al Hikma Clinic",
    companyId: "company-alhikma" as CompanyId,
    contactId: "contact-sara" as ContactId,
    opportunityId: "opportunity-alhikma-renewal" as OpportunityId,
    status: "sent",
    issueDate: "2026-07-01T09:00:00.000Z",
    expirationDate: "2026-07-31T09:00:00.000Z",
    currency: "MAD",
    discountRate: 5,
    ownerId: SALES_QUOTES_USER_ID,
    notes: "Inclure support premium et option renouvellement annuel.",
    items: [
      { id: "item-1", description: "Modernisation réseau", quantity: 1, unitPrice: 94000, taxRate: 20 },
      { id: "item-2", description: "Support prioritaire", quantity: 12, unitPrice: 2800, taxRate: 20 }
    ],
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z"
  },
  {
    id: "quote-dev-2026-039" as QuoteId,
    workspaceId: SALES_QUOTES_WORKSPACE_ID,
    number: "DEV-2026-039",
    customerName: "Ibn Sina Retail",
    companyId: "company-ibnsina" as CompanyId,
    contactId: "contact-youssef" as ContactId,
    opportunityId: "opportunity-ibnsina-admin" as OpportunityId,
    status: "draft",
    issueDate: "2026-06-28T11:00:00.000Z",
    expirationDate: "2026-07-28T11:00:00.000Z",
    currency: "MAD",
    discountRate: 0,
    ownerId: SALES_QUOTES_USER_ID,
    notes: "Version préliminaire avant validation technique.",
    items: [
      { id: "item-1", description: "Postes administratifs", quantity: 8, unitPrice: 7200, taxRate: 20 },
      { id: "item-2", description: "Installation et configuration", quantity: 1, unitPrice: 12500, taxRate: 20 }
    ],
    createdAt: "2026-06-28T11:00:00.000Z",
    updatedAt: "2026-06-30T15:30:00.000Z"
  },
  {
    id: "quote-dev-2026-036" as QuoteId,
    workspaceId: SALES_QUOTES_WORKSPACE_ID,
    number: "DEV-2026-036",
    customerName: "Atlas Hospitality",
    companyId: "company-atlas" as CompanyId,
    contactId: "contact-nadia" as ContactId,
    opportunityId: "opportunity-atlas-support" as OpportunityId,
    status: "accepted",
    issueDate: "2026-06-18T10:30:00.000Z",
    expirationDate: "2026-07-18T10:30:00.000Z",
    currency: "MAD",
    discountRate: 3,
    ownerId: SALES_QUOTES_USER_ID,
    notes: "Accepté verbalement, attente bon de commande.",
    items: [
      { id: "item-1", description: "Maintenance annuelle", quantity: 1, unitPrice: 78000, taxRate: 20 }
    ],
    createdAt: "2026-06-18T10:30:00.000Z",
    updatedAt: "2026-07-02T13:00:00.000Z"
  }
]);
