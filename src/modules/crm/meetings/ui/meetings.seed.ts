import type { CompanyId, UserId } from "../../companies/company.types";
import { CRM_COMPANIES_USER_ID, CRM_COMPANIES_WORKSPACE_ID } from "../../companies/ui/companies.seed";
import type { ContactId } from "../../contacts/contact.types";
import type { Meeting, MeetingId } from "../meeting.types";

export const CRM_MEETINGS_WORKSPACE_ID = CRM_COMPANIES_WORKSPACE_ID;
export const CRM_MEETINGS_USER_ID = CRM_COMPANIES_USER_ID as UserId;

export const crmMeetingSeed = Object.freeze([
  {
    id: "meeting-alhikma-strategy" as MeetingId,
    workspaceId: CRM_MEETINGS_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    contactIds: Object.freeze(["contact-sara-amrani" as ContactId]),
    title: "Revue stratégique Al Hikma",
    description: "Aligner les besoins CRM, IT et prochains devis.",
    location: "Google Meet",
    meetingType: "online",
    status: "confirmed",
    startAt: "2026-07-05T09:30:00.000Z",
    endAt: "2026-07-05T10:15:00.000Z",
    organizerId: CRM_MEETINGS_USER_ID,
    participants: Object.freeze([
      Object.freeze({ id: "contact-sara-amrani", name: "Sara Amrani", email: "sara.amrani@alhikma.ma", role: "Decision maker" }),
      Object.freeze({ id: "user-admin", name: "Montassir Hachimi", role: "Owner" })
    ]),
    notes: "Préparer les options de renouvellement avant la réunion.",
    tags: Object.freeze(["strategy", "education"]),
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-02T08:00:00.000Z"
  },
  {
    id: "meeting-alhikma-demo" as MeetingId,
    workspaceId: CRM_MEETINGS_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    contactIds: Object.freeze(["contact-sara-amrani" as ContactId, "contact-youssef-hakimi" as ContactId]),
    title: "Démonstration solution réseau",
    description: "Présentation technique pour l'équipe IT.",
    location: "Ecole Al Hikma",
    meetingType: "demo",
    status: "planned",
    startAt: "2026-07-08T14:00:00.000Z",
    endAt: "2026-07-08T15:00:00.000Z",
    organizerId: CRM_MEETINGS_USER_ID,
    participants: Object.freeze([
      Object.freeze({ id: "contact-sara-amrani", name: "Sara Amrani", role: "Sponsor" }),
      Object.freeze({ id: "contact-youssef-hakimi", name: "Youssef Hakimi", role: "Technical" })
    ]),
    tags: Object.freeze(["demo", "technical"]),
    createdAt: "2026-07-02T11:00:00.000Z",
    updatedAt: "2026-07-02T11:00:00.000Z"
  },
  {
    id: "meeting-alhikma-followup" as MeetingId,
    workspaceId: CRM_MEETINGS_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    contactIds: Object.freeze(["contact-sara-amrani" as ContactId]),
    title: "Suivi commercial",
    description: "Retour sur les documents envoyés.",
    location: "Téléphone",
    meetingType: "phone_call",
    status: "completed",
    startAt: "2026-06-27T10:00:00.000Z",
    endAt: "2026-06-27T10:20:00.000Z",
    organizerId: CRM_MEETINGS_USER_ID,
    participants: Object.freeze([Object.freeze({ id: "contact-sara-amrani", name: "Sara Amrani" })]),
    notes: "Relancer avec une proposition consolidée.",
    tags: Object.freeze(["follow-up"]),
    createdAt: "2026-06-26T17:00:00.000Z",
    updatedAt: "2026-06-27T10:30:00.000Z"
  },
  {
    id: "meeting-ibnsina-admin" as MeetingId,
    workspaceId: CRM_MEETINGS_WORKSPACE_ID,
    companyId: "company-ibn-sina" as CompanyId,
    contactIds: Object.freeze(["contact-nadia-bennani" as ContactId]),
    title: "Point administratif",
    description: "Clarifier les besoins de facturation et documents.",
    location: "Rabat",
    meetingType: "on_site",
    status: "confirmed",
    startAt: "2026-07-06T11:00:00.000Z",
    endAt: "2026-07-06T12:00:00.000Z",
    organizerId: CRM_MEETINGS_USER_ID,
    participants: Object.freeze([Object.freeze({ id: "contact-nadia-bennani", name: "Nadia Bennani", role: "Admin" })]),
    tags: Object.freeze(["administration"]),
    createdAt: "2026-07-01T15:00:00.000Z",
    updatedAt: "2026-07-01T15:00:00.000Z"
  }
] satisfies readonly Meeting[]);
