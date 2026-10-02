import { describe, expect, it } from "vitest";
import { spheres, validateScores } from "./domain";

describe("assessment validation", () => {
  it("accepts all twelve valid optional scores", () => expect(validateScores(Array(12).fill(null))).toBe(true));
  it("rejects scores outside the 0–10 range", () => expect(validateScores([...Array(11).fill(null), 11])).toBe(false));
  it("rejects an incomplete wheel", () => expect(validateScores(spheres.slice(0, 11).map(() => 5))).toBe(false));
});
