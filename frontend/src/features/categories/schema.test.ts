import { describe, expect, it } from "vitest";
import { categorySchema } from "./schema";
import { COLOR_PALETTE, ICON_CATALOG, MARKER_STYLES } from "./icons";

const valid = { name: "Warehouse", description: "Storage", icon_key: "warehouse", color: "blue", marker_style: "rounded-square" };

describe("category input schema", () => {
  it("accepts allowlisted icon, color, and marker keys", () => {
    expect(categorySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty name and arbitrary icon, color, or marker values", () => {
    expect(categorySchema.safeParse({ ...valid, name: " " }).success).toBe(false);
    expect(categorySchema.safeParse({ ...valid, icon_key: "<script>" }).success).toBe(false);
    expect(categorySchema.safeParse({ ...valid, color: "#fff" }).success).toBe(false);
    expect(categorySchema.safeParse({ ...valid, marker_style: "svg" }).success).toBe(false);
  });

  it("keeps catalog and palette values unique", () => {
    expect(new Set(ICON_CATALOG.map(({ key }) => key)).size).toBe(24);
    expect(new Set(COLOR_PALETTE.map(({ key }) => key)).size).toBe(8);
    expect(MARKER_STYLES).toEqual(["pin", "circle", "rounded-square"]);
  });
});
