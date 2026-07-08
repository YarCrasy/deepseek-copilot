import type { PageContent } from "../Types";

export const intro: PageContent = {
  navTitle: "介绍",
  title: "介绍",
  description: "DeepSeek Copilot 介绍。",
  lead: "DeepSeek Copilot 设计上只支持 DeepSeek，在 VS Code 中提供专注的助手体验，不提供多供应商切换。",
  sections: [
    {
      title: "当前 beta 范围",
      items: [
        "侧边栏聊天和流式响应。",
        "Thinking mode 可以开启或关闭，但不会禁用工具。",
        "工作区工具可以读取文件、列出目录、搜索内容、创建文件和运行终端命令。",
        "在输入框输入 ./ 或 ../ 后会显示路径自动补全。",
        "在 Chat、History、Settings 之间切换时，待确认的工具调用会保留。",
      ],
    },
    {
      title: "非官方关系",
      items: ["这是一个独立的第三方扩展，不隶属于 DeepSeek，也不由 DeepSeek 赞助、认可或官方维护。"],
    },
  ],
};
