import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { canModerateProperties, isPublicProperty } from "./property-publication";

describe("property publication", () => {
  test("only an administrator can approve properties", () => {
    assert.equal(canModerateProperties(["admin"]), true);
    for (const role of ["editor", "broker", "partner", "user", "influencer"]) {
      assert.equal(canModerateProperties([role]), false);
    }
  });
  test("a pending property cannot appear publicly", () => {
    assert.equal(isPublicProperty({ status: "pending", active: true }), false);
  });
  test("an approved active property appears publicly without a plan requirement", () => {
    assert.equal(isPublicProperty({ status: "approved", active: true }), true);
    assert.equal(isPublicProperty({ status: "approved", active: false }), false);
    assert.equal(isPublicProperty({ status: "rejected", active: true }), false);
  });
});