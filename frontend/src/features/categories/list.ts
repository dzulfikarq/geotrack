import { ICON_CATALOG, type ColorKey, type MarkerStyle } from "./icons";
import type { Category } from "./types";

export type CategorySource = "all" | "built-in" | "custom";
export type CategoryListFilters = {
  search: string;
  source: CategorySource;
  markerStyle: MarkerStyle | "";
  color: ColorKey | "";
};

export function filterCategories(categories: Category[], filters: CategoryListFilters) {
  const needle = filters.search.trim().toLocaleLowerCase();
  return categories.filter((category) => {
    const icon = ICON_CATALOG.find((entry) => entry.key === category.icon_key)?.label ?? category.icon_key;
    return (!needle || `${category.name} ${category.description} ${icon}`.toLocaleLowerCase().includes(needle))
      && (filters.source === "all" || category.is_builtin === (filters.source === "built-in"))
      && (!filters.markerStyle || category.marker_style === filters.markerStyle)
      && (!filters.color || category.color === filters.color);
  });
}
