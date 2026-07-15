import { spawn, spawnSync, type ChildProcess } from "child_process";
import { realpath } from "fs/promises";
import { getToolWorkspaceHost, resolveWorkspacePathSecure } from "../ToolWorkspace";

const COMMAND_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_BYTES = 1024 * 1024;

export async function executeWorkspaceCommand(command: string, cwd?: string, signal?: AbortSignal): Promise<string> {
  const rootPath = getToolWorkspaceHost().getRootPath();
  if (!rootPath) {
    return "Error: No workspace folder open";
  }

  let workDir = rootPath;
  if (cwd) {
    try {
      workDir = (await resolveWorkspacePathSecure(cwd, rootPath, realpath)).absolutePath;
    } catch (err: unknown) {
      return `Error resolving cwd '${cwd}': ${getErrorMessage(err)}`;
    }
  }

  if (signal?.aborted) {
    throw createAbortError();
  }

  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, {
      cwd: workDir,
      shell: true,
      windowsHide: true,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout: Buffer<ArrayBufferLike> = Buffer.alloc(0);
    let stderr: Buffer<ArrayBufferLike> = Buffer.alloc(0);
    let settled = false;
    let timedOut = false;

    const appendOutput = (current: Buffer<ArrayBufferLike>, chunk: Buffer<ArrayBufferLike>): Buffer<ArrayBufferLike> => {
      const remaining = MAX_OUTPUT_BYTES - current.byteLength;
      return remaining <= 0 ? current : Buffer.concat([current, chunk.subarray(0, remaining)]);
    };
    child.stdout?.on("data", (chunk: Buffer<ArrayBufferLike>) => {
      stdout = appendOutput(stdout, chunk);
    });
    child.stderr?.on("data", (chunk: Buffer<ArrayBufferLike>) => {
      stderr = appendOutput(stderr, chunk);
    });

    const cleanup = () => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
    };
    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      callback();
    };
    const onAbort = () => {
      terminateProcessTree(child);
      finish(() => reject(createAbortError()));
    };
    const timeout = setTimeout(() => {
      timedOut = true;
      terminateProcessTree(child);
    }, COMMAND_TIMEOUT_MS);

    signal?.addEventListener("abort", onAbort, { once: true });
    child.once("error", (err) => finish(() => reject(err)));
    child.once("close", (exitCode, exitSignal) => {
      finish(() => {
        const stdoutText = stdout.toString("utf8");
        const stderrText = stderr.toString("utf8");
        if (timedOut) {
          resolve(formatCommandError(stdoutText, stderrText, `Command timed out after ${COMMAND_TIMEOUT_MS}ms`));
          return;
        }
        if (exitCode !== 0) {
          resolve(formatCommandError(stdoutText, stderrText, `Command exited with code ${exitCode ?? "unknown"}${exitSignal ? ` (${exitSignal})` : ""}`));
          return;
        }
        resolve(formatCommandSuccess(stdoutText, stderrText));
      });
    });
    if (signal?.aborted) {
      onAbort();
    }
  });
}

function terminateProcessTree(child: ChildProcess): void {
  if (!child.pid) {
    return;
  }
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}

function formatCommandSuccess(stdout: string, stderr: string): string {
  const sections = [stdout, stderr ? `STDERR:\n${stderr}` : ""].filter(Boolean);
  return sections.join("\n") || "(command completed with no output)";
}

function formatCommandError(stdout: string, stderr: string, error: string): string {
  return [stdout, stderr ? `STDERR:\n${stderr}` : "", `Error: ${error}`].filter(Boolean).join("\n");
}

function createAbortError(): Error {
  const error = new Error("Command execution cancelled");
  error.name = "AbortError";
  return error;
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
