export type ApplicationSession = {
  id: string;
  userId?: string;
  workspaceId?: string;
  startedAt: string;
  endedAt?: string;
  lastHeartbeatAt?: string;
  active: boolean;
};

const sessions = new Map<string, ApplicationSession>();

export class SessionService {
  startSession(input: { id?: string; userId?: string; workspaceId?: string } = {}) {
    const startedAt = new Date().toISOString();
    const session: ApplicationSession = {
      id: input.id ?? `session-${startedAt}`,
      userId: input.userId,
      workspaceId: input.workspaceId,
      startedAt,
      lastHeartbeatAt: startedAt,
      active: true
    };

    sessions.set(session.id, session);
    return session;
  }

  endSession(id: string) {
    const session = sessions.get(id);
    if (!session) return undefined;

    const updated = {
      ...session,
      endedAt: new Date().toISOString(),
      active: false
    };

    sessions.set(id, updated);
    return updated;
  }

  heartbeat(id: string) {
    const session = sessions.get(id);
    if (!session) return undefined;

    const updated = {
      ...session,
      lastHeartbeatAt: new Date().toISOString()
    };

    sessions.set(id, updated);
    return updated;
  }

  getSession(id: string) {
    return sessions.get(id);
  }
}
