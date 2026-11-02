import { describe, expect, it } from "vitest";
import { paginateItems } from "./pagination";

describe("pagination", () => {
  it("slices pages and clamps stale page after results shrink", () => {
    const page = paginateItems(Array.from({ length: 12 }, (_, index) => index), 8, 5);
    expect(page).toMatchObject({ items: [10, 11], currentPage: 3, pageCount: 3, firstItem: 11, lastItem: 12 });
  });
});
