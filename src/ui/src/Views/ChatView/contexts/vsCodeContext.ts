import { createContext } from "react";
import type { VsCodeApi } from "@webview/vscodeApi";

export const VsCodeContext = createContext<VsCodeApi | null>(null);
