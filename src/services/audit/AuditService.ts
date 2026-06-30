import { auditService } from "@/core/audit";
import type { AuditEventInput, AuditSearchQuery } from "@/core/audit";

export class AuditService {
  log(input: AuditEventInput) {
    return auditService.log(input);
  }

  search(query: AuditSearchQuery) {
    return auditService.search(query);
  }

  getRecent(limit?: number) {
    return auditService.getRecent(limit);
  }

  export(query: AuditSearchQuery = {}) {
    return auditService.search(query);
  }
}
