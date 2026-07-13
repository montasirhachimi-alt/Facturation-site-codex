import type { ImporterDefinition } from "./importer.types";

export function createTemplateRows<TField extends string, TValue, TContext, TExisting>(
  definition: Pick<ImporterDefinition<TField, TValue, TContext, TExisting>, "sampleRow">
) {
  return [definition.sampleRow];
}

export function createInstructionRows<TField extends string, TValue, TContext, TExisting>(
  definition: Pick<ImporterDefinition<TField, TValue, TContext, TExisting>, "instructions">
) : readonly (readonly string[])[] {
  return [
    ["Instructions"],
    ...(definition.instructions ?? [])
  ];
}
