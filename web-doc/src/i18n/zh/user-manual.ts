import type { PageContent } from "../types";

export const userManual: PageContent = {
  navTitle: "用户手册",
  title: "用户手册",
  description: "如何配置和使用 DeepSeek Copilot。",
  lead: "基本流程是配置 API key、选择模型设置，然后从侧边栏提问。",
  sections: [
    {
      title: "日常流程",
      items: [
        "打开 Activity Bar 中的 DeepSeek Copilot。",
        "在 Settings 中设置 API key。密钥保存在 VS Code Secret Storage。",
        "选择模型、thinking mode、reasoning effort 和工具执行模式。",
        "在输入框输入 ./ 或 ../ 来补全工作区路径。",
        "执行工具前先检查待确认的工具调用，除非该工具处于安全的自动批准模式。",
        "使用 Stop generation 取消。被取消的提示会回到输入框，不会保存在历史中。",
      ],
    },
  ],
};
