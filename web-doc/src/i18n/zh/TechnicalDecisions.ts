import type { PageContent } from "../Types";

export const technicalDecisions: PageContent = {
  navTitle: "技术决策",
  title: "技术决策",
  description: "Yar's DeepSeek Copilot 架构决策。",
  lead: "扩展将 VS Code API、DeepSeek API、核心工具逻辑和 React UI 分离。",
  sections: [
    {
      title: "规则",
      items: [
        "core 不得导入 vscode、React 或具体 HTTP 客户端。",
        "deepseekApi 负责 DeepSeek 协议、流式响应、模型和工具调用请求。",
        "vscodeApi 负责激活、命令、webview、工作区、文件和终端适配。",
        "ui 负责 React webview，并且只通过共享消息契约通信。",
        "web-doc 使用 Astro，并且必须支持英文、西班牙文和中文。",
        "源代码文件夹使用 camelCase，源代码实现文件使用 PascalCase。",
        "工具链、生成输出、路由文件和 barrel 文件保留生态要求的名称，例如 package.json、index.ts 和 Astro 路由文件。",
      ],
    },
  ],
};
