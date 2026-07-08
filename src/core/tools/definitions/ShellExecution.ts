import { exec } from "child_process";
import { promisify } from "util";
import { getToolWorkspaceHost, resolveWorkspacePath } from "../ToolWorkspace";

const execAsync = promisify(exec);

export async function executeWorkspaceCommand(command: string, cwd?: string): Promise<string> {
  const rootPath = getToolWorkspaceHost().getRootPath();
  if (!rootPath) {
    return "Error: No workspace folder open";
  }

  let workDir = rootPath;
  if (cwd) {
    try {
      workDir = resolveWorkspacePath(cwd, rootPath).absolutePath;
    } catch (err: unknown) {
      return `Error resolving cwd '${cwd}': ${getErrorMessage(err)}`;
    }
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: workDir,
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
    });

    let result = "";
    if (stdout) {
      result += stdout;
    }
    if (stderr) {
      result += `\nSTDERR:\n${stderr}`;
    }

    return result || "(command completed with no output)";
  } catch (err: unknown) {
    const stdout = getErrorStdout(err);
    if (stdout) {
      return `${stdout}\n\nError: ${getErrorMessage(err)}`;
    }
    return `Error executing command: ${getErrorMessage(err)}`;
  }
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function getErrorStdout(err: unknown): string | undefined {
  return err && typeof err === "object" && typeof (err as { stdout?: unknown }).stdout === "string" ? (err as { stdout: string }).stdout : undefined;
}
