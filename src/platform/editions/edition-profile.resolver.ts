import type { EditionId, EditionProfile } from "./edition.types";
import type { EditionProfileRegistry } from "./edition.registry";

export const internalEditionProfileEnvName = "NEXT_PUBLIC_BOSIACO_INTERNAL_EDITION_PROFILE";

const allowedInternalProfileIds = new Set<EditionId>(["alpha.crm-sales", "sales-operations"]);

export type EditionProfileResolutionSource = "default" | "internal-environment";

export type EditionProfileEnvironment = Readonly<{
  internalEditionProfile?: string;
  nodeEnv?: string;
  vercelEnv?: string;
}>;

export type EditionProfileResolution = Readonly<{
  profile: EditionProfile;
  defaultProfile: EditionProfile;
  source: EditionProfileResolutionSource;
  requestedProfileId?: EditionId;
  warning?: string;
}>;

export function readEditionProfileEnvironment(): EditionProfileEnvironment {
  return Object.freeze({
    internalEditionProfile: process.env.NEXT_PUBLIC_BOSIACO_INTERNAL_EDITION_PROFILE,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
}

export function resolveEditionProfileForEnvironment(
  registry: EditionProfileRegistry,
  environment: EditionProfileEnvironment = readEditionProfileEnvironment()
): EditionProfileResolution {
  const defaultProfile = getDefaultEditionProfile(registry);
  const requestedProfileId = normalizeEditionProfileId(environment.internalEditionProfile);

  if (!requestedProfileId) {
    return Object.freeze({
      profile: defaultProfile,
      defaultProfile,
      source: "default"
    });
  }

  if (!isInternalEditionProfileSelectionAllowed(environment)) {
    return Object.freeze({
      profile: defaultProfile,
      defaultProfile,
      requestedProfileId,
      source: "default",
      warning: `Internal Edition profile override "${requestedProfileId}" is ignored outside development or test runtime.`
    });
  }

  if (!allowedInternalProfileIds.has(requestedProfileId)) {
    return Object.freeze({
      profile: defaultProfile,
      defaultProfile,
      requestedProfileId,
      source: "default",
      warning: `Internal Edition profile override "${requestedProfileId}" is not allow-listed.`
    });
  }

  const requestedProfile = registry.get(requestedProfileId);
  if (!requestedProfile) {
    return Object.freeze({
      profile: defaultProfile,
      defaultProfile,
      requestedProfileId,
      source: "default",
      warning: `Internal Edition profile override "${requestedProfileId}" does not match a registered Edition profile.`
    });
  }

  return Object.freeze({
    profile: requestedProfile,
    defaultProfile,
    requestedProfileId,
    source: "internal-environment"
  });
}

export function isInternalEditionProfileSelectionAllowed(environment: EditionProfileEnvironment) {
  return environment.nodeEnv === "development" || environment.nodeEnv === "test";
}

function getDefaultEditionProfile(registry: EditionProfileRegistry) {
  const profile = registry.getDefaultEdition() ?? registry.get("alpha.crm-sales");
  if (!profile) throw new Error("Aucune Edition Alpha par défaut n'est enregistrée.");
  return profile;
}

function normalizeEditionProfileId(value?: string): EditionId | undefined {
  const normalized = value?.trim();
  return normalized ? normalized as EditionId : undefined;
}
