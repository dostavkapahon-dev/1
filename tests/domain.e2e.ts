import { test, expect } from "@playwright/test";

test.describe("critical server flows", () => {
  test.skip(true, "Run the full browser flow against a disposable PostgreSQL through scripts/e2e.mjs; production secrets are intentionally not used in unit CI.");
  test("placeholder", async () => { expect(true).toBe(true); });
});
