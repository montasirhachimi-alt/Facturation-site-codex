import { getCommands } from "@/core/commands";
import type { CommandContext, CommandDefinition } from "@/core/commands";
import { NavigationService } from "@/services/navigation";
import { SearchService } from "@/services/search";

export type CommandExecutionResult<TResult = unknown> = {
  command?: CommandDefinition<TResult>;
  executed: boolean;
  result?: TResult | Promise<TResult>;
  reason?: string;
};

export class CommandService {
  private readonly navigationService = new NavigationService();
  private readonly searchService = new SearchService();

  getAvailableCommands() {
    return [...getCommands(), ...this.getNavigationCommands()];
  }

  getNavigationCommands(): CommandDefinition[] {
    return this.navigationService.getNavigationItems().map((moduleDefinition) => ({
      id: `open-${moduleDefinition.id}`,
      module: "commands",
      kind: "action",
      label: moduleDefinition.name,
      description: `Open ${moduleDefinition.name}`,
      status: "active",
      category: "navigation",
      href: moduleDefinition.route,
      keywords: [
        moduleDefinition.name,
        moduleDefinition.category,
        moduleDefinition.route,
        ...(moduleDefinition.aliases ?? [])
      ]
    }));
  }

  getCommandsByCategory(category: CommandDefinition["category"]) {
    return this.getAvailableCommands().filter((command) => command.category === category);
  }

  searchCommands(query: string) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return this.getAvailableCommands();

    const matchingModuleRoutes = new Set(this.searchService.searchModules(query, 100).map((result) => result.route));

    return this.getAvailableCommands().filter((command) => {
      if (command.href && matchingModuleRoutes.has(command.href)) return true;

      return [command.label, command.description, command.category, command.href, ...(command.keywords ?? [])]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }

  canExecute(commandId: string) {
    return Boolean(this.getAvailableCommands().find((command) => command.id === commandId));
  }

  execute<TResult = unknown>(command: CommandDefinition<TResult>, context: CommandContext = {}): CommandExecutionResult<TResult> {
    if (!command.execute) {
      return {
        command,
        executed: false,
        reason: "Command has no executor yet."
      };
    }

    return {
      command,
      executed: true,
      result: command.execute(context)
    };
  }

  executeCommand(commandId: string, context: CommandContext = {}) {
    const command = this.getAvailableCommands().find((item) => item.id === commandId);
    if (!command) {
      return {
        executed: false,
        reason: "Command not found."
      };
    }

    return this.execute(command, context);
  }
}
