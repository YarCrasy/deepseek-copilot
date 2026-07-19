import type { TranslationCatalog } from "../Types";

export const tools = {
  tools: {
    permissionMode: "Permission mode",
    savedGloballyForAllWorkspaces: "Saved globally for all workspaces.",
    toolPermissions: "Tool permissions",
    noToolsAreAvailable: "No tools are available.",
    noToolsTheModelCanOnlyAnswerInChat: "No tools. The model can only answer in chat.",
    readOnlyDescription: "Read files, list directories, and search workspace content.",
    workspaceDescription: "Read-only tools plus file creation, edits, and patches in this workspace.",
    fullAccessDescription: "All tools, including terminal commands. Dangerous operations still require confirmation.",
    chat: "Chat",
    readOnly: "Read only",
    workspace: "Workspace",
    fullAccess: "Full access",
    disabled: "Disabled",
    enabled: "Enabled",
    autoApprove: "Auto approve",
    blockedByModePermissionMode: "Blocked by {mode} permission mode",
    nameMode: "{name} mode",
    toolCalls: "Tool calls",
    toolCall: "Tool call",
    pending: "Pending",
    awaitingConfirmation: "Awaiting confirmation",
    running: "Running",
    completed: "Completed",
    error: "Error",
    rejected: "Rejected",
    cancelled: "Cancelled",
    copyCall: "Copy call",
    copyToolData: "Copy {tool} data",
    copy: "Copy",
    insert: "Insert",
    copyArguments: "Copy arguments",
    copyResult: "Copy result",
    labelCopied: "{label} copied."
  }
} satisfies TranslationCatalog;
