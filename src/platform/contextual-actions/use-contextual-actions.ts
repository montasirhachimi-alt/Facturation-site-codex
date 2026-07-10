"use client";

import { useMemo } from "react";
import { createContextualActionRegistry } from "./contextual-action.registry";
import type { ContextualAction } from "./contextual-action.types";

export function useContextualActions(actions: readonly ContextualAction[]) {
  return useMemo(() => createContextualActionRegistry(actions).getAll(), [actions]);
}
