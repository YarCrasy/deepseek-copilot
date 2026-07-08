import * as assert from "assert";
import * as path from "path";
import {
  getToolWorkspaceHost,
  resolveWorkspacePath,
  setToolWorkspaceHost,
  type ToolWorkspaceEntryType,
  type ToolWorkspaceHost,
  type ToolWorkspaceStat,
} from "../core/tools/ToolWorkspace";

suite("workspace path validation", () => {
  const workspaceRoot = path.resolve("/tmp/deepseek-copilot-workspace");

  test("resolves relative paths inside the workspace", () => {
    const resolved = resolveWorkspacePath("src/core/index.ts", workspaceRoot);

    assert.strictEqual(resolved.relativePath, "src/core/index.ts");
    assert.strictEqual(resolved.absolutePath, path.join(workspaceRoot, "src/core/index.ts"));
  });

  test("resolves absolute paths inside the workspace to relative paths", () => {
    const resolved = resolveWorkspacePath(path.join(workspaceRoot, "README.md"), workspaceRoot);

    assert.strictEqual(resolved.relativePath, "README.md");
    assert.strictEqual(resolved.absolutePath, path.join(workspaceRoot, "README.md"));
  });

  test("rejects traversal and absolute paths outside the workspace", () => {
    assert.throws(() => resolveWorkspacePath("../outside.txt", workspaceRoot), /traversal/);
    assert.throws(() => resolveWorkspacePath("src/../../outside.txt", workspaceRoot), /traversal/);
    assert.throws(() => resolveWorkspacePath(path.resolve("/tmp/outside.txt"), workspaceRoot), /inside the workspace/);
  });

  test("rejects URI-like paths", () => {
    assert.throws(() => resolveWorkspacePath("file:///tmp/workspace/README.md", workspaceRoot), /not a URI/);
    assert.throws(() => resolveWorkspacePath("vscode://file/tmp/workspace/README.md", workspaceRoot), /not a URI/);
    assert.throws(() => resolveWorkspacePath("https://example.com/file.txt", workspaceRoot), /not a URI/);
  });

  test("rejects sensitive file paths by default", () => {
    assert.throws(() => resolveWorkspacePath(".env", workspaceRoot), /sensitive/);
    assert.throws(() => resolveWorkspacePath("Config/.env.local", workspaceRoot), /sensitive/);
    assert.throws(() => resolveWorkspacePath("keys/id_ed25519", workspaceRoot), /sensitive/);
    assert.throws(() => resolveWorkspacePath("certs/server.pem", workspaceRoot), /sensitive/);
    assert.throws(() => resolveWorkspacePath("auth/tokens.json", workspaceRoot), /sensitive/);
  });

  test("allows sensitive paths only when explicitly requested", () => {
    const resolved = resolveWorkspacePath(".env.example", workspaceRoot, { allowSensitive: true });

    assert.strictEqual(resolved.relativePath, ".env.example");
  });

  test("validating host normalizes accepted paths and blocks rejected paths", async () => {
    const calls: string[] = [];
    const host: ToolWorkspaceHost = {
      getRootPath: () => workspaceRoot,
      readFile: async (filePath: string) => {
        calls.push(filePath);
        return Buffer.from("ok");
      },
      writeFile: async (filePath: string) => {
        calls.push(filePath);
      },
      stat: async (filePath: string): Promise<ToolWorkspaceStat> => {
        calls.push(filePath);
        return { type: "file", size: 2 };
      },
      createParentDirectory: async (filePath: string) => {
        calls.push(filePath);
      },
      readDirectory: async (filePath: string): Promise<Array<[string, ToolWorkspaceEntryType]>> => {
        calls.push(filePath);
        return [];
      },
    };

    setToolWorkspaceHost(host);
    await getToolWorkspaceHost().readFile(path.join(workspaceRoot, "src/index.ts"));

    assert.deepStrictEqual(calls, ["src/index.ts"]);
    assert.throws(() => getToolWorkspaceHost().readFile("../outside.txt"), /traversal/);
    assert.throws(() => getToolWorkspaceHost().writeFile(".env", Buffer.from("secret")), /sensitive/);
  });
});
