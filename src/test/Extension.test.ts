import * as assert from "node:assert";
import * as vscode from "vscode";

suite("Extension integration", () => {
  test("activates under the Marketplace identifier and registers its main command", async () => {
    const extension = vscode.extensions.getExtension("yarcrasy.yrs-dpsk-copilot");

    assert.ok(extension, "The development extension should be discoverable by its Marketplace identifier.");
    await extension.activate();

    assert.strictEqual(extension.isActive, true);
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("yrs-dpsk-copilot.openChat"));
  });
});
