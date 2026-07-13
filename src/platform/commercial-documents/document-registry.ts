import type { CommercialDocumentDefinition } from "./document-definition";
import type { CommercialDocumentType } from "./document.types";

export type CommercialDocumentRegistryValidation = Readonly<{
  valid: boolean;
  errors: readonly string[];
}>;

export class CommercialDocumentRegistry {
  private readonly definitions = new Map<CommercialDocumentType, CommercialDocumentDefinition>();

  register(definition: CommercialDocumentDefinition) {
    if (this.definitions.has(definition.type)) {
      throw new Error(`Duplicate commercial document definition: ${definition.type}`);
    }

    this.definitions.set(definition.type, Object.freeze({ ...definition }));
    return this;
  }

  get(type: CommercialDocumentType) {
    return this.definitions.get(type);
  }

  list() {
    return Object.freeze([...this.definitions.values()]);
  }

  validate(): CommercialDocumentRegistryValidation {
    const errors: string[] = [];

    for (const definition of this.definitions.values()) {
      if (!definition.label.trim()) errors.push(`${definition.type}: missing label`);
      if (!definition.pluralLabel.trim()) errors.push(`${definition.type}: missing plural label`);
      if (!definition.prefix.trim()) errors.push(`${definition.type}: missing numbering prefix`);
    }

    return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
  }
}

export function createCommercialDocumentRegistry(definitions: readonly CommercialDocumentDefinition[]) {
  const registry = new CommercialDocumentRegistry();
  definitions.forEach((definition) => registry.register(definition));
  return registry;
}
