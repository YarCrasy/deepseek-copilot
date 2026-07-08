import * as path from "path";

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
  prepareFileDiff?(path: string, before: string, after: string): Promise<void>;
  clearFileDiffPreview?(): void;
}

export interface ResolvedWorkspacePath {
  absolutePath: string;
  relativePath: string;
}

export interface ResolveWorkspacePathOptions {
  allowSensitive?: boolean;
}

let workspaceHost: ToolWorkspaceHost | undefined;

export function setToolWorkspaceHost(host: ToolWorkspaceHost): void {
  workspaceHost = createValidatingWorkspaceHost(host);
}

export function getToolWorkspaceHost(): ToolWorkspaceHost {
  if (!workspaceHost) {
    throw new Error("Tool workspace host has not been configured");
  }
  return workspaceHost;
}

export function resolveWorkspacePath(rawPath: string, workspaceRoot: string, options: ResolveWorkspacePathOptions = {}): ResolvedWorkspacePath {
  if (typeof rawPath !== "string" || rawPath.trim() === "") {
    throw new Error("Workspace path is required");
  }
  if (typeof workspaceRoot !== "string" || workspaceRoot.trim() === "") {
    throw new Error("Workspace root is required");
  }
  if (rawPath.includes("\0")) {
    throw new Error("Workspace path contains an invalid null byte");
  }
  if (looksLikeUri(rawPath)) {
    throw new Error("Workspace path must be a filesystem path, not a URI");
  }

  const normalizedInput = rawPath.replace(/\\/g, "/");
  const inputSegments = normalizedInput.split("/").filter(Boolean);
  if (inputSegments.includes("..")) {
    throw new Error("Workspace path cannot contain '..' traversal");
  }

  const root = path.resolve(workspaceRoot);
  const absoluteInput = path.isAbsolute(rawPath) ? path.resolve(rawPath) : path.resolve(root, rawPath);
  const relativePath = path.relative(root, absoluteInput);

  if (relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    throw new Error("Workspace path must stay inside the workspace");
  }

  const normalizedRelativePath = relativePath === "" ? "." : relativePath.replace(/\\/g, "/");
  if (!options.allowSensitive && isSensitiveWorkspacePath(normalizedRelativePath)) {
    throw new Error("Workspace path points to a sensitive file");
  }

  return {
    absolutePath: absoluteInput,
    relativePath: normalizedRelativePath,
  };
}

function createValidatingWorkspaceHost(host: ToolWorkspaceHost): ToolWorkspaceHost {
  function validate(rawPath: string): string {
    const rootPath = host.getRootPath();
    if (!rootPath) {
      throw new Error("No workspace folder open");
    }
    return resolveWorkspacePath(rawPath, rootPath).relativePath;
  }

  return {
    getRootPath: host.getRootPath.bind(host),
    readFile: (rawPath: string) => host.readFile(validate(rawPath)),
    writeFile: (rawPath: string, content: Uint8Array) => host.writeFile(validate(rawPath), content),
    stat: (rawPath: string) => host.stat(validate(rawPath)),
    createParentDirectory: (rawPath: string) => host.createParentDirectory(validate(rawPath)),
    readDirectory: (rawPath: string) => host.readDirectory(validate(rawPath)),
    prepareFileDiff: host.prepareFileDiff
      ? (rawPath: string, before: string, after: string) => host.prepareFileDiff!(validate(rawPath), before, after)
      : undefined,
    clearFileDiffPreview: host.clearFileDiffPreview ? () => host.clearFileDiffPreview!() : undefined,
  };
}

function looksLikeUri(rawPath: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(rawPath) && !/^[a-zA-Z]:[\\/]/.test(rawPath);
}

function isSensitiveWorkspacePath(relativePath: string): boolean {
  return relativePath
    .split("/")
    .filter(Boolean)
    .some((segment) => {
      const lower = segment.toLowerCase();
      return (
        /^\.env(?:\..*)?$/.test(lower) ||
        /^(id_rsa|id_dsa|id_ecdsa|id_ed25519)$/.test(lower) ||
        /\.(?:pem|key|p12|pfx|crt|cer|der)$/.test(lower) ||
        /(?:^|[._-])(?:token|tokens|secret|secrets|credential|credentials)(?:[._-]|$)/.test(lower)
      );
    });
}
