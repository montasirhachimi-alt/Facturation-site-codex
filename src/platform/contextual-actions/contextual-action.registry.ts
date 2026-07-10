import type { ContextualAction } from "./contextual-action.types";
import { sortContextualActions } from "./contextual-action.utils";

export class ContextualActionRegistry {
  private readonly actions = new Map<string, ContextualAction>();

  register(action: ContextualAction) {
    this.actions.set(action.id, action);
    return this;
  }

  registerMany(actions: readonly ContextualAction[]) {
    actions.forEach((action) => this.register(action));
    return this;
  }

  getAll() {
    return sortContextualActions(Array.from(this.actions.values()).filter((action) => action.available !== false));
  }
}

export function createContextualActionRegistry(actions: readonly ContextualAction[] = []) {
  return new ContextualActionRegistry().registerMany(actions);
}
