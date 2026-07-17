import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { randomUUID } from "node:crypto";

export async function writeJsonFileAtomic(targetPath: string, value: unknown): Promise<void> {
  const directory = path.dirname(targetPath);
  await mkdir(directory, { recursive: true });
  const temporaryPath = path.join(directory, `.${path.basename(targetPath)}.${randomUUID()}.tmp`);

  try {
    await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    try {
      await rename(temporaryPath, targetPath);
    } catch (error) {
      if (!isReplaceConflict(error)) {throw error;}
      await rm(targetPath, { force: true });
      await rename(temporaryPath, targetPath);
    }
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

function isReplaceConflict(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {return false;}
  const code = String((error as { code?: unknown }).code);
  return code === "EEXIST" || code === "EPERM";
}
