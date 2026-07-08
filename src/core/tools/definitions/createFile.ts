import type { ToolDefinition } from "@/adapters";
import type { RegisteredTool, ToolMetadata } from "../types";
import { getToolWorkspaceHost } from "../toolWorkspace";
import { bufferLooksBinary, createStructuredResult, createUnifiedDiff, isMissingFileError } from "./structuredResult";

async function handleCreateFile(args: Record<string, unknown>): Promise<string> {
  const filePath = args.path as string;
  const content = (args.content as string) || "";

  if (!filePath) {
    return "Error: path parameter is required";
  }

  try {
    const workspace = getToolWorkspaceHost();

    let fileExists = false;
    try {
      await workspace.stat(filePath);
      fileExists = true;
    } catch (err: unknown) {
      if (isMissingFileError(err)) {
        // Missing files are expected when creating a new file.
      } else {
        return `Error checking if file "${filePath}" exists: ${getErrorMessage(err)}`;
      }
    }

    if (fileExists) {
      return JSON.stringify({
        requiresConfirmation: true,
        dangerLevel: "caution",
        warningMessage: `The file "${filePath}" already exists. Creating a new file will OVERWRITE it.`,
        filePath,
      });
    }

    try {
      await workspace.createParentDirectory(filePath);
    } catch (err: unknown) {
      return `Error creating parent directories for "${filePath}": ${getErrorMessage(err)}`;
    }

    await workspace.writeFile(filePath, Buffer.from(content, "utf-8"));
    const diff = createUnifiedDiff({ filePath, before: "", after: content });
    return createStructuredResult("fileWrite", {
      path: filePath,
      overwritten: false,
      diff: diff.content,
      diffTruncated: diff.truncated,
      diffStats: diff.stats,
      afterSize: Buffer.byteLength(content, "utf-8"),
      summary: `File created: ${filePath}`,
    });
  } catch (err: unknown) {
    return `Error creating file '${filePath}': ${getErrorMessage(err)}`;
  }
}

/**
 * Forced variant used after explicit user confirmation.
 */
async function handleCreateFileForced(args: Record<string, unknown>): Promise<string> {
  const filePath = args.path as string;
  const content = (args.content as string) || "";

  if (!filePath) {
    return "Error: path parameter is required";
  }

  try {
    const workspace = getToolWorkspaceHost();

    const before = await readExistingFile(filePath);

    try {
      await workspace.createParentDirectory(filePath);
    } catch (err: unknown) {
      return `Error creating parent directories for "${filePath}": ${getErrorMessage(err)}`;
    }

    await workspace.writeFile(filePath, Buffer.from(content, "utf-8"));
    const diff = before?.binary ? undefined : createUnifiedDiff({ filePath, before: before?.content || "", after: content });
    return createStructuredResult("fileWrite", {
      path: filePath,
      overwritten: before !== undefined,
      diff: diff?.content || "",
      diffTruncated: diff?.truncated || false,
      diffStats: diff?.stats,
      binary: before?.binary || false,
      beforeSize: before?.size,
      afterSize: Buffer.byteLength(content, "utf-8"),
      summary: before !== undefined ? `File overwritten: ${filePath}` : `File created: ${filePath}`,
    });
  } catch (err: unknown) {
    return `Error creating file '${filePath}': ${getErrorMessage(err)}`;
  }
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function readExistingFile(filePath: string): Promise<{ content: string; size: number; binary: boolean } | undefined> {
  try {
    const buffer = await getToolWorkspaceHost().readFile(filePath);
    const binary = bufferLooksBinary(buffer);
    return {
      content: binary ? "" : Buffer.from(buffer).toString("utf-8"),
      size: buffer.byteLength,
      binary,
    };
  } catch {
    return undefined;
  }
}

export const createFileDefinition: ToolDefinition = {
  type: "function",
  function: {
    name: "create_file",
    description:
      "Create a new file in the project with the specified content. Creates parent directories when needed. Does not overwrite existing files without confirmation.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relative path of the file to create, for example src/utils/helper.ts.",
        },
        content: {
          type: "string",
          description: "File contents.",
        },
      },
      required: ["path"],
      additionalProperties: false,
    },
  },
};

export const createFileHandler: RegisteredTool["handler"] = handleCreateFile;
export const createFileHandlerForced: RegisteredTool["handler"] = handleCreateFileForced;

export const createFileMetadata: ToolMetadata = {
  dangerLevel: "caution",
  warningMessage: "This will overwrite existing files without backup.",
  requiresConfirmation: true,
};
