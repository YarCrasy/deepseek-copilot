import * as path from "path";
import * as vscode from "vscode";
import type { ToolWorkspaceEntryType, ToolWorkspaceHost, ToolWorkspaceStat } from "@/core/tools/toolWorkspace";

export function createVsCodeToolWorkspace(): ToolWorkspaceHost {
  return {
    getRootPath(): string | undefined {
      return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    },

    async readFile(relativePath: string): Promise<Uint8Array> {
      return vscode.workspace.fs.readFile(toWorkspaceUri(relativePath));
    },

    async writeFile(relativePath: string, content: Uint8Array): Promise<void> {
      await vscode.workspace.fs.writeFile(toWorkspaceUri(relativePath), content);
    },

    async stat(relativePath: string): Promise<ToolWorkspaceStat> {
      const stat = await vscode.workspace.fs.stat(toWorkspaceUri(relativePath));
      return {
        type: toEntryType(stat.type),
        size: stat.size,
      };
    },

    async createParentDirectory(relativePath: string): Promise<void> {
      const parentPath = path.posix.dirname(relativePath.replace(/\\/g, "/"));
      if (!parentPath || parentPath === ".") {
        return;
      }
      await vscode.workspace.fs.createDirectory(toWorkspaceUri(parentPath));
    },

    async readDirectory(relativePath: string): Promise<Array<[string, ToolWorkspaceEntryType]>> {
      const entries = await vscode.workspace.fs.readDirectory(toWorkspaceUri(relativePath));
      return entries.map(([name, type]) => [name, toEntryType(type)]);
    },
  };
}

function toWorkspaceUri(relativePath: string): vscode.Uri {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri;
  if (!root) {
    throw new Error("No workspace folder open");
  }
  return vscode.Uri.joinPath(root, relativePath);
}

function toEntryType(type: vscode.FileType): ToolWorkspaceEntryType {
  if (type === vscode.FileType.Directory) {
    return "directory";
  }
  if (type === vscode.FileType.File) {
    return "file";
  }
  return "unknown";
}
