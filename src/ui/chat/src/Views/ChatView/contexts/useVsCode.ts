import { useContext } from "react";
import type { VsCodeApi } from "@webview/vscodeApi";
import { VsCodeContext } from "./vsCodeContext";

export function useVsCode(): VsCodeApi | null {
  return useContext(VsCodeContext);
}
