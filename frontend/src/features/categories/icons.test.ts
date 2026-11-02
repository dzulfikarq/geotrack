import { describe, expect, it } from "vitest";
import { getColor, getIcon, renderCategoryMarkerMarkup } from "./icons";

describe("category icon and marker registry", () => {
  it("uses the same category configuration for generated map markers", () => {
    const before = renderCategoryMarkerMarkup("truck", "orange", "pin", false, "active");
    const after = renderCategoryMarkerMarkup("warehouse", "blue", "circle", true, "maintenance");
    expect(before).toContain("marker-pin");
    expect(after).toContain("marker-circle");
    expect(after).toContain("is-selected");
    expect(after).toContain("is-maintenance");
    expect(before).not.toBe(after);
  });

  it("falls back to allowlisted values instead of rendering arbitrary input", () => {
    const icon = renderCategoryMarkerMarkup("<script>alert(1)</script>", "#fff\"><script>", "<svg>", false, "active");
    expect(icon).not.toContain("<script>");
    expect(icon).not.toContain("#fff");
    expect(icon).toContain("marker-pin");
    expect(getIcon("unknown")).toBe(getIcon("map-pin"));
    expect(getColor("unknown").key).toBe("orange");
  });
});
