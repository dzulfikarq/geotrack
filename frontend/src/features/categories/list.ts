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

export function paginateCategories<T>(items: T[], page: number, pageSize: number) {
  const size = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const currentPage = Math.max(1, Math.min(Math.floor(page), pageCount));
  const offset = (currentPage - 1) * size;
  return {
    items: items.slice(offset, offset + size),
    currentPage,
    pageCount,
    firstItem: items.length ? offset + 1 : 0,
    lastItem: Math.min(offset + size, items.length),
  };
}
