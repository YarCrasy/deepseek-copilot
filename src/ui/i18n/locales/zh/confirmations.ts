import type { TranslationCatalog } from "../Types";

export const confirmations = {
  confirmations: {
    reviewDetails: "查看详情",
    reviewTool: "检查 {tool}",
    reviewFileDescription: "选择操作前请检查 {path} 的完整操作。",
    reviewToolDescription: "选择操作前请检查此 {tool} 操作。",
    completeArgumentsForTool: "{tool} 的完整参数",
    roundRound: "第 {round} 轮",
    openFileInEditor: "在编辑器中打开文件",
    filePath: "文件：{path}",
    reviewBeforeExecuting: "执行前请检查此操作。",
    executeOnce: "执行一次",
    reject: "拒绝",
    executeAllManualToolsOnce: "执行一次所有手动工具",
    rejectAllManualTools: "拒绝所有手动工具",
    completeCommand: "完整命令",
    workingDirectory: "工作目录：",
    shell: "Shell：",
    trustMatchingOperationsThisSession: "本次会话信任匹配操作",
    cancel: "取消",
    yesExecuteOnce: "是，仅执行一次",
    destructiveOnceDescription: "此破坏性操作仅批准一次；破坏性操作始终需要单独确认。",
    sessionTrustDescription: "执行一次仅批准当前操作；会话信任会批准匹配的安全操作，直到本次 VS Code 会话结束。",
    destructiveAction: "破坏性操作",
    potentiallyDangerousAction: "潜在危险操作",
    cautionRequired: "需要谨慎"
  }
} satisfies TranslationCatalog;
