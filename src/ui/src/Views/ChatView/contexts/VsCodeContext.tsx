import { useMemo } from "react";
import { getVsCodeApi } from "@webview/vscodeApi";
import { VsCodeContext } from "./vsCodeContext";

export function VsCodeProvider({ children }: { children: React.ReactNode }) {
  const vscode = useMemo(() => getVsCodeApi(), []);
  return <VsCodeContext.Provider value={vscode}>{children}</VsCodeContext.Provider>;
}
