import type { TranslationCatalog } from "../Types";

export const confirmations = {
  confirmations: {
    reviewDetails: "Review details",
    reviewTool: "Review {tool}",
    reviewFileDescription: "Review the complete operation for {path} before choosing an action.",
    reviewToolDescription: "Review this {tool} operation before choosing an action.",
    completeArgumentsForTool: "Complete arguments for {tool}",
    roundRound: "Round {round}",
    openFileInEditor: "Open file in editor",
    filePath: "File: {path}",
    reviewBeforeExecuting: "Review before executing.",
    executeOnce: "Execute once",
    reject: "Reject",
    executeAllManualToolsOnce: "Execute all manual tools once",
    rejectAllManualTools: "Reject all manual tools",
    completeCommand: "Complete command",
    workingDirectory: "Working directory:",
    shell: "Shell:",
    trustMatchingOperationsThisSession: "Trust matching operations this session",
    cancel: "Cancel",
    yesExecuteOnce: "Yes, execute once",
    destructiveOnceDescription: "This destructive operation is approved once only. Destructive actions always require a separate confirmation.",
    sessionTrustDescription: "Execute once approves only this operation. Trust for this session approves matching safe operations until this VS Code session ends.",
    destructiveAction: "Destructive Action",
    potentiallyDangerousAction: "Potentially Dangerous Action",
    cautionRequired: "Caution Required"
  }
} satisfies TranslationCatalog;
