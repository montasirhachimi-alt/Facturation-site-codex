import type { OpportunityPriority, OpportunitySort, OpportunityStage, OpportunityStatus } from "./opportunity.types";

export const OPPORTUNITY_STAGES = Object.freeze(["lead", "qualified", "proposal", "negotiation", "won", "lost"] satisfies OpportunityStage[]);
export const OPPORTUNITY_STATUSES = Object.freeze(["open", "won", "lost", "archived"] satisfies OpportunityStatus[]);
export const OPPORTUNITY_PRIORITIES = Object.freeze(["low", "medium", "high", "urgent"] satisfies OpportunityPriority[]);

export const DEFAULT_OPPORTUNITY_STAGE: OpportunityStage = "lead";
export const DEFAULT_OPPORTUNITY_STATUS: OpportunityStatus = "open";
export const DEFAULT_OPPORTUNITY_PRIORITY: OpportunityPriority = "medium";
export const DEFAULT_OPPORTUNITY_PROBABILITY = 25;
export const DEFAULT_OPPORTUNITY_SORT: OpportunitySort = Object.freeze({ field: "expectedCloseDate", direction: "asc" });

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = Object.freeze({
  lead: "Lead",
  qualified: "Qualifiée",
  proposal: "Proposition",
  negotiation: "Négociation",
  won: "Gagnée",
  lost: "Perdue"
});

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = Object.freeze({
  open: "Ouverte",
  won: "Gagnée",
  lost: "Perdue",
  archived: "Archivée"
});

export const OPPORTUNITY_PRIORITY_LABELS: Record<OpportunityPriority, string> = Object.freeze({
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente"
});
