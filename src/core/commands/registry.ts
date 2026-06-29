import type { CommandDefinition } from "./types";

const commands: CommandDefinition[] = [];

export function registerCommand(command: CommandDefinition) {
  commands.push(command);
}

export function getCommands() {
  return [...commands];
}

export function clearCommands() {
  commands.length = 0;
}
