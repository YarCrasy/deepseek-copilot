import type { TranslationCatalog } from "../Types";

export const confirmations = {
  "Review details": "查看详情",
  "Review {tool}": "检查 {tool}",
  "Review the complete operation for {path} before choosing an action.": "选择操作前请检查 {path} 的完整操作。",
  "Review this {tool} operation before choosing an action.": "选择操作前请检查此 {tool} 操作。",
  "Complete arguments for {tool}": "{tool} 的完整参数",
  "Round {round}": "第 {round} 轮",
  "Open file in editor": "在编辑器中打开文件",
  "File: {path}": "文件：{path}",
  "Review before executing.": "执行前请检查此操作。",
  "Execute once": "执行一次",
  "Reject": "拒绝",
  "Execute all manual tools once": "执行一次所有手动工具",
  "Reject all manual tools": "拒绝所有手动工具",
  "Complete command": "完整命令",
  "Working directory:": "工作目录：",
  "Shell:": "Shell：",
  "Trust matching operations this session": "本次会话信任匹配操作",
  "Cancel": "取消",
  "Yes, execute once": "是，仅执行一次",
  "This destructive operation is approved once only. Destructive actions always require a separate confirmation.": "此破坏性操作仅批准一次；破坏性操作始终需要单独确认。",
  "Execute once approves only this operation. Trust for this session approves matching safe operations until this VS Code session ends.": "执行一次仅批准当前操作；会话信任会批准匹配的安全操作，直到本次 VS Code 会话结束。",
  "Destructive Action": "破坏性操作",
  "Potentially Dangerous Action": "潜在危险操作",
  "Caution Required": "需要谨慎"
} satisfies TranslationCatalog;
