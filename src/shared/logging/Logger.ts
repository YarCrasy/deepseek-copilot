export function logWarning(_message: string): void {
  // Intentionally silent: console.* in the extension host can force VS Code to
  // create output channels during reload/shutdown, which may hit disposed stores.
}

export function logError(_message: string, _error?: unknown): void {
  // Keep extension-host logging side-effect free until a managed logger exists.
}
