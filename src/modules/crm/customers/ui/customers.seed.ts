import type { Customer, CustomerId, UserId, WorkspaceId } from "../customer.types";

export const CRM_CUSTOMERS_WORKSPACE_ID = "workspace-hicopilot" as WorkspaceId;
export const CRM_CUSTOMERS_USER_ID = "user-admin" as UserId;

export const crmCustomerSeed = Object.freeze([
  {
    id: "customer-al-hikma" as CustomerId,
    workspaceId: CRM_CUSTOMERS_WORKSPACE_ID,
    displayName: "Amina El Mansouri",
    companyName: "Ecole Al Hikma",
    email: "contact@alhikma.ma",
    phone: "0661 22 33 44",
    status: "active",
    type: "company",
    source: "manual",
    tags: Object.freeze(["education", "vip"]),
    notes: "Client historique avec plusieurs factures en cours.",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-28T11:20:00.000Z",
    createdBy: CRM_CUSTOMERS_USER_ID,
    updatedBy: CRM_CUSTOMERS_USER_ID
  },
  {
    id: "customer-ibn-sina" as CustomerId,
    workspaceId: CRM_CUSTOMERS_WORKSPACE_ID,
    displayName: "Youssef Bennani",
    companyName: "Lycee Ibn Sina",
    email: "administration@ibnsina.ma",
    phone: "0678 11 22 33",
    status: "lead",
    type: "company",
    source: "referral",
    tags: Object.freeze(["education", "devis"]),
    createdAt: "2026-06-04T10:15:00.000Z",
    updatedAt: "2026-06-27T16:40:00.000Z",
    createdBy: CRM_CUSTOMERS_USER_ID
  },
  {
    id: "customer-atlas" as CustomerId,
    workspaceId: CRM_CUSTOMERS_WORKSPACE_ID,
    displayName: "Karim Alaoui",
    companyName: "Entreprise Atlas",
    email: "achats@atlas.ma",
    phone: "0662 33 44 55",
    status: "active",
    type: "company",
    source: "campaign",
    tags: Object.freeze(["industrie", "relance"]),
    notes: "A relancer pour paiement et renouvellement materiel.",
    createdAt: "2026-06-07T08:30:00.000Z",
    updatedAt: "2026-06-26T14:05:00.000Z",
    createdBy: CRM_CUSTOMERS_USER_ID,
    updatedBy: CRM_CUSTOMERS_USER_ID
  },
  {
    id: "customer-lumiere" as CustomerId,
    workspaceId: CRM_CUSTOMERS_WORKSPACE_ID,
    displayName: "Nadia Idrissi",
    companyName: "Clinique Lumiere",
    email: "direction@cliniquelumiere.ma",
    phone: "0663 44 55 66",
    status: "active",
    type: "company",
    source: "website",
    tags: Object.freeze(["sante", "premium"]),
    createdAt: "2026-06-09T12:00:00.000Z",
    updatedAt: "2026-06-25T09:45:00.000Z",
    createdBy: CRM_CUSTOMERS_USER_ID
  },
  {
    id: "customer-noor" as CustomerId,
    workspaceId: CRM_CUSTOMERS_WORKSPACE_ID,
    displayName: "Mehdi Lahlou",
    companyName: "Groupe Noor",
    email: "finance@groupenoor.ma",
    phone: "0664 55 66 77",
    status: "inactive",
    type: "company",
    source: "manual",
    tags: Object.freeze(["finance"]),
    createdAt: "2026-06-12T15:10:00.000Z",
    updatedAt: "2026-06-21T13:25:00.000Z",
    createdBy: CRM_CUSTOMERS_USER_ID
  }
] satisfies readonly Customer[]);

