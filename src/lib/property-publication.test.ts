import { describe, expect, test } from "bun:test";
import { canModerateProperties, isPublicProperty } from "./property-publication";

describe("property publication", () => {
  test("only an administrator can approve properties", () => {
    expect(canModerateProperties(["admin"])).toBe(true);
    for (const role of ["editor", "broker", "partner", "user", "influencer"]) {
      expect(canModerateProperties([role])).toBe(false);
    }
  });
  test("a pending property cannot appear publicly", () => {
    expect(isPublicProperty({ status: "pending", active: true })).toBe(false);
  });
  test("an approved active property appears publicly without a plan requirement", () => {
    expect(isPublicProperty({ status: "approved", active: true })).toBe(true);
    expect(isPublicProperty({ status: "approved", active: false })).toBe(false);
    expect(isPublicProperty({ status: "rejected", active: true })).toBe(false);
  });
});