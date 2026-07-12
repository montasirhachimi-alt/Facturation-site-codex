import type { ModuleActivationRequest } from "./module-activation.types";
import { alphaCrmSalesEditionProfile } from "../editions/edition.profiles";
import { editionToActivationRequest } from "../editions/edition.utils";

export const alphaActivationProfile = Object.freeze(
  editionToActivationRequest(alphaCrmSalesEditionProfile)
) satisfies ModuleActivationRequest;
