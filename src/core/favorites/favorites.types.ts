import type { CoreModuleId } from "../registry";
import type { FAVORITE_TARGET_TYPES } from "./favorites.constants";

export type FavoriteTargetType = (typeof FAVORITE_TARGET_TYPES)[number];

export type FavoriteMetadata = Record<string, string | number | boolean | null | undefined>;

export type HicoPilotFavorite = {
  id: string;
  targetId: string;
  targetType: FavoriteTargetType;
  moduleId?: CoreModuleId;
  title: string;
  icon?: string;
  color?: string;
  order: number;
  pinned: boolean;
  favoriteDate: string;
  metadata?: FavoriteMetadata;
};

export type FavoriteInput = Omit<HicoPilotFavorite, "order" | "pinned" | "favoriteDate"> & {
  order?: number;
  pinned?: boolean;
  favoriteDate?: string;
};
