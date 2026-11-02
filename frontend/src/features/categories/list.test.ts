import { describe, expect, it } from "vitest";
import { filterCategories } from "./list";
import type { Category } from "./types";

const categories: Category[] = [
  { id: "1", name: "Trucks", description: "Fleet", icon_key: "truck", color: "orange", marker_style: "pin", entity_count: 2, is_builtin: true, created_at: "", updated_at: "" },
  { id: "2", name: "Warehouse", description: "Storage", icon_key: "warehouse", color: "blue", marker_style: "circle", entity_count: 0, is_builtin: false, created_at: "", updated_at: "" },
];

describe("category table helpers", () => {
  it("combines search and category filters", () => {
    expect(filterCategories(categories, { search: "truck", source: "built-in", markerStyle: "pin", color: "orange" }).map(({ id }) => id)).toEqual(["1"]);
    expect(filterCategories(categories, { search: "storage", source: "all", markerStyle: "", color: "" }).map(({ id }) => id)).toEqual(["2"]);
  });
});
