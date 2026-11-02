import { describe, expect, it } from "vitest";
import { entitySchema } from "./schema";

const valid = {
  code: "IOT-001",
  name: "Temperature Sensor",
  category_id: "00000000-0000-4000-8000-000000000002",
  status: "active",
  latitude: 0,
  longitude: 0,
  description: "",
};

describe("entity input schema", () => {
  it("accepts zero coordinates", () => {
    expect(entitySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects coordinates outside geographic bounds", () => {
    expect(entitySchema.safeParse({ ...valid, latitude: 90.1 }).success).toBe(false);
    expect(entitySchema.safeParse({ ...valid, longitude: -180.1 }).success).toBe(false);
  });

  it("rejects invalid code and missing required values", () => {
    expect(entitySchema.safeParse({ ...valid, code: "bad code" }).success).toBe(false);
    expect(entitySchema.safeParse({ ...valid, latitude: Number.NaN }).success).toBe(false);
  });
});
