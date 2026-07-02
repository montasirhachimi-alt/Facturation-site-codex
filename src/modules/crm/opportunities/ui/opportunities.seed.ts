import type { CompanyId, UserId } from "../../companies/company.types";
import { CRM_COMPANIES_USER_ID, CRM_COMPANIES_WORKSPACE_ID } from "../../companies/ui/companies.seed";
import type { ContactId } from "../../contacts/contact.types";
import type { Opportunity, OpportunityId } from "../opportunity.types";

export const CRM_OPPORTUNITIES_WORKSPACE_ID = CRM_COMPANIES_WORKSPACE_ID;
export const CRM_OPPORTUNITIES_USER_ID = CRM_COMPANIES_USER_ID as UserId;

export const crmOpportunitySeed = Object.freeze([
  {
    id: "opportunity-alhikma-renewal" as OpportunityId,
    workspaceId: CRM_OPPORTUNITIES_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    primaryContactId: "contact-sara-amrani" as ContactId,
    title: "Renouvellement équipements réseau",
    description: "Projet de renouvellement réseau et support annuel.",
    stage: "proposal",
    probability: 65,
    estimatedValue: Object.freeze({ amount: 145000, currency: "MAD" }),
    expectedCloseDate: "2026-07-25T00:00:00.000Z",
    ownerId: CRM_OPPORTUNITIES_USER_ID,
    status: "open",
    priority: "high",
    tags: Object.freeze(["education", "proposal"]),
    createdAt: "2026-06-24T09:00:00.000Z",
    updatedAt: "2026-07-02T10:10:00.000Z"
  },
  {
    id: "opportunity-alhikma-crm" as OpportunityId,
    workspaceId: CRM_OPPORTUNITIES_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    primaryContactId: "contact-youssef-hakimi" as ContactId,
    title: "Déploiement CRM interne",
    description: "Accompagnement de l'équipe IT sur un workflow de relation client.",
    stage: "qualified",
    probability: 45,
    estimatedValue: Object.freeze({ amount: 82000, currency: "MAD" }),
    expectedCloseDate: "2026-08-10T00:00:00.000Z",
    ownerId: CRM_OPPORTUNITIES_USER_ID,
    status: "open",
    priority: "medium",
    tags: Object.freeze(["crm", "technical"]),
    createdAt: "2026-06-29T11:30:00.000Z",
    updatedAt: "2026-07-01T16:00:00.000Z"
  },
  {
    id: "opportunity-ibnsina-admin" as OpportunityId,
    workspaceId: CRM_OPPORTUNITIES_WORKSPACE_ID,
    companyId: "company-ibn-sina" as CompanyId,
    primaryContactId: "contact-nadia-bennani" as ContactId,
    title: "Pack administratif éducation",
    description: "Préparer une offre documentaire et facturation.",
    stage: "lead",
    probability: 25,
    estimatedValue: Object.freeze({ amount: 48000, currency: "MAD" }),
    expectedCloseDate: "2026-08-20T00:00:00.000Z",
    ownerId: CRM_OPPORTUNITIES_USER_ID,
    status: "open",
    priority: "medium",
    tags: Object.freeze(["education", "documents"]),
    createdAt: "2026-06-30T14:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z"
  },
  {
    id: "opportunity-atlas-support" as OpportunityId,
    workspaceId: CRM_OPPORTUNITIES_WORKSPACE_ID,
    companyId: "company-atlas" as CompanyId,
    primaryContactId: "contact-mehdi-atlas" as ContactId,
    title: "Contrat support opérations",
    description: "Support opérationnel et maintenance trimestrielle.",
    stage: "negotiation",
    probability: 72,
    estimatedValue: Object.freeze({ amount: 96000, currency: "MAD" }),
    expectedCloseDate: "2026-07-18T00:00:00.000Z",
    ownerId: CRM_OPPORTUNITIES_USER_ID,
    status: "open",
    priority: "urgent",
    tags: Object.freeze(["operations", "support"]),
    createdAt: "2026-06-20T13:00:00.000Z",
    updatedAt: "2026-07-02T08:45:00.000Z"
  }
] satisfies readonly Opportunity[]);
