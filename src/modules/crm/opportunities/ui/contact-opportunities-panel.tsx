"use client";

import { HandCoins } from "lucide-react";
import { useMemo, useState } from "react";
import { PermissionEnforcement } from "@/runtime/permissions";
import { PermissionService } from "@/services/permissions";
import { SectionCard } from "@/ui";
import type { ContactId } from "../../contacts";
import { OpportunityService } from "../opportunity.service";
import { formatOpportunityValue } from "../opportunity.utils";
import { OPPORTUNITY_STAGE_LABELS } from "../opportunity.constants";
import { CRM_OPPORTUNITIES_USER_ID, CRM_OPPORTUNITIES_WORKSPACE_ID, crmOpportunitySeed } from "./opportunities.seed";

const permissionService = new PermissionService(
  new PermissionEnforcement({
    supportedModules: ["crm.opportunity"],
    rolePermissions: {
      COMPANY_ADMIN: { "crm.opportunity": ["read", "write"] },
      SUPER_ADMIN: { "crm.opportunity": ["read", "write"] },
      SALES: { "crm.opportunity": ["read", "write"] },
      READ_ONLY: { "crm.opportunity": ["read"] }
    }
  })
);

export function ContactOpportunitiesPanel({ contactId }: { contactId: ContactId }) {
  const [service] = useState(() => new OpportunityService({ seed: crmOpportunitySeed }));

  const readDecision = useMemo(
    () =>
      permissionService.evaluateRequirement(
        { module: "crm.opportunity", action: "read" },
        { id: "crm.contact.opportunities", type: "widget", module: "crm.opportunity", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_OPPORTUNITIES_WORKSPACE_ID, userId: CRM_OPPORTUNITIES_USER_ID }
      ),
    []
  );

  const opportunities = useMemo(
    () => service.listByContact(contactId, CRM_OPPORTUNITIES_WORKSPACE_ID, readDecision).opportunities,
    [contactId, readDecision, service]
  );

  return (
    <SectionCard className="p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20">
          <HandCoins size={19} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">Moteur de ventes</p>
          <h2 className="mt-1 font-display text-lg font-bold text-hicotech-navy dark:text-white">Opportunités liées</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">
            Premiers signaux commerciaux rattachés à ce contact.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {opportunities.length > 0 ? (
          opportunities.map((opportunity) => (
            <article key={opportunity.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-hicotech-dark-border dark:bg-slate-900/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{opportunity.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{formatOpportunityValue(opportunity.estimatedValue)} • {opportunity.probability}%</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-hicotech-blue ring-1 ring-slate-200 dark:bg-hicotech-dark-card dark:ring-hicotech-dark-border">
                  {OPPORTUNITY_STAGE_LABELS[opportunity.stage]}
                </span>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm dark:border-hicotech-dark-border dark:bg-slate-900/30">
            <p className="font-bold text-hicotech-navy dark:text-white">Aucune opportunité liée</p>
            <p className="mt-1 leading-6 text-slate-500 dark:text-slate-300">
              Les opportunités de ce contact seront visibles ici lorsque le workflow commercial sera activé.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
