"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WorkspaceContext } from "@/context/workspace-context";
import { WorkspaceService } from "@/services/workspace";
import type { HicoPilotWorkspace, WorkspaceSnapshot } from "@/services/workspace";

type WorkspaceProviderProps = {
  children: React.ReactNode;
  defaultWorkspaceId?: string;
};

type WorkspaceState = {
  currentWorkspace: HicoPilotWorkspace | null;
  availableWorkspaces: HicoPilotWorkspace[];
  workspaceSnapshot: WorkspaceSnapshot | null;
};

const emptyWorkspaceState: WorkspaceState = {
  currentWorkspace: null,
  availableWorkspaces: [],
  workspaceSnapshot: null
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Workspace state could not be loaded.";
}

export function WorkspaceProvider({ children, defaultWorkspaceId }: WorkspaceProviderProps) {
  const serviceRef = useRef<WorkspaceService | null>(null);
  const [state, setState] = useState<WorkspaceState>(emptyWorkspaceState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!serviceRef.current) {
    serviceRef.current = new WorkspaceService();
  }

  const loadWorkspaceState = useCallback((workspaceId?: string, shouldSwitch = false) => {
    const service = serviceRef.current;
    if (!service) return;

    setIsLoading(true);
    setError(null);

    try {
      const availableWorkspaces = service.getWorkspaces();
      const targetWorkspaceId = workspaceId ?? service.getDefaultWorkspace()?.id;
      const workspaceSnapshot = targetWorkspaceId
        ? shouldSwitch
          ? service.switchWorkspace(targetWorkspaceId)
          : service.getWorkspaceSnapshot(targetWorkspaceId)
        : null;

      setState({
        currentWorkspace: workspaceSnapshot?.workspace ?? null,
        availableWorkspaces,
        workspaceSnapshot
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setState((currentState) => ({
        ...currentState,
        workspaceSnapshot: null
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaceState(defaultWorkspaceId);
  }, [defaultWorkspaceId, loadWorkspaceState]);

  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      loadWorkspaceState(workspaceId, true);
    },
    [loadWorkspaceState]
  );

  const refreshWorkspace = useCallback(() => {
    loadWorkspaceState(state.currentWorkspace?.id);
  }, [loadWorkspaceState, state.currentWorkspace?.id]);

  const reloadSnapshot = useCallback(() => {
    loadWorkspaceState(state.currentWorkspace?.id);
  }, [loadWorkspaceState, state.currentWorkspace?.id]);

  const value = useMemo(
    () => ({
      currentWorkspace: state.currentWorkspace,
      availableWorkspaces: state.availableWorkspaces,
      workspacePreferences: state.workspaceSnapshot?.preferences ?? [],
      workspaceSnapshot: state.workspaceSnapshot,
      isLoading,
      error,
      switchWorkspace,
      refreshWorkspace,
      reloadSnapshot
    }),
    [error, isLoading, refreshWorkspace, reloadSnapshot, state, switchWorkspace]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
