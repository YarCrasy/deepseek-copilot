import * as assert from "assert";
import { existsSync } from "fs";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import * as path from "path";
import { executeWorkspaceCommand } from "@/core/tools/definitions/ShellExecution";
import { setToolWorkspaceHost, type ToolWorkspaceHost } from "@/core/tools/ToolWorkspace";

suite("shell execution", () => {
  test("aborts a running command promptly", async () => {
    setToolWorkspaceHost(createUnusedWorkspaceHost(process.cwd()));
    const controller = new AbortController();
    const startedAt = Date.now();
    const execution = executeWorkspaceCommand(`"${process.execPath}" -e "setInterval(() => {}, 1000)"`, undefined, controller.signal);
    setTimeout(() => controller.abort(), 100);

    await assert.rejects(execution, (error: unknown) => error instanceof Error && error.name === "AbortError");
    assert.ok(Date.now() - startedAt < 5_000, "cancelled command should not wait for the normal timeout");
  });

  test("terminates descendants when a command is cancelled", async () => {
    setToolWorkspaceHost(createUnusedWorkspaceHost(process.cwd()));
    const sandbox = await mkdtemp(path.join(tmpdir(), "deepseek-copilot-process-test-"));
    const marker = path.join(sandbox, "child-survived.txt");
    const fixture = path.resolve("src/test/fixtures/SpawnChildProcess.mjs");
    const controller = new AbortController();

    try {
      const execution = executeWorkspaceCommand(`"${process.execPath}" "${fixture}" "${marker}"`, undefined, controller.signal);
      setTimeout(() => controller.abort(), 200);
      await assert.rejects(execution, (error: unknown) => error instanceof Error && error.name === "AbortError");
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      assert.strictEqual(existsSync(marker), false, "a descendant process survived cancellation");
    } finally {
      await rm(sandbox, { recursive: true, force: true });
    }
  });
});

function createUnusedWorkspaceHost(rootPath: string): ToolWorkspaceHost {
  const unused = async (): Promise<never> => {
    throw new Error("not used by this test");
  };
  return {
    getRootPath: () => rootPath,
    readFile: unused,
    writeFile: unused,
    stat: unused,
    createParentDirectory: unused,
    readDirectory: unused,
  };
}
