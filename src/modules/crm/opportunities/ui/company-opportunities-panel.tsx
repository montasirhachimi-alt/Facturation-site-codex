"use client";

import { HandCoins, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { PermissionEnforcement } from "@/runtime/permissions";
import { PermissionService } from "@/services/permissions";
import { SectionCard } from "@/ui";
import type { CompanyId } from "../../companies";
import { OpportunityService } from "../opportunity.service";
import type { Opportunity } from "../opportunity.types";
import { formatOpportunityValue } from "../opportunity.utils";
import { OPPORTUNITY_STAGE_LABELS } from "../opportunity.constants";
import { CRM_OPPORTUNITIES_USER_ID, CRM_OPPORTUNITIES_WORKSPACE_ID, crmOpportunitySeed } from "./opportunities.seed";
import { OpportunityQuoteAction } from "@/modules/sales/quotes/ui";

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

export function CompanyOpportunitiesPanel({ companyId }: { companyId: CompanyId }) {
  const [service] = useState(() => new OpportunityService({ seed: crmOpportunitySeed }));

  const readDecision = useMemo(
    () =>
      permissionService.evaluateRequirement(
        { module: "crm.opportunity", action: "read" },
        { id: "crm.company.opportunities", type: "widget", module: "crm.opportunity", enabled: true },
        { role: "COMPANY_ADMIN", workspaceId: CRM_OPPORTUNITIES_WORKSPACE_ID, userId: CRM_OPPORTUNITIES_USER_ID }
      ),
    []
  );

  const opportunities = useMemo(
    () => service.listByCompany(companyId, CRM_OPPORTUNITIES_WORKSPACE_ID, readDecision).opportunities,
    [companyId, readDecision, service]
  );

  const openOpportunities = opportunities.filter((opportunity) => opportunity.status === "open");
  const pipelineValue = openOpportunities.reduce((total, opportunity) => total + opportunity.estimatedValue.amount, 0);

  return (
    <SectionCard className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-hicotech-blue">Moteur de ventes</p>
          <h2 className="mt-2 font-display text-lg font-bold text-hicotech-navy dark:text-white">Opportunités</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
            Pipeline commercial préparé pour relier cette société aux futurs devis, commandes et factures.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniMetric icon={HandCoins} label="Ouvertes" value={String(openOpportunities.length)} />
          <MiniMetric icon={TrendingUp} label="Pipeline" value={formatOpportunityValue({ amount: pipelineValue, currency: "MAD" })} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {openOpportunities.length > 0 ? (
          openOpportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 text-sm dark:border-hicotech-dark-border dark:bg-slate-900/30">
            <p className="font-bold text-hicotech-navy dark:text-white">Aucune opportunité ouverte</p>
            <p className="mt-1 leading-6 text-slate-500 dark:text-slate-300">
              Les opportunités seront créées depuis le futur workflow commercial.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-hicotech-blue/25 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 dark:border-hicotech-dark-border dark:bg-slate-900/30 dark:hover:bg-hicotech-dark-card dark:hover:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-sm font-bold text-hicotech-navy dark:text-white">{opportunity.title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{opportunity.description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-hicotech-blue ring-1 ring-slate-200 dark:bg-hicotech-dark-card dark:ring-hicotech-dark-border">
          {OPPORTUNITY_STAGE_LABELS[opportunity.stage]}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
        <span>{formatOpportunityValue(opportunity.estimatedValue)}</span>
        <span>•</span>
        <span>{opportunity.probability}%</span>
        {opportunity.expectedCloseDate && (
          <>
            <span>•</span>
            <span>{formatDate(opportunity.expectedCloseDate)}</span>
          </>
        )}
      </div>
      <div className="mt-4">
        <OpportunityQuoteAction opportunityId={opportunity.id} />
      </div>
    </article>
  );
}

function MiniMetric({ icon: Icon, label, value }: { icon: typeof HandCoins | typeof TrendingUp; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-hicotech-dark-border dark:bg-slate-900/30">
      <Icon size={17} className="text-hicotech-blue" />
      <p className="mt-2 font-display text-lg font-bold text-hicotech-navy dark:text-white">{value}</p>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
