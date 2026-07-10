import type { LucideIcon } from "lucide-react";

export type ContextualEntityType =
  | "quote"
  | "invoice"
  | "customer"
  | "company"
  | "contact"
  | "payment";

export type ContextualActionTone = "primary" | "neutral" | "success" | "warning";

export type ContextualAction = Readonly<{
  id: string;
  entityType: ContextualEntityType;
  label: string;
  ariaLabel?: string;
  description?: string;
  icon: LucideIcon;
  priority?: number;
  href?: string;
  onSelect?: () => void;
  available?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  tone?: ContextualActionTone;
}>;
