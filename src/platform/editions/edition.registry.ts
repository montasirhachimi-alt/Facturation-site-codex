import type { ModuleRegistry } from "../modules/module.registry";
import type { EditionId, EditionProfile, EditionStatus, EditionValidationResult } from "./edition.types";
import { compareEditionsByOrder } from "./edition.utils";
import { validateEditionProfiles } from "./edition.validation";

export class EditionProfileRegistry {
  private readonly profiles = new Map<EditionId, EditionProfile>();

  constructor(
    profiles: readonly EditionProfile[] = [],
    private readonly moduleRegistry: ModuleRegistry
  ) {
    this.registerMany(profiles);
  }

  register(profile: EditionProfile) {
    if (this.profiles.has(profile.id)) {
      throw new Error(`Edition "${profile.id}" is already registered.`);
    }

    this.profiles.set(profile.id, cloneEditionProfile(profile));
    return this;
  }

  registerMany(profiles: readonly EditionProfile[]) {
    profiles.forEach((profile) => this.register(profile));
    return this;
  }

  get(id: EditionId) {
    return this.profiles.get(id);
  }

  has(id: EditionId) {
    return this.profiles.has(id);
  }

  list() {
    return Object.freeze([...this.profiles.values()].sort(compareEditionsByOrder));
  }

  listByStatus(status: EditionStatus) {
    return Object.freeze(this.list().filter((profile) => profile.status === status));
  }

  listCommercial() {
    return Object.freeze(this.list().filter((profile) => profile.commercial));
  }

  getDefaultEdition() {
    return this.list().find((profile) => profile.defaultForEnvironment);
  }

  validate(): EditionValidationResult {
    return validateEditionProfiles(this.list(), this.moduleRegistry);
  }
}

export function createEditionProfileRegistry(
  profiles: readonly EditionProfile[],
  moduleRegistry: ModuleRegistry
) {
  return new EditionProfileRegistry(profiles, moduleRegistry);
}

function cloneEditionProfile(profile: EditionProfile): EditionProfile {
  return Object.freeze({
    ...profile,
    enabledModuleIds: Object.freeze([...profile.enabledModuleIds]),
    disabledModuleIds: Object.freeze([...(profile.disabledModuleIds ?? [])]),
    tags: profile.tags ? Object.freeze([...profile.tags]) : undefined,
    notes: profile.notes ? Object.freeze([...profile.notes]) : undefined,
    featureOverrides: profile.featureOverrides ? Object.freeze([...profile.featureOverrides]) : undefined
  });
}
