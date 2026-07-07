export type ToolWorkspaceEntryType = "file" | "directory" | "unknown";

export interface ToolWorkspaceStat {
  type: ToolWorkspaceEntryType;
  size: number;
}

export interface ToolWorkspaceHost {
  getRootPath(): string | undefined;
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, content: Uint8Array): Promise<void>;
  stat(path: string): Promise<ToolWorkspaceStat>;
  createParentDirectory(path: string): Promise<void>;
  readDirectory(path: string): Promise<Array<[string, ToolWorkspaceEntryType]>>;
}

let workspaceHost: ToolWorkspaceHost | undefined;

export function setToolWorkspaceHost(host: ToolWorkspaceHost): void {
  workspaceHost = host;
}

export function getToolWorkspaceHost(): ToolWorkspaceHost {
  if (!workspaceHost) {
    throw new Error("Tool workspace host has not been configured");
  }
  return workspaceHost;
}
