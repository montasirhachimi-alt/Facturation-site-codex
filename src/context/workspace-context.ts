"use client";

import { createContext } from "react";
import type { HicoPilotPreference } from "@/core/preferences";
import type { HicoPilotWorkspace, WorkspaceSnapshot } from "@/services/workspace";

export type WorkspaceContextValue = {
  currentWorkspace: HicoPilotWorkspace | null;
  availableWorkspaces: HicoPilotWorkspace[];
  workspacePreferences: HicoPilotPreference[];
  workspaceSnapshot: WorkspaceSnapshot | null;
  isLoading: boolean;
  error: string | null;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspace: () => void;
  reloadSnapshot: () => void;
};

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);
