import * as assert from "assert";
import { CONFIG_SECTION, INCLUDE_HOME_AGENTS_KEY } from "@/shared/constants";

suite("extension configuration", () => {
  test("uses the contributed relative key for global AGENTS instructions", () => {
    assert.strictEqual(`${CONFIG_SECTION}.${INCLUDE_HOME_AGENTS_KEY}`, "yrs-dpsk-copilot.projectInstructions.includeHomeAgents");
  });
});
