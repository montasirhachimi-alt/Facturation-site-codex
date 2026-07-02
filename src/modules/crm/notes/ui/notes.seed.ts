import type { CompanyId, UserId } from "../../companies/company.types";
import { CRM_COMPANIES_USER_ID, CRM_COMPANIES_WORKSPACE_ID } from "../../companies/ui/companies.seed";
import type { ContactId } from "../../contacts/contact.types";
import type { MeetingId } from "../../meetings";
import type { TaskId } from "../../tasks";
import type { Note, NoteId } from "../note.types";

export const CRM_NOTES_WORKSPACE_ID = CRM_COMPANIES_WORKSPACE_ID;
export const CRM_NOTES_USER_ID = CRM_COMPANIES_USER_ID as UserId;

export const crmNoteSeed = Object.freeze([
  {
    id: "note-alhikma-strategy" as NoteId,
    workspaceId: CRM_NOTES_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    contactId: "contact-sara-amrani" as ContactId,
    meetingId: "meeting-alhikma-strategy" as MeetingId,
    title: "Contexte stratégique",
    content: "Sara veut une proposition consolidée avec options réseau, CRM et support. Préparer un résumé clair pour direction.",
    visibility: "team",
    authorId: CRM_NOTES_USER_ID,
    tags: Object.freeze(["pinned", "strategy", "education"]),
    attachments: Object.freeze([]),
    createdAt: "2026-07-02T09:20:00.000Z",
    updatedAt: "2026-07-02T10:00:00.000Z"
  },
  {
    id: "note-alhikma-followup" as NoteId,
    workspaceId: CRM_NOTES_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    contactId: "contact-sara-amrani" as ContactId,
    taskId: "task-alhikma-followup" as TaskId,
    title: "Points de relance",
    content: "Relancer avec une approche orientée ROI et continuité de service. Mettre l'accent sur la simplicité de déploiement.",
    visibility: "private",
    authorId: CRM_NOTES_USER_ID,
    tags: Object.freeze(["follow-up"]),
    attachments: Object.freeze([]),
    createdAt: "2026-07-01T16:30:00.000Z",
    updatedAt: "2026-07-01T16:30:00.000Z"
  },
  {
    id: "note-alhikma-technical" as NoteId,
    workspaceId: CRM_NOTES_WORKSPACE_ID,
    companyId: "company-al-hikma" as CompanyId,
    contactId: "contact-youssef-hakimi" as ContactId,
    title: "Contraintes IT",
    content: "Youssef demande une validation technique avant engagement. Prévoir une démo courte et une checklist sécurité.",
    visibility: "team",
    authorId: CRM_NOTES_USER_ID,
    tags: Object.freeze(["technical"]),
    attachments: Object.freeze([]),
    createdAt: "2026-07-01T11:00:00.000Z",
    updatedAt: "2026-07-01T11:20:00.000Z"
  },
  {
    id: "note-ibnsina-admin" as NoteId,
    workspaceId: CRM_NOTES_WORKSPACE_ID,
    companyId: "company-ibn-sina" as CompanyId,
    contactId: "contact-nadia-bennani" as ContactId,
    title: "Documents administratifs",
    content: "Nadia centralise les validations administratives. Préparer les modèles PDF et conditions générales.",
    visibility: "company",
    authorId: CRM_NOTES_USER_ID,
    tags: Object.freeze(["administration"]),
    attachments: Object.freeze([]),
    createdAt: "2026-06-29T09:00:00.000Z",
    updatedAt: "2026-06-29T09:00:00.000Z"
  }
] satisfies readonly Note[]);
