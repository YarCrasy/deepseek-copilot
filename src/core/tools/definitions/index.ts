// tools/definitions/index.ts — Barrel de herramientas incorporadas
// ── FASE 4.2: Metadatos de peligrosidad añadidos a cada herramienta ──

import type { RegisteredTool } from "../types";
import { readFileDefinition, readFileHandler, readFileMetadata } from "./readFile";
import { searchContentDefinition, searchContentHandler, searchContentMetadata } from "./searchContent";
import { listDirDefinition, listDirHandler, listDirMetadata } from "./listDir";
import { createFileDefinition, createFileHandler, createFileMetadata, createFileHandlerForced } from "./createFile";
import { terminalCommandDefinition, terminalCommandHandler, terminalCommandMetadata, terminalCommandHandlerForced } from "./terminalCommand";

/** Lista completa de herramientas registradas con metadatos */
export const BUILT_IN_TOOLS: RegisteredTool[] = [
  { definition: readFileDefinition, handler: readFileHandler, metadata: readFileMetadata },
  { definition: searchContentDefinition, handler: searchContentHandler, metadata: searchContentMetadata },
  { definition: listDirDefinition, handler: listDirHandler, metadata: listDirMetadata },
  { definition: createFileDefinition, handler: createFileHandler, metadata: createFileMetadata },
  { definition: terminalCommandDefinition, handler: terminalCommandHandler, metadata: terminalCommandMetadata },
];

/** Mapa de handlers forzados (saltan verificación de peligro) por nombre de herramienta */
export const FORCED_HANDLERS: Record<string, RegisteredTool["handler"]> = {
  create_file: createFileHandlerForced,
  run_terminal_command: terminalCommandHandlerForced,
};

export { readFileDefinition, readFileHandler, readFileMetadata } from "./readFile";
export { searchContentDefinition, searchContentHandler, searchContentMetadata } from "./searchContent";
export { listDirDefinition, listDirHandler, listDirMetadata } from "./listDir";
export { createFileDefinition, createFileHandler, createFileMetadata, createFileHandlerForced } from "./createFile";
export { terminalCommandDefinition, terminalCommandHandler, terminalCommandMetadata, terminalCommandHandlerForced } from "./terminalCommand";
