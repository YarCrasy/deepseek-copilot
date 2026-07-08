import type { RegisteredTool } from "../Types";
import { readFileDefinition, readFileHandler, readFileMetadata } from "./ReadFile";
import { searchContentDefinition, searchContentHandler, searchContentMetadata } from "./SearchContent";
import { listDirDefinition, listDirHandler, listDirMetadata } from "./ListDir";
import { createFileDefinition, createFileHandler, createFileMetadata, createFileHandlerForced } from "./CreateFile";
import { editFileDefinition, editFileHandler, editFileMetadata, editFileHandlerForced } from "./EditFile";
import { applyPatchDefinition, applyPatchHandler, applyPatchMetadata, applyPatchHandlerForced } from "./ApplyPatch";
import { terminalCommandDefinition, terminalCommandHandler, terminalCommandMetadata, terminalCommandHandlerForced } from "./TerminalCommand";

/** Complete list of built-in tools. */
export const BUILT_IN_TOOLS: RegisteredTool[] = [
  { definition: readFileDefinition, handler: readFileHandler, metadata: readFileMetadata },
  { definition: searchContentDefinition, handler: searchContentHandler, metadata: searchContentMetadata },
  { definition: listDirDefinition, handler: listDirHandler, metadata: listDirMetadata },
  { definition: createFileDefinition, handler: createFileHandler, metadata: createFileMetadata },
  { definition: editFileDefinition, handler: editFileHandler, metadata: editFileMetadata },
  { definition: applyPatchDefinition, handler: applyPatchHandler, metadata: applyPatchMetadata },
  { definition: terminalCommandDefinition, handler: terminalCommandHandler, metadata: terminalCommandMetadata },
];

/** Forced handlers used after explicit user confirmation. */
export const FORCED_HANDLERS: Record<string, RegisteredTool["handler"]> = {
  create_file: createFileHandlerForced,
  edit_file: editFileHandlerForced,
  apply_patch: applyPatchHandlerForced,
  run_terminal_command: terminalCommandHandlerForced,
};
